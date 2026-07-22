import Link from "next/link";
import { Pencil } from "lucide-react";
import OrderStatusBadge from "./OrderStatusBadge";
import OrderDocumentsSection from "@/components/documents/OrderDocumentsSection";
import type { Order, OrderHistoryEntry, DocumentV2 } from "@/types/database.types";

const PENDING_SECTIONS = [
  "Zaměstnanci",
  "Docházka",
  "Výkazy",
  "Náklady",
  "Fakturace a přehled zisku",
  "Stavební deník",
  "Přípojky",
  "Fotodokumentace s GPS",
  "Mapa",
  "Faktury",
];

const HISTORY_LABELS: Record<string, string> = {
  vytvoreni: "Vytvoření zakázky",
  zmena_nazvu: "Změna názvu",
  zmena_data_zalozeni: "Změna data založení",
  zmena_stavu: "Změna stavu",
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-white/5 py-2 last:border-0">
      <span className="text-xs text-white/40">{label}</span>
      <span className="text-right text-sm text-white/85">{value}</span>
    </div>
  );
}

function CardSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
      <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
        {title}
      </h2>
      {children}
    </section>
  );
}

interface Props {
  order: Order;
  history: OrderHistoryEntry[];
  documents?: DocumentV2[];
  canEdit: boolean;
  justCreated?: boolean;
}

export default function OrderDetail({ order, history, documents, canEdit, justCreated }: Props) {
  return (
    <div className="flex flex-col gap-6">
      {justCreated && (
        <p className="rounded-xl bg-turquoise/10 px-4 py-3 text-center text-sm text-turquoise-light">
          Zakázka byla úspěšně vytvořena.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-white">{order.name}</h1>
        {canEdit && (
          <Link
            href={`/moduly/zakazky/${order.id}/upravit`}
            className="flex items-center gap-2 rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/5"
          >
            <Pencil size={14} />
            Upravit zakázku
          </Link>
        )}
      </div>

      <CardSection title="Základní údaje">
        <Row label="Datum založení" value={new Date(order.founded_date).toLocaleDateString("cs-CZ")} />
        <Row label="Název zakázky" value={order.name} />
        <div className="flex items-center justify-between border-b border-white/5 py-2 last:border-0">
          <span className="text-xs text-white/40">Stav</span>
          <OrderStatusBadge status={order.status} />
        </div>
      </CardSection>

      <OrderDocumentsSection documents={documents ?? []} />

      {PENDING_SECTIONS.map((title) => (
        <CardSection key={title} title={title}>
          <p className="text-sm text-white/40">
            Tato sekce bude automaticky propojena po vytvoření souvisejícího modulu.
          </p>
        </CardSection>
      ))}

      <CardSection title="Historie změn">
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
      </CardSection>
    </div>
  );
}
