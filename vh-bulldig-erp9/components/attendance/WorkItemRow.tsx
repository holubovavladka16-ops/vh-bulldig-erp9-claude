"use client";

import { Trash2 } from "lucide-react";
import { UNIT_LABELS } from "@/lib/pricing";
import { formatMoney } from "@/lib/attendance";
import type { PricingItem } from "@/types/database.types";

export interface WorkItemDraft {
  key: string;
  pricingItemId: string;
  activityName: string;
  unit: string;
  unitPrice: number;
  quantity: string;
  note: string;
}

interface Props {
  draft: WorkItemDraft;
  pricingOptions: PricingItem[];
  onChange: (patch: Partial<WorkItemDraft>) => void;
  onRemove: () => void;
  readOnly?: boolean;
}

const inputClass =
  "w-full rounded-xl border border-glass-border bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-turquoise focus:ring-1 focus:ring-turquoise";

export default function WorkItemRow({ draft, pricingOptions, onChange, onRemove, readOnly }: Props) {
  const quantityNum = Number(draft.quantity) || 0;
  const total = quantityNum * draft.unitPrice;

  function handlePricingSelect(pricingItemId: string) {
    const item = pricingOptions.find((p) => p.id === pricingItemId);
    if (item) {
      onChange({
        pricingItemId: item.id,
        activityName: item.activity_name,
        unit: item.unit,
        unitPrice: item.unit_price,
      });
    }
  }

  return (
    <div className="grid grid-cols-1 gap-3 rounded-xl border border-glass-border bg-white/5 p-4 sm:grid-cols-6">
      <label className="flex flex-col gap-1 sm:col-span-2">
        <span className="text-xs text-white/50">Druh činnosti</span>
        <select
          value={draft.pricingItemId}
          disabled={readOnly}
          onChange={(e) => handlePricingSelect(e.target.value)}
          className={inputClass}
        >
          <option value="" className="bg-base-900">Vyberte…</option>
          {pricingOptions.map((p) => (
            <option key={p.id} value={p.id} className="bg-base-900">
              {p.activity_name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-white/50">Množství</span>
        <input
          type="number"
          min={0}
          step="0.01"
          value={draft.quantity}
          disabled={readOnly || !draft.pricingItemId}
          onChange={(e) => onChange({ quantity: e.target.value })}
          className={inputClass}
        />
      </label>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-white/50">Jednotka</span>
        <p className="rounded-xl border border-transparent px-3 py-2 text-sm text-white/70">
          {draft.unit ? UNIT_LABELS[draft.unit as keyof typeof UNIT_LABELS] ?? draft.unit : "—"}
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-white/50">Jednotková cena</span>
        <p className="rounded-xl border border-transparent px-3 py-2 text-sm text-white/70">
          {draft.unitPrice ? formatMoney(draft.unitPrice) : "—"}
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-white/50">Celková cena</span>
        <p className="rounded-xl border border-transparent px-3 py-2 text-sm font-semibold text-turquoise-light">
          {formatMoney(total)}
        </p>
      </div>

      <label className="flex flex-col gap-1 sm:col-span-5">
        <span className="text-xs text-white/50">Poznámka</span>
        <input
          value={draft.note}
          disabled={readOnly}
          onChange={(e) => onChange({ note: e.target.value })}
          className={inputClass}
        />
      </label>

      {!readOnly && (
        <div className="flex items-end">
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center gap-2 rounded-xl border border-glass-border px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-500/10"
          >
            <Trash2 size={14} />
            Odebrat
          </button>
        </div>
      )}
    </div>
  );
}
