"use client";

import { useEffect, useState } from "react";
import { Bell, User as UserIcon } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";
import CompanyLogo from "@/components/CompanyLogo";

const ROLE_LABELS: Record<string, string> = {
  majitel: "Majitel",
  administrator: "Administrátor",
  ucetni: "Účetní",
  zamestnanec: "Zaměstnanec",
};

interface Props {
  fullName: string;
  role: string;
  alertsCount: number;
  logoUrl?: string | null;
}

export default function TopBar({ fullName, role, alertsCount, logoUrl = null }: Props) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const dateStr = now
    ? now.toLocaleDateString("cs-CZ", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "";
  const timeStr = now ? now.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <header className="flex items-center justify-between gap-4 border-b border-glass-border bg-base-900/40 px-4 py-3 backdrop-blur-xs md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <span className="md:hidden">
          <CompanyLogo logoUrl={logoUrl} size={32} />
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-semibold text-white md:text-base">
            VH Bulldig ERP 9
          </p>
          <p className="hidden truncate text-xs text-white/40 md:block">
            {dateStr} · {timeStr}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          aria-label="Upozornění"
          className="relative flex h-9 w-9 items-center justify-center rounded-full border border-glass-border text-white/70 transition hover:bg-white/5 hover:text-white"
        >
          <Bell size={16} />
          {alertsCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-turquoise px-1 text-[10px] font-semibold text-base-950">
              {alertsCount}
            </span>
          )}
        </button>

        <div className="hidden items-center gap-2 sm:flex">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-glass-border bg-white/5 text-gold">
            <UserIcon size={16} />
          </div>
          <div className="leading-tight">
            <p className="truncate text-sm font-medium text-white">{fullName}</p>
            <p className="truncate text-xs text-white/40">{ROLE_LABELS[role] ?? role}</p>
          </div>
        </div>

        <LogoutButton />
      </div>
    </header>
  );
}
