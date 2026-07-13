import Link from "next/link";
import { IconShield, IconServer, IconDatabase, IconFolder, IconShare, IconBell, IconPlay } from "@/components/icons";

const briques = [
  { n: 1, name: "Wazuh", role: "SIEM — collecte & corrélation", icon: IconServer, status: "déployé" },
  { n: 2, name: "Sysmon", role: "Visibilité endpoint Windows", icon: IconShield, status: "déployé" },
  { n: 3, name: "Suricata", role: "Détection réseau", icon: IconShare, status: "déployé" },
  { n: 4, name: "MISP", role: "Threat Intelligence", icon: IconDatabase, status: "déployé" },
  { n: 5, name: "TheHive + Cortex", role: "Gestion d'incidents", icon: IconFolder, status: "déployé" },
  { n: 6, name: "Dashboard", role: "Plateforme unifiée", icon: IconBell, status: "déployé" },
  { n: 7, name: "Hébergement cloud", role: "Serveur Linux dédié", icon: IconServer, status: "en attente" },
  { n: 8, name: "Authentification", role: "Auth.js + Prisma", icon: IconShield, status: "déployé" },
  { n: 9, name: "Isolation Wazuh", role: "Groupes par utilisateur", icon: IconDatabase, status: "déployé" },
  { n: 10, name: "Orchestrateur", role: "Labos isolés à la demande", icon: IconPlay, status: "déployé" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
            <IconShield className="h-4.5 w-4.5" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Mini-SOC</span>
        </div>
        <div className="hidden items-center gap-8 text-sm text-muted sm:flex">
          <a href="#briques" className="hover:text-foreground transition-colors">Briques</a>
          <a href="#stack" className="hover:text-foreground transition-colors">Stack</a>
          <a
            href="https://github.com/HACKAMORA/MINI-SOC-26"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            GitHub
          </a>
        </div>
        <Link
          href="/login"
          className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:border-brand hover:text-brand transition-colors"
        >
          Se connecter
        </Link>
      </header>

      {/* Hero */}
      <section className="relative mx-4 overflow-hidden rounded-[28px] border border-border sm:mx-6">
        <div className="bg-grain absolute inset-0 bg-[linear-gradient(135deg,#0a0c10_0%,#1a1030_35%,#2b1a4a_55%,#16324a_75%,#0c1f22_100%)]" />
        {/* dot grid, bottom-right */}
        <div
          className="pointer-events-none absolute -right-10 -bottom-10 h-72 w-72 opacity-40"
          style={{
            backgroundImage: "radial-gradient(var(--border) 1.4px, transparent 1.4px)",
            backgroundSize: "18px 18px",
          }}
        />
        {/* decorative glow */}
        <div className="pointer-events-none absolute right-[8%] top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-brand/30 blur-[100px]" />

        <div className="relative px-6 py-24 sm:px-14 sm:py-32">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-low" />
            10 briques · MITRE ATT&CK · projet étudiant INPT
          </div>

          <h1 className="max-w-3xl text-6xl font-semibold leading-[0.95] tracking-tight text-white sm:text-8xl">
            Security
            <br />
            <span className="bg-gradient-to-r from-brand via-medium to-low bg-clip-text text-transparent">
              Operations
            </span>
          </h1>

          <p className="mt-8 max-w-xl text-base text-white/70 sm:text-lg">
            Un SOC simulé de bout en bout : détection (Wazuh, Sysmon, Suricata),
            enrichissement (MISP, TheHive + Cortex), et une plateforme
            multi-utilisateurs où chacun lance son propre labo isolé.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/login"
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-background transition-transform hover:scale-[1.03]"
            >
              Se connecter →
            </Link>
            <a
              href="https://github.com/HACKAMORA/MINI-SOC-26"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-white/90 hover:bg-white/10 transition-colors"
            >
              Voir le code
            </a>
          </div>
        </div>
      </section>

      {/* Stack strip */}
      <section id="stack" className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-center text-xs uppercase tracking-widest text-muted">
          Construit avec
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm text-muted">
          {["Wazuh", "Sysmon", "Suricata", "MISP", "TheHive", "Cortex", "Next.js", "Docker"].map((t) => (
            <span key={t} className="font-medium">{t}</span>
          ))}
        </div>
      </section>

      {/* Briques grid */}
      <section id="briques" className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-semibold text-foreground">Construction progressive</h2>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Chaque brique est déployée, testée de bout en bout et documentée avant
          de passer à la suivante.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {briques.map((b) => {
            const Icon = b.icon;
            const done = b.status === "déployé";
            return (
              <div
                key={b.n}
                className="rounded-xl border border-border bg-surface p-4 transition-colors hover:border-brand/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-mono text-muted">#{b.n}</span>
                </div>
                <div className="mt-3 text-sm font-medium text-foreground">{b.name}</div>
                <div className="mt-1 text-xs text-muted">{b.role}</div>
                <div className="mt-3 flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${done ? "bg-low" : "bg-high"}`} />
                  <span className="text-[11px] text-muted">{b.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-xs text-muted sm:flex-row">
          <span>Mini-SOC — projet étudiant, INPT.</span>
          <a
            href="https://github.com/HACKAMORA/MINI-SOC-26"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            github.com/HACKAMORA/MINI-SOC-26
          </a>
        </div>
      </footer>
    </div>
  );
}
