import Link from "next/link";
import type { ConstructionLogEntry } from "@/types/database.types";

export default function LogEntryCard({ entry, orderName }: { entry: ConstructionLogEntry; orderName: string }) {
  return (
    <Link
      href={`/moduly/stavebni-denik/${entry.id}`}
      className="flex flex-col gap-2 rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs transition hover:border-turquoise/40 hover:bg-white/[0.06]"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-display text-sm font-semibold text-white">
          {new Date(entry.log_date).toLocaleDateString("cs-CZ")}
        </p>
        <span className="text-xs text-white/40">{entry.worker_count} dělníků</span>
      </div>
      <p className="text-xs text-white/40">{orderName}</p>
      {entry.weather && <p className="text-xs text-white/35">Počasí: {entry.weather}</p>}
      <p className="text-sm text-white/70">{entry.daily_activity || "—"}</p>
      <span className="mt-1 inline-block self-start rounded-xl border border-glass-border px-3 py-1.5 text-xs font-medium text-white/70">
        Otevřít
      </span>
    </Link>
  );
}
