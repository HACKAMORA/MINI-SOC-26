import { StatsOverview } from "@/components/StatsOverview";
import { AlertsTable } from "@/components/AlertsTable";
import { AgentsPanel } from "@/components/AgentsPanel";

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Vue d&rsquo;ensemble</h1>
        <p className="mt-1 text-sm text-muted">
          Synthèse en direct des alertes remontées par Wazuh (Sysmon, Suricata, SCA).
        </p>
      </div>

      <StatsOverview />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AlertsTable limit={10} title="Alertes récentes" />
        </div>
        <AgentsPanel />
      </div>
    </div>
  );
}
