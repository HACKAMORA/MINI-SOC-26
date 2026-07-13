import { LabPanel } from "@/components/LabPanel";

export default function LabPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Mon labo</h1>
        <p className="mt-1 text-sm text-muted">
          Une cible et un poste attaquant isolés, rien qu&rsquo;à toi, provisionnés à la demande.
        </p>
      </div>
      <LabPanel />
    </div>
  );
}
