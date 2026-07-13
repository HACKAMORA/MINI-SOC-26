import https from "node:https";

const INDEXER_URL = process.env.WAZUH_INDEXER_URL ?? "https://localhost:9200";
const INDEXER_USER = process.env.WAZUH_INDEXER_USER ?? "admin";
const INDEXER_PASSWORD = process.env.WAZUH_INDEXER_PASSWORD ?? "";

const API_URL = process.env.WAZUH_API_URL ?? "https://localhost:55000";
const API_USER = process.env.WAZUH_API_USER ?? "wazuh-wui";
const API_PASSWORD = process.env.WAZUH_API_PASSWORD ?? "";

function basicAuthHeader(user: string, password: string) {
  return "Basic " + Buffer.from(`${user}:${password}`).toString("base64");
}

// Next.js's patched global `fetch` (Turbopack/undici) doesn't reliably
// accept a custom TLS dispatcher, which the self-signed Wazuh certs need.
// Using Node's native https module here sidesteps that entirely and is
// scoped to server-only code (this file is never imported client-side).
interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

function httpsJson<T = unknown>(url: string, options: RequestOptions = {}): Promise<{ status: number; json: T }> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: options.method ?? "GET",
        headers: options.headers,
        rejectUnauthorized: false, // lab-only: self-signed Wazuh certs
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          try {
            resolve({ status: res.statusCode ?? 0, json: text ? JSON.parse(text) : (undefined as T) });
          } catch {
            reject(new Error(`Invalid JSON response (status ${res.statusCode}): ${text.slice(0, 200)}`));
          }
        });
      }
    );
    req.on("error", reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function indexerSearch(body: unknown, index = "wazuh-alerts-*") {
  const { status, json } = await httpsJson(`${INDEXER_URL}/${index}/_search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: basicAuthHeader(INDEXER_USER, INDEXER_PASSWORD),
    },
    body: JSON.stringify(body),
  });
  if (status >= 400) {
    throw new Error(`Wazuh indexer error ${status}: ${JSON.stringify(json)}`);
  }
  return json as {
    hits: { hits: unknown[] };
    aggregations?: { by_severity?: { buckets: unknown[] } };
  };
}

export type Severity = "critical" | "high" | "medium" | "low";

export function levelToSeverity(level: number): Severity {
  if (level >= 15) return "critical";
  if (level >= 12) return "high";
  if (level >= 7) return "medium";
  return "low";
}

export interface AlertRow {
  id: string;
  timestamp: string;
  agentName: string;
  agentId: string;
  ruleId: string;
  description: string;
  level: number;
  severity: Severity;
  groups: string[];
  mitreTechniques: string[];
  srcIp?: string;
  destIp?: string;
}

export interface AlertsFilter {
  // Required, never optional: every caller must scope to a Wazuh agent
  // group derived from the authenticated session (brique 9 isolation).
  // Never accept this value from client input — see app/api/alerts/route.ts.
  group: string;
  size?: number;
  agentName?: string;
  severity?: Severity;
  source?: string; // matches rule.groups, e.g. "sysmon", "suricata", "windows"
  search?: string; // free text on rule.description
}

function severityLevelRange(severity: Severity): { gte: number; lte?: number } {
  switch (severity) {
    case "critical":
      return { gte: 15 };
    case "high":
      return { gte: 12, lte: 14 };
    case "medium":
      return { gte: 7, lte: 11 };
    case "low":
      return { gte: 0, lte: 6 };
  }
}

export async function getAlerts(filter: AlertsFilter): Promise<AlertRow[]> {
  const agentIds = await getAgentIdsForGroup(filter.group);
  if (agentIds.length === 0) return [];

  const must: unknown[] = [{ terms: { "agent.id": agentIds } }];
  if (filter.agentName) must.push({ match: { "agent.name": filter.agentName } });
  if (filter.source) must.push({ match: { "rule.groups": filter.source } });
  if (filter.search) {
    must.push({ match_phrase_prefix: { "rule.description": filter.search } });
  }
  if (filter.severity) {
    const range = severityLevelRange(filter.severity);
    must.push({ range: { "rule.level": range } });
  }

  const body = await indexerSearch({
    size: filter.size ?? 50,
    sort: [{ timestamp: { order: "desc" } }],
    query: { bool: { must } },
  });

  interface Hit {
    _id: string;
    _source: {
      timestamp?: string;
      "@timestamp"?: string;
      agent?: { name?: string; id?: string };
      rule?: {
        id?: string;
        description?: string;
        level?: number;
        groups?: string[];
        mitre?: { technique?: string[] };
      };
      data?: { src_ip?: string; dest_ip?: string; srcip?: string };
    };
  }

  return (body.hits.hits as Hit[]).map((hit) => {
    const level = hit._source.rule?.level ?? 0;
    return {
      id: hit._id,
      timestamp: hit._source.timestamp ?? hit._source["@timestamp"] ?? "",
      agentName: hit._source.agent?.name ?? "unknown",
      agentId: hit._source.agent?.id ?? "000",
      ruleId: hit._source.rule?.id ?? "",
      description: hit._source.rule?.description ?? "(no description)",
      level,
      severity: levelToSeverity(level),
      groups: hit._source.rule?.groups ?? [],
      mitreTechniques: hit._source.rule?.mitre?.technique ?? [],
      srcIp: hit._source.data?.src_ip ?? hit._source.data?.srcip,
      destIp: hit._source.data?.dest_ip,
    };
  });
}

export interface SeverityCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

export async function getSeverityCounts(group: string, hoursBack = 24): Promise<SeverityCounts> {
  const agentIds = await getAgentIdsForGroup(group);
  if (agentIds.length === 0) {
    return { critical: 0, high: 0, medium: 0, low: 0, total: 0 };
  }

  const body = await indexerSearch({
    size: 0,
    query: {
      bool: {
        must: [
          { terms: { "agent.id": agentIds } },
          { range: { timestamp: { gte: `now-${hoursBack}h` } } },
        ],
      },
    },
    aggs: {
      by_severity: {
        range: {
          field: "rule.level",
          ranges: [
            { key: "low", from: 0, to: 7 },
            { key: "medium", from: 7, to: 12 },
            { key: "high", from: 12, to: 15 },
            { key: "critical", from: 15 },
          ],
        },
      },
    },
  });

  const buckets = body.aggregations?.by_severity?.buckets ?? [];
  const counts: SeverityCounts = { critical: 0, high: 0, medium: 0, low: 0, total: 0 };
  for (const b of buckets as { key: Severity; doc_count: number }[]) {
    counts[b.key] = b.doc_count;
    counts.total += b.doc_count;
  }
  return counts;
}

export interface AgentSummary {
  id: string;
  name: string;
  ip: string;
  status: string;
  os: string;
  lastKeepAlive: string;
}

let apiTokenCache: { token: string; expiresAt: number } | null = null;

async function getApiToken(): Promise<string> {
  if (apiTokenCache && apiTokenCache.expiresAt > Date.now()) {
    return apiTokenCache.token;
  }
  const { status, json } = await httpsJson<{ data: { token: string } }>(
    `${API_URL}/security/user/authenticate`,
    {
      method: "POST",
      headers: { Authorization: basicAuthHeader(API_USER, API_PASSWORD) },
    }
  );
  if (status >= 400) {
    throw new Error(`Wazuh API auth error ${status}: ${JSON.stringify(json)}`);
  }
  const token = json.data.token;
  apiTokenCache = { token, expiresAt: Date.now() + 10 * 60 * 1000 };
  return token;
}

// Resolves a Wazuh agent *group* (see docs/07-dashboard-auth.md — every
// user has one, derived at account creation) to the concrete agent IDs
// currently in it. Alert/stat queries filter by these IDs since the
// alerts index itself carries no group field — only the Manager API does.
export async function getAgentIdsForGroup(group: string): Promise<string[]> {
  const token = await getApiToken();
  const { status, json } = await httpsJson<{ data: { affected_items: { id: string }[] } }>(
    `${API_URL}/agents?group=${encodeURIComponent(group)}&select=id`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (status >= 400) {
    throw new Error(`Wazuh API error ${status}: ${JSON.stringify(json)}`);
  }
  return json.data.affected_items.map((a) => a.id);
}

export async function getAgents(group: string): Promise<AgentSummary[]> {
  const token = await getApiToken();
  const { status, json } = await httpsJson<{ data: { affected_items: unknown[] } }>(
    `${API_URL}/agents?group=${encodeURIComponent(group)}&select=id,name,ip,status,os.name,os.platform,lastKeepAlive`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (status >= 400) {
    throw new Error(`Wazuh API error ${status}: ${JSON.stringify(json)}`);
  }
  interface ApiAgent {
    id: string;
    name: string;
    ip?: string;
    status: string;
    os?: { name?: string; platform?: string };
    lastKeepAlive?: string;
  }
  return (json.data.affected_items as ApiAgent[]).map((a) => ({
    id: a.id,
    name: a.name,
    ip: a.ip ?? "-",
    status: a.status,
    os: a.os?.name ?? a.os?.platform ?? "-",
    lastKeepAlive: a.lastKeepAlive ?? "-",
  }));
}
