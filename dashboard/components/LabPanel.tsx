"use client";

import { useCallback, useEffect, useState } from "react";
import { IconShield, IconServer, IconRefresh } from "./icons";

interface Lab {
  id: string;
  status: string;
  createdAt: string;
  victim: { name: string };
  attacker: { name: string; terminalPort?: string };
}

export function LabPanel() {
  const [lab, setLab] = useState<Lab | null | undefined>(undefined); // undefined = loading
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/lab");
    const json = await res.json();
    setLab(res.ok ? json.lab : null);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function launch() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/lab", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "erreur inconnue");
      setLab(json.lab);
    } catch (e) {
      setError(e instanceof Error ? e.message : "erreur inconnue");
    } finally {
      setBusy(false);
    }
  }

  async function stop() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/lab", { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "erreur inconnue");
      setLab(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "erreur inconnue");
    } finally {
      setBusy(false);
    }
  }

  if (lab === undefined) {
    return <div className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted">Chargement...</div>;
  }

  if (!lab) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-brand">
          <IconShield className="h-6 w-6" />
        </div>
        <h2 className="text-base font-semibold text-foreground">Aucun labo actif</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Lance ton propre labo isolé : une cible Linux (agent Wazuh, dans ton groupe)
          et un poste attaquant avec terminal web, sur un réseau dédié à ta seule session.
        </p>
        {error && <p className="mt-3 text-xs text-critical">{error}</p>}
        <button
          onClick={launch}
          disabled={busy}
          className="mt-5 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
        >
          {busy ? "Lancement..." : "Lancer mon labo"}
        </button>
      </div>
    );
  }

  const terminalUrl = lab.attacker.terminalPort
    ? `http://localhost:${lab.attacker.terminalPort}`
    : null;

  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <span className="h-2 w-2 rounded-full bg-low" />
        <h2 className="text-sm font-semibold text-foreground">Labo actif</h2>
        <button
          onClick={load}
          className="ml-auto flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
        >
          <IconRefresh className="h-3.5 w-3.5" />
          Actualiser
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
        <div className="rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-muted">
            <IconServer className="h-4 w-4" />
            Cible (victime)
          </div>
          <div className="mt-2 text-sm text-foreground">{lab.victim.name}</div>
          <div className="mt-1 text-xs text-muted">Agent Wazuh — visible dans Agents/Alertes</div>
        </div>

        <div className="rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-muted">
            <IconShield className="h-4 w-4" />
            Attaquant
          </div>
          <div className="mt-2 text-sm text-foreground">{lab.attacker.name}</div>
          {terminalUrl ? (
            <a
              href={terminalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block rounded-md bg-brand-soft px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand hover:text-white transition-colors"
            >
              Ouvrir le terminal ↗
            </a>
          ) : (
            <div className="mt-2 text-xs text-muted">Terminal en cours de démarrage...</div>
          )}
        </div>
      </div>

      {error && <p className="px-5 pb-2 text-xs text-critical">{error}</p>}

      <div className="border-t border-border px-5 py-4">
        <button
          onClick={stop}
          disabled={busy}
          className="rounded-lg border border-critical/40 px-4 py-2 text-sm font-medium text-critical transition-colors hover:bg-critical-soft disabled:opacity-60"
        >
          {busy ? "Arrêt..." : "Arrêter mon labo"}
        </button>
      </div>
    </div>
  );
}
