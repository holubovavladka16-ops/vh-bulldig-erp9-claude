import Link from "next/link";
import { Pencil } from "lucide-react";
import ProfitSummary from "./ProfitSummary";
import { formatMoney } from "@/lib/attendance";
import type { InvoicingHistoryEntry, InvoicingRecord } from "@/types/database.types";
import type { ProfitCalculation } from "@/lib/profit";

const HISTORY_LABELS: Record<string, string> = {
  vytvoreni: "Vytvoření záznamu",
  zmena_zakazky: "Změna zakázky",
  zmena_obdobi: "Změna období",
  zmena_castky: "Změna vyfakturované částky",
  zmena_poznamky: "Změna poznámky",
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
  record: InvoicingRecord;
  orderName: string;
  calc: ProfitCalculation;
  history: InvoicingHistoryEntry[];
  canEdit: boolean;
  justSaved?: boolean;
}

export default function InvoicingDetail({ record, orderName, calc, history, canEdit, justSaved }: Props) {
  return (
    <div className="flex flex-col gap-6">
      {justSaved && (
        <p className="rounded-xl bg-turquoise/10 px-4 py-3 text-center text-sm text-turquoise-light">
          Fakturovaná částka byla úspěšně uložena.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-white">{orderName}</h1>
        {canEdit && (
          <Link
            href={`/moduly/fakturace-a-prehled-zisku/${record.id}/upravit`}
            className="flex items-center gap-2 rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/5"
          >
            <Pencil size={14} />
            Upravit
          </Link>
        )}
      </div>

      <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
        <Row label="Zakázka" value={orderName} />
        <Row label="Období" value={`${new Date(record.period_from).toLocaleDateString("cs-CZ")} – ${new Date(record.period_to).toLocaleDateString("cs-CZ")}`} />
        <Row label="Vyfakturovaná částka" value={<span className="font-semibold text-turquoise-light">{formatMoney(record.invoiced_amount)}</span>} />
        <Row label="Poznámka" value={record.note ?? "—"} />
      </section>

      <div>
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
          Přehled výpočtu za toto období
        </h2>
        <ProfitSummary calc={calc} />
      </div>

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
