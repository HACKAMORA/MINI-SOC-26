// Talks to the lab orchestrator's internal-only HTTP API (bound to
// 127.0.0.1, see orchestrator/docker-compose.yml). Plain HTTP, no TLS
// dispatcher workaround needed here (that was specifically for Wazuh's
// self-signed certs — see lib/wazuh.ts).
const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL ?? "http://127.0.0.1:4100";

export interface Lab {
  id: string;
  userId: string;
  wazuhGroup: string;
  status: string;
  createdAt: string;
  victim: { id: string; name: string };
  attacker: { id: string; name: string; terminalPort?: string };
}

async function call<T>(path: string, options: RequestInit = {}): Promise<{ status: number; body: T }> {
  const res = await fetch(`${ORCHESTRATOR_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
    cache: "no-store",
  });
  const body = (await res.json().catch(() => ({}))) as T;
  return { status: res.status, body };
}

export async function getLabForUser(userId: string): Promise<Lab | null> {
  const { body } = await call<{ lab: Lab | null }>(`/labs?userId=${encodeURIComponent(userId)}`);
  return body.lab;
}

export async function createLab(userId: string, wazuhGroup: string): Promise<Lab> {
  const { status, body } = await call<{ lab?: Lab; error?: string }>("/labs", {
    method: "POST",
    body: JSON.stringify({ userId, wazuhGroup }),
  });
  if (status >= 400 || !body.lab) {
    throw new Error(body.error ?? `orchestrator error (status ${status})`);
  }
  return body.lab;
}

export async function stopLab(labId: string): Promise<void> {
  const { status, body } = await call<{ error?: string }>(`/labs/${labId}`, { method: "DELETE" });
  if (status >= 400) {
    throw new Error(body.error ?? `orchestrator error (status ${status})`);
  }
}
