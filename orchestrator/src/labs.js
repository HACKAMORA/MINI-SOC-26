import Docker from "dockerode";
import crypto from "node:crypto";
import { removeAgent } from "./wazuh.js";

const docker = new Docker({
  host: "docker-socket-proxy",
  port: 2375,
});

// Fixed, pre-approved images only — never pulled or chosen at request
// time. See orchestrator/attacker-image/Dockerfile for the attacker
// build; the victim reuses the same wazuh-agent image already proven in
// brique 9 (docs/08-wazuh-isolation.md).
const VICTIM_IMAGE = "wazuh/wazuh-agent:4.14.6";
const ATTACKER_IMAGE = "lab-attacker:latest";
const WAZUH_NETWORK = "single-node_default";
const WAZUH_MANAGER_SERVER = process.env.WAZUH_MANAGER_SERVER ?? "wazuh.manager";

// In-memory for this MVP slice (brique 10, first cut) — see
// docs/00-platform-plan.md "Phase 1 MVP cut line". Restarting the
// orchestrator loses track of running labs (the containers themselves
// keep running; a durable store is a follow-up, not a blocker for
// proving the mechanism).
const labs = new Map();

function shortId() {
  return crypto.randomBytes(4).toString("hex");
}

export async function createLab({ userId, wazuhGroup }) {
  const labId = shortId();
  const netName = `lab-net-${labId}`;
  const victimName = `lab-victim-${labId}`;
  const attackerName = `lab-attacker-${labId}`;

  // NOT Internal: true — Docker refuses to publish ports (e.g. ttyd) out
  // of an internal network at all, since it skips the NAT chain entirely.
  // Isolation between labs still holds: separate bridge networks don't
  // route to each other by default. Tradeoff accepted for this MVP slice:
  // lab containers do have outbound internet access. See
  // docs/09-lab-orchestrator.md limitations.
  const network = await docker.createNetwork({
    Name: netName,
    Driver: "bridge",
    Labels: { "mini-soc.lab": labId, "mini-soc.user": userId },
  });

  const victim = await docker.createContainer({
    name: victimName,
    Image: VICTIM_IMAGE,
    Env: [
      `WAZUH_MANAGER_SERVER=${WAZUH_MANAGER_SERVER}`,
      `WAZUH_AGENT_NAME=${victimName}`,
      `WAZUH_AGENT_GROUP=${wazuhGroup}`,
    ],
    Labels: { "mini-soc.lab": labId, "mini-soc.user": userId, "mini-soc.role": "victim" },
    HostConfig: {
      NetworkMode: netName,
      RestartPolicy: { Name: "unless-stopped" },
      PidsLimit: 200,
      Memory: 512 * 1024 * 1024,
      NanoCpus: 500_000_000, // 0.5 vCPU
      SecurityOpt: ["no-new-privileges"],
    },
  });
  await victim.start();
  // Second NIC so the agent can reach the shared Wazuh manager. The
  // attacker container is deliberately NOT attached here — it only ever
  // sees the isolated lab network, never Wazuh/MISP/TheHive directly.
  await docker.getNetwork(WAZUH_NETWORK).connect({ Container: victim.id });

  const attacker = await docker.createContainer({
    name: attackerName,
    Image: ATTACKER_IMAGE,
    Labels: { "mini-soc.lab": labId, "mini-soc.user": userId, "mini-soc.role": "attacker" },
    ExposedPorts: { "7681/tcp": {} },
    HostConfig: {
      NetworkMode: netName,
      PortBindings: { "7681/tcp": [{ HostPort: "" }] },
      RestartPolicy: { Name: "unless-stopped" },
      PidsLimit: 100,
      Memory: 256 * 1024 * 1024,
      NanoCpus: 500_000_000,
      CapDrop: ["ALL"],
      SecurityOpt: ["no-new-privileges"],
    },
  });
  await attacker.start();
  // Docker resolves the dynamic host port assignment asynchronously right
  // after start() — inspect() immediately after can race and see it
  // still empty. Poll briefly rather than trust a single read.
  let terminalPort;
  for (let attempt = 0; attempt < 10 && !terminalPort; attempt++) {
    const attackerInfo = await attacker.inspect();
    terminalPort = attackerInfo.NetworkSettings.Ports["7681/tcp"]?.[0]?.HostPort;
    if (!terminalPort) await new Promise((r) => setTimeout(r, 300));
  }

  const lab = {
    id: labId,
    userId,
    wazuhGroup,
    networkId: network.id,
    networkName: netName,
    victim: { id: victim.id, name: victimName },
    attacker: { id: attacker.id, name: attackerName, terminalPort },
    status: "running",
    createdAt: new Date().toISOString(),
  };
  labs.set(labId, lab);
  return lab;
}

export async function stopLab(labId) {
  const lab = labs.get(labId);
  if (!lab) return null;

  for (const c of [lab.attacker, lab.victim]) {
    try {
      const container = docker.getContainer(c.id);
      await container.stop({ t: 5 }).catch(() => {});
      await container.remove({ force: true });
    } catch (err) {
      console.error(`Failed to remove container ${c.name}:`, err.message);
    }
  }
  try {
    await docker.getNetwork(lab.networkId).remove();
  } catch (err) {
    console.error(`Failed to remove network ${lab.networkName}:`, err.message);
  }
  try {
    await removeAgent(lab.victim.name);
  } catch (err) {
    console.error(`Failed to deregister Wazuh agent ${lab.victim.name}:`, err.message);
  }

  labs.delete(labId);
  return { id: labId, status: "stopped" };
}

export function getLab(labId) {
  return labs.get(labId) ?? null;
}

export function listLabsForUser(userId) {
  return [...labs.values()].filter((l) => l.userId === userId);
}
