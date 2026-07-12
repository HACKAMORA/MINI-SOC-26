"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { IconSearch } from "./icons";

export function TopBar() {
  const { data: session } = useSession();
  const [now, setNow] = useState<Date | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="flex h-16 items-center gap-4 border-b border-border bg-background/80 px-6 backdrop-blur">
      <div className="relative flex-1 max-w-md">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder="Rechercher une alerte, un agent..."
          className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </div>

      <div className="ml-auto flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-low" />
          Wazuh connecté
        </div>
        <div className="hidden sm:block text-xs tabular-nums text-muted">
          {now
            ? now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
            : "--:--:--"}
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white"
          >
            {session?.user?.email?.[0]?.toUpperCase() ?? "?"}
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-10 z-10 w-56 rounded-lg border border-border bg-surface p-2 shadow-lg">
              <div className="px-2 py-1.5 text-xs text-muted truncate">{session?.user?.email}</div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full rounded-md px-2 py-1.5 text-left text-sm text-foreground hover:bg-surface-hover"
              >
                Se déconnecter
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
