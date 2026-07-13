// Talks directly to the Wazuh Manager API over the internal Docker
// network (single-node_default) — no host port juggling needed here,
// unlike the dashboard which reaches it from outside Docker.
import https from "node:https";

const API_URL = process.env.WAZUH_API_URL ?? "https://wazuh.manager:55000";
const API_USER = process.env.WAZUH_API_USER ?? "wazuh-wui";
const API_PASSWORD = process.env.WAZUH_API_PASSWORD ?? "";

function basicAuthHeader() {
  return "Basic " + Buffer.from(`${API_USER}:${API_PASSWORD}`).toString("base64");
}

function request(method, path, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(API_URL + path);
    const req = https.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method,
        headers: token ? { Authorization: `Bearer ${token}` } : { Authorization: basicAuthHeader() },
        rejectUnauthorized: false, // lab-only: self-signed Wazuh certs
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          try {
            resolve({ status: res.statusCode, json: text ? JSON.parse(text) : undefined });
          } catch {
            reject(new Error(`Invalid JSON from Wazuh API (status ${res.statusCode}): ${text.slice(0, 200)}`));
          }
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

let tokenCache = null;

async function getToken() {
  if (tokenCache && tokenCache.expiresAt > Date.now()) return tokenCache.token;
  const { status, json } = await request("POST", "/security/user/authenticate");
  if (status >= 400) throw new Error(`Wazuh API auth failed: ${status}`);
  tokenCache = { token: json.data.token, expiresAt: Date.now() + 10 * 60 * 1000 };
  return tokenCache.token;
}

// Removes an agent's registration entirely (not just stopping it) so
// torn-down labs don't leave stale "disconnected" agents accumulating in
// the user's Wazuh group.
export async function removeAgent(agentName) {
  const token = await getToken();
  const list = await request("GET", `/agents?name=${encodeURIComponent(agentName)}&select=id`, token);
  const id = list.json?.data?.affected_items?.[0]?.id;
  if (!id) return; // never registered (e.g. container died before enrolling) — nothing to clean up
  // status=all bypasses the "must be disconnected" default; older_than=0s
  // bypasses the separate "must be disconnected for 7d" default safety
  // window — both needed to actually delete a just-stopped lab agent.
  const { json } = await request("DELETE", `/agents?agents_list=${id}&status=all&older_than=0s`, token);
  if (json?.error) throw new Error(`Wazuh agent removal failed: ${JSON.stringify(json.data?.failed_items)}`);
}
