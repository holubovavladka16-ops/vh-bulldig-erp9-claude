"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { COST_CATEGORIES } from "@/lib/costs";
import type { Cost, CostCategory, Order } from "@/types/database.types";

interface Props {
  companyId: string;
  orders: Order[];
  existingCost?: Cost;
  changedByProfileId: string;
  changedByName: string;
}

const inputClass =
  "w-full rounded-xl border border-glass-border bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition focus:border-turquoise focus:ring-1 focus:ring-turquoise";

export default function CostForm({ companyId, orders, existingCost, changedByProfileId, changedByName }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const isEdit = Boolean(existingCost);

  const [costDate, setCostDate] = useState(existingCost?.cost_date ?? new Date().toISOString().slice(0, 10));
  const [orderId, setOrderId] = useState(existingCost?.order_id ?? "");
  const [category, setCategory] = useState<CostCategory | "">(existingCost?.category ?? "");
  const [description, setDescription] = useState(existingCost?.description ?? "");
  const [amount, setAmount] = useState(existingCost?.amount?.toString() ?? "");

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!orderId || !category || !description.trim()) {
      setError("Vyplňte prosím všechna povinná pole.");
      return;
    }

    const amountNum = Number(amount);
    if (!amount || Number.isNaN(amountNum) || amountNum <= 0) {
      setError("Zadejte platnou částku nákladu.");
      return;
    }

    setSaving(true);
    try {
      if (isEdit && existingCost) {
        const changes: { change_type: string; details: Record<string, unknown> }[] = [];
        if (costDate !== existingCost.cost_date) changes.push({ change_type: "zmena_data", details: { from: existingCost.cost_date, to: costDate } });
        if (orderId !== existingCost.order_id) changes.push({ change_type: "zmena_zakazky", details: { from: existingCost.order_id, to: orderId } });
        if (category !== existingCost.category) changes.push({ change_type: "zmena_kategorie", details: { from: existingCost.category, to: category } });
        if (description.trim() !== existingCost.description) changes.push({ change_type: "zmena_popisu", details: { from: existingCost.description, to: description.trim() } });
        if (amountNum !== existingCost.amount) changes.push({ change_type: "zmena_castky", details: { from: existingCost.amount, to: amountNum } });

        const { error: updateError } = await supabase
          .from("costs")
          .update({ cost_date: costDate, order_id: orderId, category, description: description.trim(), amount: amountNum } as never)
          .eq("id", existingCost.id);

        if (updateError) {
          setError("Uložení se nezdařilo. Zkuste to prosím znovu.");
          return;
        }

        for (const change of changes) {
          await supabase.from("cost_history").insert({
            cost_id: existingCost.id,
            change_type: change.change_type,
            details: change.details,
            changed_by: changedByProfileId,
            changed_by_name: changedByName,
          } as never);
        }

        router.push(`/moduly/naklady/${existingCost.id}`);
        router.refresh();
      } else {
        const { data, error: insertError } = await supabase
          .from("costs")
          .insert({
            company_id: companyId,
            order_id: orderId,
            cost_date: costDate,
            category,
            description: description.trim(),
            amount: amountNum,
          } as never)
          .select()
          .single();

        if (insertError || !data) {
          setError("Uložení se nezdařilo. Zkuste to prosím znovu.");
          return;
        }

        const newCost = data as unknown as Cost;

        await supabase.from("cost_history").insert({
          cost_id: newCost.id,
          change_type: "vytvoreni",
          changed_by: changedByProfileId,
          changed_by_name: changedByName,
        } as never);

        router.push(`/moduly/naklady/${newCost.id}?ulozeno=1`);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs"
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-white/60">Datum<span className="text-red-300"> *</span></span>
        <input type="date" value={costDate} onChange={(e) => setCostDate(e.target.value)} className={inputClass} />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-white/60">Zakázka<span className="text-red-300"> *</span></span>
        <select value={orderId} onChange={(e) => setOrderId(e.target.value)} className={inputClass}>
          <option value="" className="bg-base-900">Vyberte…</option>
          {orders.map((o) => (
            <option key={o.id} value={o.id} className="bg-base-900">
              {o.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-white/60">Kategorie<span className="text-red-300"> *</span></span>
        <select value={category} onChange={(e) => setCategory(e.target.value as CostCategory)} className={inputClass}>
          <option value="" className="bg-base-900">Vyberte…</option>
          {COST_CATEGORIES.map((c) => (
            <option key={c.key} value={c.key} className="bg-base-900">
              {c.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-white/60">Popis<span className="text-red-300"> *</span></span>
        <input value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} placeholder="např. písek a beton" />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-white/60">Částka (Kč)<span className="text-red-300"> *</span></span>
        <input type="number" min={0.01} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />
      </label>

      {error && (
        <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="self-center rounded-xl bg-gradient-to-r from-gold to-gold-light px-8 py-3 text-base font-semibold text-base-950 transition hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Ukládám…" : "Uložit náklad"}
      </button>
    </form>
  );
}
