import { UNIT_LABELS } from "@/lib/pricing";
import type { PricingItem } from "@/types/database.types";

interface Props {
  item: PricingItem;
  canEdit: boolean;
  onEdit: () => void;
}

function fmtDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString("cs-CZ") : "neomezeno";
}

export default function PricingItemCard({ item, canEdit, onEdit }: Props) {
  return (
    <div className="rounded-2xl border border-glass-border bg-glass-fill p-4 shadow-lg backdrop-blur-xs">
      <div className="flex items-start justify-between gap-2">
        <p className="font-display text-sm font-semibold text-white">{item.activity_name}</p>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            item.status === "aktivni" ? "bg-emerald-500/10 text-emerald-300" : "bg-white/10 text-white/40"
          }`}
        >
          {item.status === "aktivni" ? "Aktivní" : "Neaktivní"}
        </span>
      </div>
      <p className="mt-1 text-lg font-semibold text-turquoise-light">
        {item.unit_price.toLocaleString("cs-CZ")} Kč / {UNIT_LABELS[item.unit]}
      </p>
      <p className="mt-1 text-xs text-white/40">
        Platnost: {fmtDate(item.valid_from)} – {fmtDate(item.valid_to)}
      </p>
      {item.note && <p className="mt-1 text-xs text-white/35">{item.note}</p>}
      {canEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="mt-3 rounded-xl border border-glass-border px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/5"
        >
          Upravit
        </button>
      )}
    </div>
  );
}
