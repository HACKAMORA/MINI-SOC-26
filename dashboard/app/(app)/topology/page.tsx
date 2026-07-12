import { TopologyGraph } from "@/components/topology/TopologyGraph";
import { TopologyLegend } from "@/components/topology/TopologyLegend";

export default function TopologyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Topologie réseau</h1>
        <p className="mt-1 text-sm text-muted">
          Vue graphique de l&rsquo;infrastructure du Mini-SOC. Les liens s&rsquo;animent en direct
          selon les alertes réelles remontées par Wazuh.
        </p>
      </div>
      <TopologyLegend />
      <TopologyGraph />
    </div>
  );
}
