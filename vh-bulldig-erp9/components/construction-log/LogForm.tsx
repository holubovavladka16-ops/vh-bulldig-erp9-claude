"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import WorkerMultiSelect from "./WorkerMultiSelect";
import type { ConstructionLogEntry, Employee, Order } from "@/types/database.types";

interface Props {
  companyId: string;
  employees: Employee[];
  orders: Order[];
  existingEntry?: ConstructionLogEntry;
  changedByProfileId: string;
  changedByName: string;
}

const inputClass =
  "w-full rounded-xl border border-glass-border bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition focus:border-turquoise focus:ring-1 focus:ring-turquoise";

export default function LogForm({ companyId, employees, orders, existingEntry, changedByProfileId, changedByName }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const isEdit = Boolean(existingEntry);

  const [logDate, setLogDate] = useState(existingEntry?.log_date ?? new Date().toISOString().slice(0, 10));
  const [orderId, setOrderId] = useState(existingEntry?.order_id ?? "");
  const [weather, setWeather] = useState(existingEntry?.weather ?? "");
  const [equipment, setEquipment] = useState(existingEntry?.equipment ?? "");
  const [workerIds, setWorkerIds] = useState<string[]>(existingEntry?.worker_ids ?? []);
  const [dailyActivity, setDailyActivity] = useState(existingEntry?.daily_activity ?? "");
  const [description, setDescription] = useState(existingEntry?.description ?? "");

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingFromAttendance, setLoadingFromAttendance] = useState(false);

  async function loadFromAttendance() {
    if (!orderId || !logDate) {
      setError("Nejdříve vyberte zakázku a datum.");
      return;
    }
    setLoadingFromAttendance(true);
    const { data } = await supabase
      .from("attendance_records")
      .select("employee_id")
      .eq("order_id", orderId)
      .eq("record_date", logDate)
      .eq("status", "schvaleny");

    const ids = Array.from(new Set((data ?? []).map((r: { employee_id: string }) => r.employee_id)));
    setWorkerIds((prev) => Array.from(new Set([...prev, ...ids])));
    setLoadingFromAttendance(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!logDate) {
      setError("Zadejte datum.");
      return;
    }
    if (!orderId) {
      setError("Vyberte zakázku.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        company_id: companyId,
        order_id: orderId,
        log_date: logDate,
        weather: weather.trim() || null,
        equipment: equipment.trim() || null,
        worker_ids: workerIds,
        worker_count: workerIds.length,
        daily_activity: dailyActivity.trim() || null,
        description: description.trim() || null,
      };

      if (isEdit && existingEntry) {
        const changes: { change_type: string; details: Record<string, unknown> }[] = [];
        if (logDate !== existingEntry.log_date) changes.push({ change_type: "zmena_data", details: { from: existingEntry.log_date, to: logDate } });
        if (orderId !== existingEntry.order_id) changes.push({ change_type: "zmena_zakazky", details: { from: existingEntry.order_id, to: orderId } });
        if (weather.trim() !== (existingEntry.weather ?? "")) changes.push({ change_type: "zmena_pocasi", details: { from: existingEntry.weather, to: weather.trim() } });
        if (equipment.trim() !== (existingEntry.equipment ?? "")) changes.push({ change_type: "zmena_techniky", details: { from: existingEntry.equipment, to: equipment.trim() } });
        if (workerIds.length !== existingEntry.worker_count) changes.push({ change_type: "zmena_pocet_delniku", details: { from: existingEntry.worker_count, to: workerIds.length } });
        if (JSON.stringify(workerIds.slice().sort()) !== JSON.stringify(existingEntry.worker_ids.slice().sort())) {
          changes.push({ change_type: "zmena_jmen", details: { from: existingEntry.worker_ids, to: workerIds } });
        }
        if (dailyActivity.trim() !== (existingEntry.daily_activity ?? "")) changes.push({ change_type: "zmena_denni_cinnosti", details: { from: existingEntry.daily_activity, to: dailyActivity.trim() } });
        if (description.trim() !== (existingEntry.description ?? "")) changes.push({ change_type: "zmena_popisu", details: { from: existingEntry.description, to: description.trim() } });

        const { error: updateError } = await supabase
          .from("construction_log_entries")
          .update(payload as never)
          .eq("id", existingEntry.id);

        if (updateError) {
          setError("Uložení se nezdařilo. Zkuste to prosím znovu.");
          return;
        }

        for (const change of changes) {
          await supabase.from("construction_log_history").insert({
            entry_id: existingEntry.id,
            change_type: change.change_type,
            details: change.details,
            changed_by: changedByProfileId,
            changed_by_name: changedByName,
          } as never);
        }

        router.push(`/moduly/stavebni-denik/${existingEntry.id}`);
        router.refresh();
      } else {
        const { data, error: insertError } = await supabase
          .from("construction_log_entries")
          .insert(payload as never)
          .select()
          .single();

        if (insertError || !data) {
          setError("Uložení se nezdařilo. Zkuste to prosím znovu.");
          return;
        }

        const newEntry = data as unknown as ConstructionLogEntry;

        await supabase.from("construction_log_history").insert({
          entry_id: newEntry.id,
          change_type: "vytvoreni",
          changed_by: changedByProfileId,
          changed_by_name: changedByName,
        } as never);

        router.push(`/moduly/stavebni-denik/${newEntry.id}?ulozeno=1`);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-white/60">Datum</span>
            <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} className={inputClass} />
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
            <span className="text-sm text-white/60">Počasí</span>
            <input value={weather} onChange={(e) => setWeather(e.target.value)} className={inputClass} placeholder="např. polojasno, 18°C" />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-white/60">Technika</span>
            <input value={equipment} onChange={(e) => setEquipment(e.target.value)} className={inputClass} placeholder="např. minibagr, vibrační deska" />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-white/50">
            Výběr dělníků
          </h2>
          <button
            type="button"
            onClick={loadFromAttendance}
            disabled={loadingFromAttendance}
            className="rounded-xl border border-glass-border px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/5 disabled:opacity-50"
          >
            {loadingFromAttendance ? "Načítám…" : "Načíst ze schválené docházky"}
          </button>
        </div>
        <WorkerMultiSelect employees={employees} selectedIds={workerIds} onChange={setWorkerIds} />
        <p className="mt-3 text-sm text-white/60">
          Počet dělníků: <span className="font-semibold text-white">{workerIds.length}</span>
        </p>
      </section>

      <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-white/60">Denní činnost</span>
          <input value={dailyActivity} onChange={(e) => setDailyActivity(e.target.value)} className={inputClass} placeholder="stručný název práce" />
        </label>
        <label className="mt-4 flex flex-col gap-1.5">
          <span className="text-sm text-white/60">Popis prací</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={inputClass} placeholder="podrobný popis skutečně provedených prací" />
        </label>
      </section>

      {error && (
        <p role="alert" className="rounded-xl bg-red-500/10 px-4 py-3 text-center text-sm text-red-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="self-center rounded-xl bg-gradient-to-r from-gold to-gold-light px-8 py-3 text-base font-semibold text-base-950 transition hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Ukládám…" : "Uložit záznam"}
      </button>
    </form>
  );
}
