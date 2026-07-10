"use client";

import { useEffect, useState } from "react";
import type { AgentSummary } from "@/lib/wazuh";
import { IconDot } from "./icons";

const statusStyle: Record<string, string> = {
  active: "text-low",
  disconnected: "text-critical",
  pending: "text-high",
  never_connected: "text-muted",
};

const statusLabel: Record<string, string> = {
  active: "Actif",
  disconnected: "Déconnecté",
  pending: "En attente",
  never_connected: "Jamais connecté",
};

export function AgentsPanel({ compact = false }: { compact?: boolean }) {
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/agents");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "erreur inconnue");
        if (!cancelled) setAgents(json.agents);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "erreur inconnue");
      }
    }
    load();
    const id = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">Agents</h2>
      </div>
      {error ? (
        <div className="px-5 py-4 text-sm text-critical">
          Impossible de contacter l&rsquo;API Wazuh : {error}
        </div>
      ) : (
        <ul className="divide-y divide-border/60">
          {agents.map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-5 py-3 text-sm">
              <IconDot className={`h-2 w-2 ${statusStyle[a.status] ?? "text-muted"}`} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground truncate">{a.name}</div>
                {!compact && <div className="text-xs text-muted truncate">{a.os} · {a.ip}</div>}
              </div>
              <span className={`text-xs font-medium ${statusStyle[a.status] ?? "text-muted"}`}>
                {statusLabel[a.status] ?? a.status}
              </span>
            </li>
          ))}
          {agents.length === 0 && !error && (
            <li className="px-5 py-6 text-center text-sm text-muted">Chargement...</li>
          )}
        </ul>
      )}
    </div>
  );
}
