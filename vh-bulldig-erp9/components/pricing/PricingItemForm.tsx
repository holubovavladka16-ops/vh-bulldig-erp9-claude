"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ACTIVITY_PRESETS, UNITS, UNIT_LABELS } from "@/lib/pricing";
import type { PricingActivityKey, PricingItem, PricingItemStatus, PricingUnit } from "@/types/database.types";

interface Props {
  companyId: string;
  employeeId: string;
  existingItem?: PricingItem;
  changedByProfileId: string;
  changedByName: string;
  onSaved: (item: PricingItem) => void;
  onCancel: () => void;
}

const inputClass =
  "w-full rounded-xl border border-glass-border bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition focus:border-turquoise focus:ring-1 focus:ring-turquoise";

export default function PricingItemForm({
  companyId,
  employeeId,
  existingItem,
  changedByProfileId,
  changedByName,
  onSaved,
  onCancel,
}: Props) {
  const supabase = createClient();
  const isEdit = Boolean(existingItem);

  const [activityKey, setActivityKey] = useState<PricingActivityKey>(existingItem?.activity_key ?? "hodinova_sazba");
  const [customName, setCustomName] = useState(existingItem?.activity_key === "jine" ? existingItem.activity_name : "");
  const [unit, setUnit] = useState<PricingUnit>(existingItem?.unit ?? "hod");
  const [unitPrice, setUnitPrice] = useState(existingItem?.unit_price?.toString() ?? "");
  const [validFrom, setValidFrom] = useState(existingItem?.valid_from ?? new Date().toISOString().slice(0, 10));
  const [validTo, setValidTo] = useState(existingItem?.valid_to ?? "");
  const [status, setStatus] = useState<PricingItemStatus>(existingItem?.status ?? "aktivni");
  const [note, setNote] = useState(existingItem?.note ?? "");

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function handlePresetChange(key: PricingActivityKey) {
    setActivityKey(key);
    const preset = ACTIVITY_PRESETS.find((a) => a.key === key);
    if (preset && key !== "jine") {
      setUnit(preset.defaultUnit);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (activityKey === "jine" && !customName.trim()) {
      setError("U položky „Jiné“ je nutné zadat vlastní název činnosti.");
      return;
    }
    const priceNum = Number(unitPrice);
    if (!unitPrice || Number.isNaN(priceNum) || priceNum < 0) {
      setError("Zadejte platnou cenu za jednotku.");
      return;
    }

    const activityName =
      activityKey === "jine" ? customName.trim() : ACTIVITY_PRESETS.find((a) => a.key === activityKey)!.label;

    setSaving(true);
    try {
      if (isEdit && existingItem) {
        const priceChanged = priceNum !== existingItem.unit_price;

        const { data, error: updateError } = await supabase
          .from("pricing_items")
          .update({
            activity_key: activityKey,
            activity_name: activityName,
            unit,
            unit_price: priceNum,
            valid_from: validFrom,
            valid_to: validTo || null,
            status,
            note: note.trim() || null,
          } as never)
          .eq("id", existingItem.id)
          .select()
          .single();

        if (updateError || !data) {
          setError("Uložení se nezdařilo. Zkuste to prosím znovu.");
          return;
        }

        if (priceChanged) {
          await supabase.from("pricing_price_history").insert({
            pricing_item_id: existingItem.id,
            old_price: existingItem.unit_price,
            new_price: priceNum,
            new_valid_from: validFrom,
            changed_by: changedByProfileId,
            changed_by_name: changedByName,
          } as never);
        }

        onSaved(data as unknown as PricingItem);
      } else {
        const { data, error: insertError } = await supabase
          .from("pricing_items")
          .insert({
            company_id: companyId,
            employee_id: employeeId,
            activity_key: activityKey,
            activity_name: activityName,
            unit,
            unit_price: priceNum,
            valid_from: validFrom,
            valid_to: validTo || null,
            status,
            note: note.trim() || null,
          } as never)
          .select()
          .single();

        if (insertError || !data) {
          setError("Uložení se nezdařilo. Zkuste to prosím znovu.");
          return;
        }

        onSaved(data as unknown as PricingItem);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-white/60">Činnost</span>
          <select
            value={activityKey}
            onChange={(e) => handlePresetChange(e.target.value as PricingActivityKey)}
            className={inputClass}
          >
            {ACTIVITY_PRESETS.map((a) => (
              <option key={a.key} value={a.key} className="bg-base-900">
                {a.label}
              </option>
            ))}
          </select>
        </label>

        {activityKey === "jine" && (
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-white/60">Vlastní název činnosti</span>
            <input value={customName} onChange={(e) => setCustomName(e.target.value)} className={inputClass} />
          </label>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-white/60">Jednotka</span>
          <select value={unit} onChange={(e) => setUnit(e.target.value as PricingUnit)} className={inputClass}>
            {UNITS.map((u) => (
              <option key={u} value={u} className="bg-base-900">
                {UNIT_LABELS[u]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-white/60">Cena za jednotku (Kč)</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            className={inputClass}
          />
          <span className="text-xs text-white/30">Použije se jako: množství × cena za jednotku = celková cena</span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-white/60">Platnost od</span>
          <input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} className={inputClass} />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-white/60">Platnost do</span>
          <input type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)} className={inputClass} />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-white/60">Stav</span>
          <div className="flex gap-4 pt-2">
            <label className="flex items-center gap-2 text-sm text-white/80">
              <input type="radio" checked={status === "aktivni"} onChange={() => setStatus("aktivni")} />
              Aktivní
            </label>
            <label className="flex items-center gap-2 text-sm text-white/80">
              <input type="radio" checked={status === "neaktivni"} onChange={() => setStatus("neaktivni")} />
              Neaktivní
            </label>
          </div>
        </label>

        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm text-white/60">Poznámka</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={inputClass} />
        </label>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/70 transition hover:bg-white/5"
        >
          Zrušit
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-gradient-to-r from-gold to-gold-light px-5 py-2 text-sm font-semibold text-base-950 transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Ukládám…" : "Uložit položku"}
        </button>
      </div>
    </form>
  );
}
