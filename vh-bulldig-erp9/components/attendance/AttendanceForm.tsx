"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { computePresenceMinutes, formatMinutes, formatMoney, PAYMENT_METHOD_LABELS } from "@/lib/attendance";
import WorkItemRow, { type WorkItemDraft } from "./WorkItemRow";
import type {
  AttendanceRecord,
  AttendanceStatus,
  AttendanceWorkItem,
  Employee,
  EmploymentType,
  Order,
  PaymentMethod,
  PricingItem,
} from "@/types/database.types";

interface Props {
  companyId: string;
  employees: Employee[];
  orders: Order[];
  lockedEmployeeId?: string;
  existingRecord?: AttendanceRecord;
  existingWorkItems?: AttendanceWorkItem[];
  changedByProfileId: string;
  changedByName: string;
  isEmployeeSelf: boolean;
}

const inputClass =
  "w-full rounded-xl border border-glass-border bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition focus:border-turquoise focus:ring-1 focus:ring-turquoise";

let rowKeyCounter = 0;
function newRowKey() {
  rowKeyCounter += 1;
  return `row-${Date.now()}-${rowKeyCounter}`;
}

function toDraft(item: AttendanceWorkItem): WorkItemDraft {
  return {
    key: newRowKey(),
    pricingItemId: item.pricing_item_id ?? "",
    activityName: item.activity_name,
    unit: item.unit,
    unitPrice: item.unit_price,
    quantity: String(item.quantity),
    note: item.note ?? "",
  };
}

