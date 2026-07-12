import { AlertsTable } from "@/components/AlertsTable";

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Alertes</h1>
        <p className="mt-1 text-sm text-muted">
          Toutes les alertes indexées par Wazuh, filtrables par sévérité, agent et source.
        </p>
      </div>
      <AlertsTable showFilters limit={100} title="Toutes les alertes" />
    </div>
  );
}
