"use client";

import { useEffect, useState } from "react";
import type { SeverityCounts } from "@/lib/wazuh";
import { StatCard } from "./StatCard";

export function StatsOverview() {
  const [counts, setCounts] = useState<SeverityCounts | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch("/api/stats");
      const json = await res.json();
      if (!cancelled && res.ok) setCounts(json.counts);
    }
    load();
    const id = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      <StatCard label="Total (24h)" value={counts?.total ?? "-"} accent="brand" />
      <StatCard label="Critique" value={counts?.critical ?? "-"} accent="critical" sublabel="Niveau ≥ 15" />
      <StatCard label="Haute" value={counts?.high ?? "-"} accent="high" sublabel="Niveau 12-14" />
      <StatCard label="Moyenne" value={counts?.medium ?? "-"} accent="medium" sublabel="Niveau 7-11" />
      <StatCard label="Faible" value={counts?.low ?? "-"} accent="low" sublabel="Niveau 0-6" />
    </div>
  );
}
