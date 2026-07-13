import Link from "next/link";
import {
  IconShield,
  IconServer,
  IconDatabase,
  IconFolder,
  IconShare,
  IconBell,
  IconPlay,
} from "@/components/icons";

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

const stack = ["Wazuh", "Sysmon", "Suricata", "MISP", "TheHive", "Cortex", "Next.js", "Docker", "Auth.js", "Prisma"];

export default function LandingPage() {
  return (
    <div className="landing min-h-screen">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="animate-fade-up flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-landing-accent text-white">
            <IconShield className="h-4.5 w-4.5" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-landing-ink">Mini-SOC</span>
        </div>

        <nav
          className="animate-fade-up hidden items-center gap-1 rounded-full border border-landing-line bg-landing-surface px-2 py-1.5 shadow-sm sm:flex"
          style={{ animationDelay: "80ms" }}
        >
          {[
            { href: "#briques", label: "Les briques" },
            { href: "#stack", label: "La stack" },
            { href: "https://github.com/HACKAMORA/MINI-SOC-26", label: "GitHub" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              target={item.href.startsWith("http") ? "_blank" : undefined}
              rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="rounded-full px-4 py-1.5 text-sm text-landing-ink/80 transition-colors hover:bg-landing-accent-soft hover:text-landing-accent"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <Link
          href="/login"
          className="animate-fade-up flex items-center gap-2 rounded-full bg-landing-ink px-5 py-2.5 text-sm font-medium text-landing-bg transition-transform hover:scale-105"
          style={{ animationDelay: "140ms" }}
        >
          <IconShield className="h-3.5 w-3.5" />
          Se connecter
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 py-12 lg:grid-cols-2 lg:py-20">
        <div>
          <div
            className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-landing-line bg-landing-surface px-4 py-2 text-xs text-landing-muted shadow-sm"
            style={{ animationDelay: "60ms" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-landing-accent" />
            10 briques · MITRE ATT&CK · projet étudiant INPT
          </div>

          <h1
            className="animate-fade-up mt-6 text-5xl leading-[1.05] tracking-tight text-landing-ink sm:text-6xl"
            style={{ animationDelay: "140ms" }}
          >
            <span className="font-serif italic">Détecter.</span>{" "}
            <span className="font-semibold">Investiguer.</span>
            <br />
            <span className="font-semibold">Répondre.</span>
          </h1>

          <p
            className="animate-fade-up mt-6 max-w-md text-base text-landing-muted sm:text-lg"
            style={{ animationDelay: "220ms" }}
          >
            Un SOC simulé de bout en bout — détection, enrichissement, gestion
            d&rsquo;incidents — et une plateforme où chacun lance son propre
            labo isolé, en quelques secondes.
          </p>

          <div
            className="animate-fade-up mt-8 flex max-w-md items-center gap-2 rounded-full border border-landing-line bg-landing-surface p-2 shadow-sm"
            style={{ animationDelay: "300ms" }}
          >
            <span className="flex-1 truncate px-3 text-sm text-landing-muted">
              Rechercher une brique, une alerte...
            </span>
            <Link
              href="/login"
              className="shrink-0 rounded-full bg-landing-accent px-5 py-2.5 text-sm font-medium text-white transition-transform hover:scale-105"
            >
              Explorer →
            </Link>
          </div>

          <div
            className="animate-fade-up mt-4 flex flex-wrap items-center gap-3"
            style={{ animationDelay: "360ms" }}
          >
            <a
              href="#briques"
              className="rounded-full border border-landing-line bg-landing-surface px-5 py-2.5 text-sm font-medium text-landing-ink shadow-sm transition-transform hover:scale-105"
            >
              Voir les briques
            </a>
            <a
              href="https://github.com/HACKAMORA/MINI-SOC-26"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-landing-line bg-landing-surface px-5 py-2.5 text-sm font-medium text-landing-ink shadow-sm transition-transform hover:scale-105"
            >
              Code source ↗
            </a>
          </div>
        </div>

        {/* Decorative dashboard-preview illustration */}
        <div className="animate-fade-up relative h-[420px]" style={{ animationDelay: "200ms" }}>
          <div className="absolute inset-0 -z-10">
            <div className="animate-float-slow absolute left-4 top-6 h-56 w-56 rounded-full bg-landing-accent/20 blur-3xl" />
            <div className="animate-float-slower absolute bottom-4 right-4 h-56 w-56 rounded-full bg-amber-300/25 blur-3xl" />
          </div>

          <div className="animate-float-slow absolute left-1/2 top-1/2 w-[340px] -translate-x-1/2 -translate-y-1/2 rotate-[-3deg] rounded-2xl border border-landing-line bg-landing-surface p-5 shadow-xl">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-critical" />
              <span className="h-2.5 w-2.5 rounded-full bg-high" />
              <span className="h-2.5 w-2.5 rounded-full bg-low" />
              <span className="ml-auto text-[10px] text-landing-muted">wazuh.manager</span>
            </div>
            <div className="mt-4 space-y-2">
              {[
                { w: "92%", c: "bg-landing-accent" },
                { w: "68%", c: "bg-amber-400" },
                { w: "80%", c: "bg-landing-accent/60" },
                { w: "45%", c: "bg-landing-ink/20" },
              ].map((bar, i) => (
                <div key={i} className="h-2.5 w-full overflow-hidden rounded-full bg-landing-accent-soft">
                  <div className={`h-full rounded-full ${bar.c}`} style={{ width: bar.w }} />
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-[11px] text-landing-muted">
              <span>2 comptes isolés</span>
              <span>0 fuite</span>
            </div>
          </div>

          <div className="animate-float-slower absolute right-2 top-4 flex items-center gap-2 rounded-2xl border border-landing-line bg-landing-surface px-4 py-3 shadow-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-landing-accent-soft text-landing-accent">
              <IconPlay className="h-4 w-4" />
            </div>
            <div className="text-xs">
              <div className="font-medium text-landing-ink">Mon labo</div>
              <div className="text-landing-muted">prêt en ~10s</div>
            </div>
          </div>

          <div className="animate-float-slow absolute bottom-6 left-2 flex items-center gap-2 rounded-2xl border border-landing-line bg-landing-surface px-4 py-3 shadow-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-critical-soft text-critical">
              <IconBell className="h-4 w-4" />
            </div>
            <div className="text-xs">
              <div className="font-medium text-landing-ink">Alerte critique</div>
              <div className="text-landing-muted">T1110 · brute force</div>
            </div>
          </div>
        </div>
      </section>

      {/* Banner strip */}
      <section className="mx-auto max-w-6xl px-6">
        <div className="animate-fade-up flex flex-col items-center gap-4 rounded-3xl bg-landing-ink px-8 py-6 text-landing-bg sm:flex-row sm:justify-between">
          <div>
            <div className="text-sm font-medium">Projet open-source, du premier octet au dernier commit.</div>
            <div className="mt-1 text-xs text-landing-bg/60">
              Chaque brique documentée, testée, avec ses vrais incidents et leurs vraies solutions.
            </div>
          </div>
          <a
            href="https://github.com/HACKAMORA/MINI-SOC-26"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-full bg-landing-bg px-5 py-2.5 text-sm font-medium text-landing-ink transition-transform hover:scale-105"
          >
            Découvrir le repo →
          </a>
        </div>
      </section>

      {/* Stack marquee */}
      <section id="stack" className="mx-auto max-w-6xl overflow-hidden px-6 py-16">
        <p className="text-center text-xs uppercase tracking-widest text-landing-muted">Construit avec</p>
        <div className="mt-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="animate-marquee flex w-max gap-12">
            {[...stack, ...stack].map((t, i) => (
              <span key={i} className="text-lg font-medium text-landing-ink/40">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Briques grid */}
      <section id="briques" className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-4xl text-landing-ink">
          <span className="font-serif italic">À découvrir</span>{" "}
          <span className="font-semibold">dans ce SOC.</span>
        </h2>
        <p className="mt-3 max-w-md text-sm text-landing-muted">
          Chaque brique est déployée, testée de bout en bout et documentée
          avant de passer à la suivante.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {briques.map((b, i) => {
            const Icon = b.icon;
            const done = b.status === "déployé";
            return (
              <div
                key={b.n}
                className="animate-fade-up group rounded-2xl border border-landing-line bg-landing-surface p-5 shadow-sm transition-all hover:-translate-y-1.5 hover:shadow-lg"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-landing-accent-soft text-landing-accent transition-transform group-hover:scale-110">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <span className="font-serif text-lg italic text-landing-ink/30">#{b.n}</span>
                </div>
                <div className="mt-4 text-sm font-medium text-landing-ink">{b.name}</div>
                <div className="mt-1 text-xs text-landing-muted">{b.role}</div>
                <div className="mt-3 flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${done ? "bg-landing-accent" : "bg-amber-500"}`} />
                  <span className="text-[11px] text-landing-muted">{b.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-landing-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-xs text-landing-muted sm:flex-row">
          <span>Mini-SOC — projet étudiant, INPT.</span>
          <a
            href="https://github.com/HACKAMORA/MINI-SOC-26"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-landing-ink"
          >
            github.com/HACKAMORA/MINI-SOC-26
          </a>
        </div>
      </footer>
    </div>
  );
}
