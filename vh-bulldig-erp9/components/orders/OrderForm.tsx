"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Order, OrderStatus } from "@/types/database.types";

interface Props {
  companyId: string;
  existingOrder?: Order;
  changedByProfileId: string;
  changedByName: string;
}

const inputClass =
  "w-full rounded-xl border border-glass-border bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition focus:border-turquoise focus:ring-1 focus:ring-turquoise";

export default function OrderForm({ companyId, existingOrder, changedByProfileId, changedByName }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const isEdit = Boolean(existingOrder);

  const [name, setName] = useState(existingOrder?.name ?? "");
  const [foundedDate, setFoundedDate] = useState(
    existingOrder?.founded_date ?? new Date().toISOString().slice(0, 10)
  );
  const [status, setStatus] = useState<OrderStatus>(existingOrder?.status ?? "aktivni");

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Zadejte název zakázky.");
      return;
    }

    setSaving(true);
    try {
      if (isEdit && existingOrder) {
        const changes: { change_type: string; details: Record<string, unknown> }[] = [];
        if (name.trim() !== existingOrder.name) {
          changes.push({ change_type: "zmena_nazvu", details: { from: existingOrder.name, to: name.trim() } });
        }
        if (foundedDate !== existingOrder.founded_date) {
          changes.push({
            change_type: "zmena_data_zalozeni",
            details: { from: existingOrder.founded_date, to: foundedDate },
          });
        }
        if (status !== existingOrder.status) {
          changes.push({ change_type: "zmena_stavu", details: { from: existingOrder.status, to: status } });
        }

        const { error: updateError } = await supabase
          .from("orders")
          .update({ name: name.trim(), founded_date: foundedDate, status } as never)
          .eq("id", existingOrder.id);

        if (updateError) {
          setError("Uložení se nezdařilo. Zkuste to prosím znovu.");
          return;
        }

        for (const change of changes) {
          await supabase.from("order_history").insert({
            order_id: existingOrder.id,
            change_type: change.change_type,
            details: change.details,
            changed_by: changedByProfileId,
            changed_by_name: changedByName,
          } as never);
        }

        router.push(`/moduly/zakazky/${existingOrder.id}`);
        router.refresh();
      } else {
        const { data, error: insertError } = await supabase
          .from("orders")
          .insert({
            company_id: companyId,
            name: name.trim(),
            founded_date: foundedDate,
            status,
          } as never)
          .select()
          .single();

        if (insertError || !data) {
          setError("Vytvoření zakázky se nezdařilo. Zkuste to prosím znovu.");
          return;
        }

        const newOrder = data as unknown as Order;

        await supabase.from("order_history").insert({
          order_id: newOrder.id,
          change_type: "vytvoreni",
          changed_by: changedByProfileId,
          changed_by_name: changedByName,
        } as never);

        router.push(`/moduly/zakazky/${newOrder.id}?vytvoreno=1`);
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
        <span className="text-sm text-white/60">
          Datum založení
        </span>
        <input
          type="date"
          value={foundedDate}
          onChange={(e) => setFoundedDate(e.target.value)}
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-white/60">
          Název zakázky<span className="text-red-300"> *</span>
        </span>
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-white/60">Stav</span>
        <div className="flex gap-4 pt-1">
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
        {saving ? "Ukládám…" : isEdit ? "Uložit změny" : "Uložit zakázku"}
      </button>
    </form>
  );
}
