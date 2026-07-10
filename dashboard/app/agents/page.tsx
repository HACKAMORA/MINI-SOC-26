import { AgentsPanel } from "@/components/AgentsPanel";

export default function AgentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Agents</h1>
        <p className="mt-1 text-sm text-muted">
          Endpoints surveillés par Wazuh et leur statut de connexion.
        </p>
      </div>
      <div className="max-w-2xl">
        <AgentsPanel />
      </div>
    </div>
  );
}
