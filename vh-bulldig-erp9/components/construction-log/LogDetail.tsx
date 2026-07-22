import Link from "next/link";
import { Pencil } from "lucide-react";
import type { ConstructionLogEntry, ConstructionLogHistoryEntry } from "@/types/database.types";

const HISTORY_LABELS: Record<string, string> = {
  vytvoreni: "Vytvoření záznamu",
  zmena_data: "Změna data",
  zmena_zakazky: "Změna zakázky",
  zmena_pocasi: "Změna počasí",
  zmena_techniky: "Změna techniky",
  zmena_pocet_delniku: "Změna počtu dělníků",
  zmena_jmen: "Změna jmen dělníků",
  zmena_denni_cinnosti: "Změna denní činnosti",
  zmena_popisu: "Změna popisu prací",
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-white/5 py-2 last:border-0">
      <span className="text-xs text-white/40">{label}</span>
      <span className="text-right text-sm text-white/85">{value}</span>
    </div>
  );
}

interface Props {
  entry: ConstructionLogEntry;
  orderName: string;
  workerNames: string;
  history: ConstructionLogHistoryEntry[];
  canEdit: boolean;
  justSaved?: boolean;
}

export default function LogDetail({ entry, orderName, workerNames, history, canEdit, justSaved }: Props) {
  return (
    <div className="flex flex-col gap-6">
      {justSaved && (
        <p className="rounded-xl bg-turquoise/10 px-4 py-3 text-center text-sm text-turquoise-light">
          Záznam stavebního deníku byl úspěšně uložen.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-white">
          {new Date(entry.log_date).toLocaleDateString("cs-CZ")} – {orderName}
        </h1>
        {canEdit && (
          <Link
            href={`/moduly/stavebni-denik/${entry.id}/upravit`}
            className="flex items-center gap-2 rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/5"
          >
            <Pencil size={14} />
            Upravit
          </Link>
        )}
      </div>

      <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
        <Row label="Datum" value={new Date(entry.log_date).toLocaleDateString("cs-CZ")} />
        <Row label="Zakázka" value={orderName} />
        <Row label="Počasí" value={entry.weather ?? "—"} />
        <Row label="Technika" value={entry.equipment ?? "—"} />
        <Row label="Počet dělníků" value={entry.worker_count} />
        <Row label="Jména dělníků" value={workerNames || "—"} />
        <Row label="Denní činnost" value={entry.daily_activity ?? "—"} />
      </section>

      <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
        <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
          Popis prací
        </h2>
        <p className="whitespace-pre-wrap text-sm text-white/80">{entry.description || "—"}</p>
      </section>

      <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
          Historie změn
        </h2>
        {history.length === 0 ? (
          <p className="text-sm text-white/35">Zatím nejsou žádné záznamy.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {history.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-3 border-b border-white/5 py-2 last:border-0">
                <span className="text-sm text-white/70">{HISTORY_LABELS[h.change_type] ?? h.change_type}</span>
                <span className="text-xs text-white/35">
                  {new Date(h.changed_at).toLocaleString("cs-CZ")}
                  {h.changed_by_name ? ` · ${h.changed_by_name}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
