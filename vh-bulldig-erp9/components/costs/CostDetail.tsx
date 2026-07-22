import Link from "next/link";
import { Pencil } from "lucide-react";
import { COST_CATEGORY_LABELS } from "@/lib/costs";
import { formatMoney } from "@/lib/attendance";
import type { Cost, CostHistoryEntry } from "@/types/database.types";

const HISTORY_LABELS: Record<string, string> = {
  vytvoreni: "Vytvoření nákladu",
  zmena_data: "Změna data",
  zmena_zakazky: "Změna zakázky",
  zmena_kategorie: "Změna kategorie",
  zmena_popisu: "Změna popisu",
  zmena_castky: "Změna částky",
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
  cost: Cost;
  orderName: string;
  history: CostHistoryEntry[];
  canEdit: boolean;
  justSaved?: boolean;
}

export default function CostDetail({ cost, orderName, history, canEdit, justSaved }: Props) {
  return (
    <div className="flex flex-col gap-6">
      {justSaved && (
        <p className="rounded-xl bg-turquoise/10 px-4 py-3 text-center text-sm text-turquoise-light">
          Náklad byl úspěšně uložen.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-white">{cost.description}</h1>
        {canEdit && (
          <Link
            href={`/moduly/naklady/${cost.id}/upravit`}
            className="flex items-center gap-2 rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/5"
          >
            <Pencil size={14} />
            Upravit
          </Link>
        )}
      </div>

      <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
        <Row label="Datum" value={new Date(cost.cost_date).toLocaleDateString("cs-CZ")} />
        <Row label="Zakázka" value={orderName} />
        <Row label="Kategorie" value={COST_CATEGORY_LABELS[cost.category]} />
        <Row label="Popis" value={cost.description} />
        <Row label="Částka" value={<span className="font-semibold text-turquoise-light">{formatMoney(cost.amount)}</span>} />
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
