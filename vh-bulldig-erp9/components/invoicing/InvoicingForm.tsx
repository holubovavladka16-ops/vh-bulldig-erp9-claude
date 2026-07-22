"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { InvoicingRecord, Order } from "@/types/database.types";

interface Props {
  companyId: string;
  orders: Order[];
  existingRecord?: InvoicingRecord;
  changedByProfileId: string;
  changedByName: string;
}

const inputClass =
  "w-full rounded-xl border border-glass-border bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition focus:border-turquoise focus:ring-1 focus:ring-turquoise";

export default function InvoicingForm({ companyId, orders, existingRecord, changedByProfileId, changedByName }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const isEdit = Boolean(existingRecord);

  const [orderId, setOrderId] = useState(existingRecord?.order_id ?? "");
  const [periodFrom, setPeriodFrom] = useState(existingRecord?.period_from ?? "");
  const [periodTo, setPeriodTo] = useState(existingRecord?.period_to ?? "");
  const [invoicedAmount, setInvoicedAmount] = useState(existingRecord?.invoiced_amount?.toString() ?? "");
  const [note, setNote] = useState(existingRecord?.note ?? "");

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!orderId) {
      setError("Vyberte zakázku.");
      return;
    }
    if (!periodFrom || !periodTo) {
      setError("Zadejte období od a do.");
      return;
    }
    if (periodTo < periodFrom) {
      setError("Konec období nesmí být před začátkem období.");
      return;
    }
    const amountNum = Number(invoicedAmount);
    if (!invoicedAmount || Number.isNaN(amountNum) || amountNum <= 0) {
      setError("Zadejte platnou vyfakturovanou částku.");
      return;
    }

    setSaving(true);
    try {
      if (isEdit && existingRecord) {
        const changes: { change_type: string; details: Record<string, unknown> }[] = [];
        if (orderId !== existingRecord.order_id) changes.push({ change_type: "zmena_zakazky", details: { from: existingRecord.order_id, to: orderId } });
        if (periodFrom !== existingRecord.period_from || periodTo !== existingRecord.period_to) {
          changes.push({
            change_type: "zmena_obdobi",
            details: { from: [existingRecord.period_from, existingRecord.period_to], to: [periodFrom, periodTo] },
          });
        }
        if (amountNum !== existingRecord.invoiced_amount) {
          changes.push({ change_type: "zmena_castky", details: { from: existingRecord.invoiced_amount, to: amountNum } });
        }
        if ((note.trim() || null) !== existingRecord.note) {
          changes.push({ change_type: "zmena_poznamky", details: { from: existingRecord.note, to: note.trim() || null } });
        }

        const { error: updateError } = await supabase
          .from("invoicing_records")
          .update({
            order_id: orderId,
            period_from: periodFrom,
            period_to: periodTo,
            invoiced_amount: amountNum,
            note: note.trim() || null,
          } as never)
          .eq("id", existingRecord.id);

        if (updateError) {
          setError("Uložení se nezdařilo. Zkuste to prosím znovu.");
          return;
        }

        for (const change of changes) {
          await supabase.from("invoicing_history").insert({
            invoicing_record_id: existingRecord.id,
            change_type: change.change_type,
            details: change.details,
            changed_by: changedByProfileId,
            changed_by_name: changedByName,
          } as never);
        }

        router.push(`/moduly/fakturace-a-prehled-zisku/${existingRecord.id}`);
        router.refresh();
      } else {
        const { data, error: insertError } = await supabase
          .from("invoicing_records")
          .insert({
            company_id: companyId,
            order_id: orderId,
            period_from: periodFrom,
            period_to: periodTo,
            invoiced_amount: amountNum,
            note: note.trim() || null,
          } as never)
          .select()
          .single();

        if (insertError || !data) {
          setError("Uložení se nezdařilo. Zkuste to prosím znovu.");
          return;
        }

        const newRecord = data as unknown as InvoicingRecord;

        await supabase.from("invoicing_history").insert({
          invoicing_record_id: newRecord.id,
          change_type: "vytvoreni",
          changed_by: changedByProfileId,
          changed_by_name: changedByName,
        } as never);

        router.push(`/moduly/fakturace-a-prehled-zisku/${newRecord.id}?ulozeno=1`);
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-white/60">Období od<span className="text-red-300"> *</span></span>
          <input type="date" value={periodFrom} onChange={(e) => setPeriodFrom(e.target.value)} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-white/60">Období do<span className="text-red-300"> *</span></span>
          <input type="date" value={periodTo} onChange={(e) => setPeriodTo(e.target.value)} className={inputClass} />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-white/60">Vyfakturovaná částka (Kč)<span className="text-red-300"> *</span></span>
        <input type="number" min={0.01} step="0.01" value={invoicedAmount} onChange={(e) => setInvoicedAmount(e.target.value)} className={inputClass} />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-white/60">Poznámka</span>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={inputClass} />
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
        {saving ? "Ukládám…" : "Uložit fakturaci"}
      </button>
    </form>
  );
}
