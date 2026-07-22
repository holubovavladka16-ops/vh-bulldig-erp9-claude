"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Lock, Clock } from "lucide-react";
import type { ModuleDef } from "@/lib/modules";
import CompanyLogo from "@/components/CompanyLogo";

interface Props {
  modules: ModuleDef[];
  companyName: string;
  logoUrl?: string | null;
}

export default function LeftNav({ modules, companyName, logoUrl = null }: Props) {
  const pathname = usePathname();

  return (
    <nav className="hidden w-64 shrink-0 flex-col border-r border-glass-border bg-base-900/60 backdrop-blur-xs md:flex">
      <div className="flex items-center gap-2 border-b border-glass-border px-5 py-5">
        <CompanyLogo logoUrl={logoUrl} size={36} />
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-semibold text-white">
            VH Bulldig ERP 9
          </p>
          <p className="truncate text-xs text-white/40">{companyName}</p>
        </div>
      </div>

      <ul className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {modules.map((m) => {
          const href = m.key === "dashboard" ? "/dashboard" : `/moduly/${m.key}`;
          const active = pathname === href;
          const available = m.status === "hotovo";

          const content = (
            <span className="flex items-center gap-3 truncate">
              {m.key === "dashboard" ? (
                <LayoutDashboard size={16} className="shrink-0" />
              ) : available ? (
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-turquoise" />
              ) : (
                <Clock size={14} className="shrink-0 text-white/30" />
              )}
              <span className="truncate">{m.label}</span>
              {!available && <Lock size={12} className="ml-auto shrink-0 text-white/25" />}
            </span>
          );

          return (
            <li key={m.key}>
              <Link
                href={href}
                className={`block rounded-xl px-3 py-2.5 text-sm transition ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                {content}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
