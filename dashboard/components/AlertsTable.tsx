"use client";

import { useCallback, useEffect, useState } from "react";
import type { AlertRow, Severity } from "@/lib/wazuh";
import { SeverityBadge } from "./SeverityBadge";
import { IconRefresh } from "./icons";

function sourceLabel(groups: string[]): string {
  if (groups.includes("sysmon")) return "Sysmon";
  if (groups.includes("suricata")) return "Suricata";
  if (groups.includes("sca")) return "SCA";
  if (groups.includes("windows")) return "Windows";
  if (groups.includes("vulnerability-detector")) return "Vuln.";
  return groups[0] ?? "-";
}

function formatTime(ts: string): string {
  if (!ts) return "-";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

type Props = {
  showFilters?: boolean;
  limit?: number;
  title?: string;
};

export function AlertsTable({ showFilters = false, limit = 15, title = "Alertes récentes" }: Props) {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [severity, setSeverity] = useState<Severity | "">("");
  const [source, setSource] = useState("");
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.set("size", String(limit));
    if (severity) params.set("severity", severity);
    if (source) params.set("source", source);
    if (query) params.set("q", query);
    try {
      const res = await fetch(`/api/alerts?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "erreur inconnue");
      setAlerts(json.alerts);
    } catch (e) {
      setError(e instanceof Error ? e.message : "erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [limit, severity, source, query]);

  useEffect(() => {
    load();
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
  }, [load]);

  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <button
          onClick={load}
          className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
        >
          <IconRefresh className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </button>

        {showFilters && (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filtrer par description..."
              className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand"
            />
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as Severity | "")}
              className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="">Toutes sévérités</option>
              <option value="critical">Critique</option>
              <option value="high">Haute</option>
              <option value="medium">Moyenne</option>
              <option value="low">Faible</option>
            </select>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="">Toutes sources</option>
              <option value="sysmon">Sysmon</option>
              <option value="suricata">Suricata</option>
              <option value="sca">SCA</option>
              <option value="windows">Windows</option>
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="px-5 py-4 text-sm text-critical">
          Impossible de contacter l&rsquo;indexer Wazuh : {error}
        </div>
      )}

      {!error && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="px-5 py-2.5 font-medium">Horodatage</th>
                <th className="px-3 py-2.5 font-medium">Sévérité</th>
                <th className="px-3 py-2.5 font-medium">Agent</th>
                <th className="px-3 py-2.5 font-medium">Source</th>
                <th className="px-3 py-2.5 font-medium">Description</th>
                <th className="px-3 py-2.5 font-medium">MITRE</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-border/60 last:border-0 hover:bg-surface-hover transition-colors"
                >
                  <td className="whitespace-nowrap px-5 py-2.5 text-xs tabular-nums text-muted">
                    {formatTime(a.timestamp)}
                  </td>
                  <td className="px-3 py-2.5">
                    <SeverityBadge severity={a.severity} />
                  </td>
                  <td className="px-3 py-2.5 text-foreground">{a.agentName}</td>
                  <td className="px-3 py-2.5 text-muted">{sourceLabel(a.groups)}</td>
                  <td className="px-3 py-2.5 text-foreground max-w-md truncate" title={a.description}>
                    {a.description}
                  </td>
                  <td className="px-3 py-2.5">
                    {a.mitreTechniques.length > 0 ? (
                      <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] text-brand">
                        {a.mitreTechniques[0]}
                        {a.mitreTechniques.length > 1 ? ` +${a.mitreTechniques.length - 1}` : ""}
                      </span>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && alerts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-muted">
                    Aucune alerte ne correspond à ces critères.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
