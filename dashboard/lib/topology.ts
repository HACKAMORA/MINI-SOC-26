// Static topology description for the network graph view.
//
// "real" nodes correspond to actual infrastructure in this project (see
// docs/01 through docs/05) and get their live status/alerts from the Wazuh
// indexer + API. "simulated" nodes are illustrative placeholders standing
// in for a broader fleet this lab doesn't actually run — they carry no
// live data and are always styled distinctly (dashed border, muted color,
// "Simulé" badge) so the graph never misrepresents what's really deployed.

export type NodeKind = "attacker" | "endpoint" | "collector" | "enrichment";
export type NodeOrigin = "real" | "simulated";

export interface TopologyNode {
  id: string;
  label: string;
  sublabel: string;
  kind: NodeKind;
  origin: NodeOrigin;
  x: number;
  y: number;
  // For "real" nodes tied to a Wazuh agent, the agent name used to match
  // live alerts/status. Absent for service nodes (manager/misp/thehive).
  agentName?: string;
}

export interface TopologyEdge {
  id: string;
  source: string;
  target: string;
  origin: NodeOrigin;
  // "planned" edges represent an integration documented as a next step
  // (e.g. Wazuh -> MISP) but not yet wired programmatically.
  status: "active" | "planned";
  label?: string;
}

export const topologyNodes: TopologyNode[] = [
  // --- Real infrastructure (see docs/01-05) ---
  {
    id: "attacker-host",
    label: "Hôte Windows",
    sublabel: "Attaquant + capteur Suricata",
    kind: "attacker",
    origin: "real",
    x: 40,
    y: 260,
  },
  {
    id: "victim-win10",
    label: "victim-win10",
    sublabel: "Windows 10 + Sysmon",
    kind: "endpoint",
    origin: "real",
    x: 320,
    y: 100,
    agentName: "victim-win10",
  },
  {
    id: "wazuh-manager",
    label: "Wazuh Manager",
    sublabel: "SIEM — collecte & corrélation",
    kind: "collector",
    origin: "real",
    x: 600,
    y: 260,
  },
  {
    id: "misp",
    label: "MISP",
    sublabel: "Threat Intelligence",
    kind: "enrichment",
    origin: "real",
    x: 880,
    y: 130,
  },
  {
    id: "thehive",
    label: "TheHive + Cortex",
    sublabel: "Gestion d'incidents",
    kind: "enrichment",
    origin: "real",
    x: 880,
    y: 390,
  },

  // --- Simulated fleet (illustrative only, no live data) ---
  { id: "sim-comptabilite", label: "PC-Comptabilité", sublabel: "Simulé", kind: "endpoint", origin: "simulated", x: 320, y: 460 },
  { id: "sim-rh", label: "PC-RH", sublabel: "Simulé", kind: "endpoint", origin: "simulated", x: 500, y: 540 },
  { id: "sim-direction", label: "PC-Direction", sublabel: "Simulé", kind: "endpoint", origin: "simulated", x: 680, y: 540 },
  { id: "sim-fileserver", label: "Serveur de fichiers", sublabel: "Simulé", kind: "endpoint", origin: "simulated", x: 320, y: 620 },
  { id: "sim-printer", label: "Imprimante réseau", sublabel: "Simulé", kind: "endpoint", origin: "simulated", x: 500, y: 680 },
];

export const topologyEdges: TopologyEdge[] = [
  { id: "e-atk-victim", source: "attacker-host", target: "victim-win10", origin: "real", status: "active", label: "trafic réseau" },
  { id: "e-atk-manager", source: "attacker-host", target: "wazuh-manager", origin: "real", status: "active", label: "alertes Suricata" },
  { id: "e-victim-manager", source: "victim-win10", target: "wazuh-manager", origin: "real", status: "active", label: "agent Wazuh" },
  { id: "e-manager-misp", source: "wazuh-manager", target: "misp", origin: "real", status: "planned", label: "enrichissement IOC (prévu)" },
  { id: "e-manager-thehive", source: "wazuh-manager", target: "thehive", origin: "real", status: "planned", label: "création de cas (prévu)" },

  { id: "e-sim-1", source: "sim-comptabilite", target: "wazuh-manager", origin: "simulated", status: "active" },
  { id: "e-sim-2", source: "sim-rh", target: "wazuh-manager", origin: "simulated", status: "active" },
  { id: "e-sim-3", source: "sim-direction", target: "wazuh-manager", origin: "simulated", status: "active" },
  { id: "e-sim-4", source: "sim-fileserver", target: "wazuh-manager", origin: "simulated", status: "active" },
  { id: "e-sim-5", source: "sim-printer", target: "wazuh-manager", origin: "simulated", status: "active" },
];
