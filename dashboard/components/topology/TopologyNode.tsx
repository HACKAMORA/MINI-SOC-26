import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { NodeKind, NodeOrigin } from "@/lib/topology";
import type { Severity } from "@/lib/wazuh";
import { IconShield, IconServer, IconDatabase, IconFolder } from "@/components/icons";

const kindIcon: Record<NodeKind, typeof IconShield> = {
  attacker: IconShield,
  endpoint: IconServer,
  collector: IconDatabase,
  enrichment: IconFolder,
};

const severityRing: Record<Severity, string> = {
  critical: "ring-2 ring-critical shadow-[0_0_18px_rgba(240,70,110,0.5)]",
  high: "ring-2 ring-high shadow-[0_0_14px_rgba(245,166,35,0.4)]",
  medium: "ring-2 ring-medium",
  low: "ring-1 ring-low/60",
};

export type TopologyNodeData = {
  label: string;
  sublabel: string;
  kind: NodeKind;
  origin: NodeOrigin;
  activeSeverity: Severity | null;
  agentStatus?: string;
};

export function TopologyNodeComponent({ data }: NodeProps & { data: TopologyNodeData }) {
  const Icon = kindIcon[data.kind];
  const isSimulated = data.origin === "simulated";

  return (
    <div
      className={`relative w-44 rounded-xl border px-3 py-2.5 backdrop-blur transition-shadow ${
        isSimulated
          ? "border-dashed border-border/70 bg-surface/40"
          : `border-border bg-surface ${data.activeSeverity ? severityRing[data.activeSeverity] : ""}`
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-border !border-0 !w-1.5 !h-1.5" />
      <Handle type="source" position={Position.Right} className="!bg-border !border-0 !w-1.5 !h-1.5" />

      <div className="flex items-center gap-2">
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
            isSimulated ? "bg-border/40 text-muted" : "bg-brand-soft text-brand"
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0">
          <div className={`truncate text-xs font-semibold ${isSimulated ? "text-muted" : "text-foreground"}`}>
            {data.label}
          </div>
          <div className="truncate text-[10px] text-muted">{data.sublabel}</div>
        </div>
      </div>

      {isSimulated && (
        <span className="absolute -top-2 -right-2 rounded-full border border-border bg-background px-1.5 py-0.5 text-[9px] text-muted">
          simulé
        </span>
      )}
      {!isSimulated && data.agentStatus && (
        <span
          className={`absolute -top-1.5 -right-1.5 h-2.5 w-2.5 rounded-full border-2 border-background ${
            data.agentStatus === "active" ? "bg-low" : "bg-critical"
          }`}
        />
      )}
    </div>
  );
}
