import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface StatRow {
  label: string;
  value: string;
  tone?: "default" | "positive" | "negative";
}

interface Props {
  title: string;
  icon: LucideIcon;
  href: string;
  rows: StatRow[];
  pending?: boolean;
  pendingNote?: string;
}

const TONE_CLASSES: Record<string, string> = {
  default: "text-white",
  positive: "text-emerald-400",
  negative: "text-red-400",
};

export default function StatCard({ title, icon: Icon, href, rows, pending, pendingNote }: Props) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs transition hover:border-turquoise/40 hover:bg-white/[0.06]"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white/60">{title}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-gold">
          <Icon size={16} />
        </span>
      </div>

      {pending ? (
        <p className="text-sm text-white/35">
          {pendingNote ?? "Modul zatím nebyl vytvořen."}
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {rows.map((r) => (
            <div key={r.label} className="flex items-baseline justify-between gap-2">
              <span className="text-xs text-white/40">{r.label}</span>
              <span className={`font-display text-sm font-semibold ${TONE_CLASSES[r.tone ?? "default"]}`}>
                {r.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </Link>
  );
}
