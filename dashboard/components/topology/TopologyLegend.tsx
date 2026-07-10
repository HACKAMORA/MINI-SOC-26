export function TopologyLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-border bg-surface px-5 py-3 text-xs text-muted">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-md border border-border bg-surface" />
        Infrastructure réelle (Wazuh, Sysmon, Suricata, MISP, TheHive)
      </div>
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-md border border-dashed border-border/70 bg-surface/40" />
        Parc simulé — illustratif, aucune donnée réelle
      </div>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-critical shadow-[0_0_6px_rgba(240,70,110,0.6)]" />
        Alerte en cours (couleur = sévérité)
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-block h-px w-6 border-t border-dashed border-border" />
        Intégration prévue, pas encore câblée
      </div>
    </div>
  );
}
