"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  type Node,
  type Edge,
  type EdgeMarkerType,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { topologyNodes, topologyEdges } from "@/lib/topology";
import type { AlertRow, Severity } from "@/lib/wazuh";
import { TopologyNodeComponent, type TopologyNodeData } from "./TopologyNode";

const nodeTypes = { topology: TopologyNodeComponent };

const severityColor: Record<Severity, string> = {
  critical: "#f0466e",
  high: "#f5a623",
  medium: "#5b8def",
  low: "#3dd68c",
};

function severityRank(s: Severity): number {
  return { low: 0, medium: 1, high: 2, critical: 3 }[s];
}

export function TopologyGraph() {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [agentStatus, setAgentStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [alertsRes, agentsRes] = await Promise.all([
        fetch("/api/alerts?size=40").then((r) => r.json()),
        fetch("/api/agents").then((r) => r.json()),
      ]);
      if (cancelled) return;
      if (alertsRes.alerts) setAlerts(alertsRes.alerts);
      if (agentsRes.agents) {
        const map: Record<string, string> = {};
        for (const a of agentsRes.agents as { name: string; status: string }[]) {
          map[a.name] = a.status;
        }
        setAgentStatus(map);
      }
    }
    load();
    const id = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const { nodes, edges } = useMemo(() => {
    const victimSeverity = alerts
      .filter((a) => a.agentName === "victim-win10")
      .reduce<Severity | null>((max, a) => (!max || severityRank(a.severity) > severityRank(max) ? a.severity : max), null);

    const suricataSeverity = alerts
      .filter((a) => a.groups.includes("suricata"))
      .reduce<Severity | null>((max, a) => (!max || severityRank(a.severity) > severityRank(max) ? a.severity : max), null);

    const activeByNode: Record<string, Severity | null> = {
      "victim-win10": victimSeverity,
      "attacker-host": suricataSeverity,
      "wazuh-manager": victimSeverity || suricataSeverity,
    };

    const rfNodes: Node<TopologyNodeData>[] = topologyNodes.map((n) => ({
      id: n.id,
      type: "topology",
      position: { x: n.x, y: n.y },
      data: {
        label: n.label,
        sublabel: n.sublabel,
        kind: n.kind,
        origin: n.origin,
        activeSeverity: activeByNode[n.id] ?? null,
        agentStatus: n.agentName ? agentStatus[n.agentName] : undefined,
      },
      draggable: false,
    }));

    const edgeActivity: Record<string, Severity | null> = {
      "e-victim-manager": victimSeverity,
      "e-atk-manager": suricataSeverity,
      "e-atk-victim": suricataSeverity,
    };

    const rfEdges: Edge[] = topologyEdges.map((e) => {
      const active = edgeActivity[e.id] ?? null;
      const isSimulated = e.origin === "simulated";
      const isPlanned = e.status === "planned";

      const color = active ? severityColor[active] : isSimulated ? "#2a3040" : "#2a3040";

      return {
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        animated: Boolean(active) || isSimulated,
        style: {
          stroke: color,
          strokeWidth: active ? 2.5 : 1.5,
          strokeDasharray: isPlanned || isSimulated ? "4 4" : undefined,
          opacity: isPlanned ? 0.5 : 1,
        },
        labelStyle: { fill: "#8b92a5", fontSize: 10 },
        labelBgStyle: { fill: "#12151c", fillOpacity: 0.8 },
        markerEnd: active
          ? ({ type: MarkerType.ArrowClosed, color } as EdgeMarkerType as never)
          : undefined,
      };
    });

    return { nodes: rfNodes, edges: rfEdges };
  }, [alerts, agentStatus]);

  return (
    <div className="h-[640px] w-full overflow-hidden rounded-xl border border-border bg-surface">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        proOptions={{ hideAttribution: true }}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnScroll
        zoomOnScroll={false}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1f2430" />
      </ReactFlow>
    </div>
  );
}
