import { UNIT_LABELS } from "@/lib/pricing";
import type { PricingItem } from "@/types/database.types";

interface Props {
  items: PricingItem[];
  canEdit: boolean;
  onEdit: (item: PricingItem) => void;
}

function fmtDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString("cs-CZ") : "neomezeno";
}

export default function PricingTable({ items, canEdit, onEdit }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-glass-border">
      <table className="w-full text-sm">
        <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-white/40">
          <tr>
            <th className="px-4 py-3">Činnost</th>
            <th className="px-4 py-3">Jednotka</th>
            <th className="px-4 py-3">Cena</th>
            <th className="px-4 py-3">Platnost</th>
            <th className="px-4 py-3">Stav</th>
            {canEdit && <th className="px-4 py-3" />}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t border-white/5">
              <td className="px-4 py-3 text-white/85">{item.activity_name}</td>
              <td className="px-4 py-3 text-white/60">{UNIT_LABELS[item.unit]}</td>
              <td className="px-4 py-3 font-semibold text-turquoise-light">
                {item.unit_price.toLocaleString("cs-CZ")} Kč
              </td>
              <td className="px-4 py-3 text-xs text-white/40">
                {fmtDate(item.valid_from)} – {fmtDate(item.valid_to)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    item.status === "aktivni" ? "bg-emerald-500/10 text-emerald-300" : "bg-white/10 text-white/40"
                  }`}
                >
                  {item.status === "aktivni" ? "Aktivní" : "Neaktivní"}
                </span>
              </td>
              {canEdit && (
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className="rounded-xl border border-glass-border px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/5"
                  >
                    Upravit
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