export default function AttendanceForm({
  companyId,
  employees,
  orders,
  lockedEmployeeId,
  existingRecord,
  existingWorkItems,
  changedByProfileId,
  changedByName,
  isEmployeeSelf,
}: Props) {
  const supabase = createClient();
  const router = useRouter();
  const isEdit = Boolean(existingRecord);

  const [employeeId, setEmployeeId] = useState(lockedEmployeeId ?? existingRecord?.employee_id ?? "");
  const [orderId, setOrderId] = useState(existingRecord?.order_id ?? "");
  const [recordDate, setRecordDate] = useState(existingRecord?.record_date ?? new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState(existingRecord?.note ?? "");

  const [workStart, setWorkStart] = useState(existingRecord?.work_start ?? "");
  const [workEnd, setWorkEnd] = useState(existingRecord?.work_end ?? "");
  const [breakMinutes, setBreakMinutes] = useState(existingRecord?.break_minutes ?? 0);

  const [workItems, setWorkItems] = useState<WorkItemDraft[]>(
    existingWorkItems && existingWorkItems.length > 0
      ? existingWorkItems.map(toDraft)
      : [{ key: newRowKey(), pricingItemId: "", activityName: "", unit: "", unitPrice: 0, quantity: "", note: "" }]
  );

  const [dailyAdvance, setDailyAdvance] = useState(existingRecord?.daily_advance?.toString() ?? "0");
  const [advancePaymentMethod, setAdvancePaymentMethod] = useState<PaymentMethod | "">(
    existingRecord?.advance_payment_method ?? ""
  );
  const [advanceNote, setAdvanceNote] = useState(existingRecord?.advance_note ?? "");

  const [status, setStatus] = useState<AttendanceStatus>(existingRecord?.status ?? "rozepsany");

  const [pricingOptions, setPricingOptions] = useState<PricingItem[]>([]);
  const [cardInfo, setCardInfo] = useState<{
    employmentTypeName: string;
    paymentMethod: PaymentMethod;
    statusLabel: string;
    periodEarnings: number;
    periodAdvances: number;
  } | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedEmployee = employees.find((e) => e.id === employeeId);

  // Bod 3: po výběru zaměstnance automaticky načíst Kartu dělníka,
  // jeho individuální ceník a dosavadní výdělek/zálohy za období.
  useEffect(() => {
    if (!employeeId) {
      setCardInfo(null);
      setPricingOptions([]);
      return;
    }

    let cancelled = false;

    async function load() {
      const [{ data: typeData }, { data: pricingData }, { data: periodData }] = await Promise.all([
        selectedEmployee
          ? supabase.from("employment_types").select("*").eq("id", selectedEmployee.employment_type_id).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase
          .from("pricing_items")
          .select("*")
          .eq("employee_id", employeeId)
          .eq("status", "aktivni")
          .lte("valid_from", recordDate),
        supabase
          .from("attendance_records")
          .select("total_earnings, daily_advance, record_date")
          .eq("employee_id", employeeId),
      ]);

      if (cancelled || !selectedEmployee) return;

      const type = typeData as unknown as EmploymentType | null;
      const items = ((pricingData ?? []) as unknown as PricingItem[]).filter(
        (p) => !p.valid_to || p.valid_to >= recordDate
      );

      // Dosavadní výdělek/zálohy za kalendářní měsíc zvoleného data.
      const month = recordDate.slice(0, 7);
      const periodRows = (periodData ?? []) as unknown as { total_earnings: number; daily_advance: number; record_date: string }[];
      const periodEarnings = periodRows
        .filter((r) => r.record_date.slice(0, 7) === month)
        .reduce((sum, r) => sum + Number(r.total_earnings), 0);
      const periodAdvances = periodRows
        .filter((r) => r.record_date.slice(0, 7) === month)
        .reduce((sum, r) => sum + Number(r.daily_advance), 0);

      setPricingOptions(items);
      setCardInfo({
        employmentTypeName: type?.name ?? "—",
        paymentMethod: selectedEmployee.payment_method,
        statusLabel: selectedEmployee.status,
        periodEarnings,
        periodAdvances,
      });
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, recordDate]);

  const presenceMinutes = computePresenceMinutes(workStart || null, workEnd || null, breakMinutes);

  const totalEarnings = useMemo(
    () => workItems.reduce((sum, w) => sum + (Number(w.quantity) || 0) * w.unitPrice, 0),
    [workItems]
  );
  const advanceNum = Number(dailyAdvance) || 0;
  const balanceDue = totalEarnings - advanceNum;

  function updateWorkItem(key: string, patch: Partial<WorkItemDraft>) {
    setWorkItems((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function addWorkItem() {
    setWorkItems((rows) => [
      ...rows,
      { key: newRowKey(), pricingItemId: "", activityName: "", unit: "", unitPrice: 0, quantity: "", note: "" },
    ]);
  }

  function removeWorkItem(key: string) {
    setWorkItems((rows) => (rows.length > 1 ? rows.filter((r) => r.key !== key) : rows));
  }

  const activeEmployees = employees.filter((e) => e.status === "aktivni" || e.id === employeeId);
  const activeOrders = orders.filter((o) => o.status === "aktivni" || o.id === orderId);
  const allowedStatuses: AttendanceStatus[] = isEmployeeSelf
    ? ["rozepsany", "odeslany"]
    : ["rozepsany", "odeslany", "schvaleny", "vraceny_k_oprave"];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!employeeId) {
      setError("Vyberte zaměstnance.");
      return;
    }
    if (!orderId) {
      setError("Vyberte zakázku.");
      return;
    }
    const validItems = workItems.filter((w) => w.pricingItemId && Number(w.quantity) > 0);

    setSaving(true);
    try {
      const payload = {
        company_id: companyId,
        employee_id: employeeId,
        order_id: orderId,
        record_date: recordDate,
        note: note.trim() || null,
        work_start: workStart || null,
        work_end: workEnd || null,
        break_minutes: breakMinutes,
        presence_total_minutes: presenceMinutes,
        daily_advance: advanceNum,
        advance_payment_method: advancePaymentMethod || null,
        advance_note: advanceNote.trim() || null,
        total_earnings: totalEarnings,
        balance_due: balanceDue,
        status,
      };

      let recordId = existingRecord?.id;

      if (isEdit && existingRecord) {
        const { error: updateError } = await supabase
          .from("attendance_records")
          .update(payload as never)
          .eq("id", existingRecord.id);

        if (updateError) {
          setError("Uložení se nezdařilo. Zkuste to prosím znovu.");
          return;
        }

        await supabase.from("attendance_work_items").delete().eq("attendance_record_id", existingRecord.id);

        await supabase.from("attendance_history").insert({
          attendance_record_id: existingRecord.id,
          change_type: "zmena_pracovni_cinnosti",
          changed_by: changedByProfileId,
          changed_by_name: changedByName,
          details: { total_earnings: totalEarnings, balance_due: balanceDue },
        } as never);
      } else {
        const { data, error: insertError } = await supabase
          .from("attendance_records")
          .insert(payload as never)
          .select()
          .single();

        if (insertError || !data) {
          setError("Uložení se nezdařilo. Zkuste to prosím znovu.");
          return;
        }

        recordId = (data as unknown as AttendanceRecord).id;

        await supabase.from("attendance_history").insert({
          attendance_record_id: recordId,
          change_type: "vytvoreni",
          changed_by: changedByProfileId,
          changed_by_name: changedByName,
        } as never);
      }

      if (recordId && validItems.length > 0) {
        await supabase.from("attendance_work_items").insert(
          validItems.map((w) => ({
            attendance_record_id: recordId,
            pricing_item_id: w.pricingItemId,
            activity_name: w.activityName,
            unit: w.unit,
            unit_price: w.unitPrice,
            quantity: Number(w.quantity),
            total_price: Number(w.quantity) * w.unitPrice,
            note: w.note.trim() || null,
          })) as never
        );
      }

      router.push(`/moduly/dochazka/${recordId}${isEdit ? "" : "?ulozeno=1"}`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* 1. Datum, 2. Zaměstnanec, 3. Zakázka */}
      <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-white/60">Datum</span>
            <input type="date" value={recordDate} onChange={(e) => setRecordDate(e.target.value)} className={inputClass} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-white/60">Zaměstnanec</span>
            <select
              value={employeeId}
              disabled={Boolean(lockedEmployeeId)}
              onChange={(e) => setEmployeeId(e.target.value)}
              className={inputClass}
            >
              <option value="" className="bg-base-900">Vyberte…</option>
              {activeEmployees.map((emp) => (
                <option key={emp.id} value={emp.id} className="bg-base-900">
                  {emp.first_name} {emp.last_name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-white/60">Zakázka</span>
            <select value={orderId} onChange={(e) => setOrderId(e.target.value)} className={inputClass}>
              <option value="" className="bg-base-900">Vyberte…</option>
              {activeOrders.map((o) => (
                <option key={o.id} value={o.id} className="bg-base-900">
                  {o.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm text-white/60">Poznámka</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} />
          </label>
        </div>

        {cardInfo && selectedEmployee && (
          <div className="mt-4 rounded-xl border border-glass-border bg-white/5 p-4 text-xs text-white/60">
            <p className="mb-2 font-semibold text-white/80">Karta dělníka – automaticky načteno</p>
            <p>Pracovní pozice: {selectedEmployee.position}</p>
            <p>Pracovní poměr: {cardInfo.employmentTypeName}</p>
            <p>Způsob platby: {PAYMENT_METHOD_LABELS[cardInfo.paymentMethod]}</p>
            <p>Stav zaměstnance: {selectedEmployee.status}</p>
            <p className="mt-2">
              Dosavadní výdělek tento měsíc: {formatMoney(cardInfo.periodEarnings)} · Dosavadní zálohy: {formatMoney(cardInfo.periodAdvances)}
            </p>
          </div>
        )}
      </section>

      {/* 4. Evidence přítomnosti */}
      <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
        <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
          Evidence přítomnosti
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-white/60">Začátek práce</span>
            <input type="time" value={workStart} onChange={(e) => setWorkStart(e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-white/60">Konec práce</span>
            <input type="time" value={workEnd} onChange={(e) => setWorkEnd(e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-white/60">Přestávka (min)</span>
            <input
              type="number"
              min={0}
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(Number(e.target.value))}
              className={inputClass}
            />
          </label>
        </div>
        <p className="mt-3 text-sm text-white/60">
          Celkem přítomnosti: <span className="font-semibold text-white">{formatMinutes(presenceMinutes)}</span>
        </p>
        <p className="mt-1 text-xs text-white/30">
          Toto je pouze evidence přítomnosti. Nepočítá se z toho mzda ani pracovní výkon.
        </p>
      </section>

      {/* 5. Pracovní činnosti */}
      <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
        <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
          Pracovní výkon
        </h2>
        {!employeeId ? (
          <p className="text-sm text-white/35">Nejdříve vyberte zaměstnance.</p>
        ) : pricingOptions.length === 0 ? (
          <p className="text-sm text-amber-300">
            Zaměstnanec nemá k tomuto datu žádné aktivní ceníkové položky.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {workItems.map((draft) => (
              <WorkItemRow
                key={draft.key}
                draft={draft}
                pricingOptions={pricingOptions}
                onChange={(patch) => updateWorkItem(draft.key, patch)}
                onRemove={() => removeWorkItem(draft.key)}
              />
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={addWorkItem}
          disabled={!employeeId || pricingOptions.length === 0}
          className="mt-3 rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/5 disabled:opacity-40"
        >
          Přidat další činnost
        </button>
      </section>

      {/* 6. Záloha */}
      <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
        <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
          Denní záloha
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-white/60">Denní záloha (Kč)</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={dailyAdvance}
              onChange={(e) => setDailyAdvance(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-white/60">Způsob vyplacení</span>
            <select
              value={advancePaymentMethod}
              onChange={(e) => setAdvancePaymentMethod(e.target.value as PaymentMethod)}
              className={inputClass}
            >
              <option value="" className="bg-base-900">Nevyplněno</option>
              <option value="hotove" className="bg-base-900">Hotově</option>
              <option value="bankovni_ucet" className="bg-base-900">Bankovní účet</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-white/60">Poznámka k záloze</span>
            <input value={advanceNote} onChange={(e) => setAdvanceNote(e.target.value)} className={inputClass} />
          </label>
        </div>
      </section>

      {/* 7. Souhrn */}
      <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-white/50">Souhrn</h2>
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <span className="text-white/50">Celkový denní výdělek</span>
            <span className="font-semibold text-white">{formatMoney(totalEarnings)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Denní záloha</span>
            <span className="text-white/80">{formatMoney(advanceNum)}</span>
          </div>
          <div className="flex justify-between border-t border-white/10 pt-1">
            <span className="text-white/50">Doplatek</span>
            <span className="font-semibold text-turquoise-light">{formatMoney(balanceDue)}</span>
          </div>
        </div>

        <label className="mt-4 flex flex-col gap-1.5">
          <span className="text-sm text-white/60">Stav záznamu</span>
          <select value={status} onChange={(e) => setStatus(e.target.value as AttendanceStatus)} className={inputClass}>
            {allowedStatuses.map((s) => (
              <option key={s} value={s} className="bg-base-900">
                {s === "rozepsany" && "Rozepsaný"}
                {s === "odeslany" && "Odeslaný"}
                {s === "schvaleny" && "Schválený"}
                {s === "vraceny_k_oprave" && "Vrácený k opravě"}
              </option>
            ))}
          </select>
        </label>
      </section>

      {error && (
        <p role="alert" className="rounded-xl bg-red-500/10 px-4 py-3 text-center text-sm text-red-300">
          {error}
        </p>
      )}

      {/* 8. Uložit */}
      <button
        type="submit"
        disabled={saving}
        className="self-center rounded-xl bg-gradient-to-r from-gold to-gold-light px-8 py-3 text-base font-semibold text-base-950 transition hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Ukládám…" : "Uložit docházku"}
      </button>
    </form>
  );
}
