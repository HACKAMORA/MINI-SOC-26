"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconGrid, IconBell, IconServer, IconDatabase, IconFolder, IconShield, IconShare, IconPlay } from "./icons";

const nav = [
  { href: "/", label: "Overview", icon: IconGrid },
  { href: "/alerts", label: "Alertes", icon: IconBell },
  { href: "/agents", label: "Agents", icon: IconServer },
  { href: "/topology", label: "Topologie", icon: IconShare },
];

const labNav = [{ href: "/lab", label: "Mon labo", icon: IconPlay }];

const soon = [
  { label: "Threat Intel", icon: IconDatabase },
  { label: "Incidents", icon: IconFolder },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-surface/60">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
          <IconShield className="h-4.5 w-4.5" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-foreground">Mini-SOC</div>
          <div className="text-[11px] text-muted">Security Operations</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <div className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted">
          Simulation
        </div>
        {labNav.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                active
                  ? "bg-brand-soft text-foreground font-medium"
                  : "text-muted hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "text-brand" : ""}`} />
              {item.label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand" />}
            </Link>
          );
        })}

        <div className="px-2 pb-2 pt-5 text-[11px] font-medium uppercase tracking-wider text-muted">
          Surveillance
        </div>
        {nav.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                active
                  ? "bg-brand-soft text-foreground font-medium"
                  : "text-muted hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "text-brand" : ""}`} />
              {item.label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand" />}
            </Link>
          );
        })}

        <div className="px-2 pb-2 pt-5 text-[11px] font-medium uppercase tracking-wider text-muted">
          Enrichissement
        </div>
        {soon.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted/60 cursor-not-allowed"
            >
              <Icon className="h-4 w-4" />
              {item.label}
              <span className="ml-auto rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted">
                bientôt
              </span>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <div className="rounded-lg bg-surface p-3 text-[11px] text-muted leading-relaxed">
          Wazuh · Sysmon · Suricata
          <br />
          MISP · TheHive + Cortex
        </div>
      </div>
    </aside>
  );
}
