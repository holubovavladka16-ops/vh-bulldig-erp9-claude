"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import AttendanceStatusBadge from "./AttendanceStatusBadge";
import { formatMinutes, formatMoney, PAYMENT_METHOD_LABELS } from "@/lib/attendance";
import { UNIT_LABELS } from "@/lib/pricing";
import type { AttendanceHistoryEntry, AttendanceRecord, AttendanceWorkItem } from "@/types/database.types";

const HISTORY_LABELS: Record<string, string> = {
  vytvoreni: "Vytvoření záznamu",
  zmena_zamestnance: "Změna zaměstnance",
  zmena_zakazky: "Změna zakázky",
  zmena_pritomnosti: "Změna evidence přítomnosti",
  zmena_pracovni_cinnosti: "Změna pracovní činnosti",
  zmena_zalohy: "Změna zálohy",
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

interface Props {
  record: AttendanceRecord;
  workItems: AttendanceWorkItem[];
  history: AttendanceHistoryEntry[];
  employeeName: string;
  orderName: string;
  canEdit: boolean;
  canApprove: boolean;
  changedByProfileId: string;
  changedByName: string;
  justSaved?: boolean;
}

export default function AttendanceDetail({
  record: initialRecord,
  workItems,
  history,
  employeeName,
  orderName,
  canEdit,
  canApprove,
  changedByProfileId,
  changedByName,
  justSaved,
}: Props) {
  const supabase = createClient();
  const [record, setRecord] = useState(initialRecord);
  const [busy, setBusy] = useState(false);
  const [showReturnReason, setShowReturnReason] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [returnError, setReturnError] = useState<string | null>(null);

  async function approve() {
    setBusy(true);
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("attendance_records")
      .update({ status: "schvaleny", approved_by: changedByProfileId, approved_at: now } as never)
      .eq("id", record.id);
    if (!error) {
      await supabase.from("attendance_history").insert({
        attendance_record_id: record.id,
        change_type: "zmena_stavu",
        changed_by: changedByProfileId,
        changed_by_name: changedByName,
        details: { from: record.status, to: "schvaleny" },
      } as never);
      setRecord((r) => ({ ...r, status: "schvaleny", approved_by: changedByProfileId, approved_at: now }));
    }
    setBusy(false);
  }

  async function submitReturn() {
    if (!returnReason.trim()) {
      setReturnError("Zadejte důvod vrácení.");
      return;
    }
    setBusy(true);
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("attendance_records")
      .update({
        status: "vraceny_k_oprave",
        returned_reason: returnReason.trim(),
        returned_by: changedByProfileId,
        returned_at: now,
      } as never)
      .eq("id", record.id);
    if (!error) {
      await supabase.from("attendance_history").insert({
        attendance_record_id: record.id,
        change_type: "zmena_stavu",
        changed_by: changedByProfileId,
        changed_by_name: changedByName,
        details: { from: record.status, to: "vraceny_k_oprave", reason: returnReason.trim() },
      } as never);
      setRecord((r) => ({
        ...r,
        status: "vraceny_k_oprave",
        returned_reason: returnReason.trim(),
        returned_by: changedByProfileId,
        returned_at: now,
      }));
      setShowReturnReason(false);
      setReturnReason("");
      setReturnError(null);
    }
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-6">
      {justSaved && (
        <p className="rounded-xl bg-turquoise/10 px-4 py-3 text-center text-sm text-turquoise-light">
          Docházka byla úspěšně uložena.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-white">
            {new Date(record.record_date).toLocaleDateString("cs-CZ")} – {employeeName}
          </h1>
          <p className="text-sm text-white/50">{orderName}</p>
        </div>
        <div className="flex items-center gap-2">
          <AttendanceStatusBadge status={record.status} />
          {canEdit && (
            <Link
              href={`/moduly/dochazka/${record.id}/upravit`}
              className="flex items-center gap-2 rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/5"
            >
              <Pencil size={14} />
              Upravit
            </Link>
          )}
        </div>
      </div>

      {record.status === "vraceny_k_oprave" && record.returned_reason && (
        <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Důvod vrácení: {record.returned_reason}
        </p>
      )}
      {record.status === "schvaleny" && record.approved_at && (
        <p className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          Schváleno {new Date(record.approved_at).toLocaleString("cs-CZ")}
        </p>
      )}

      {canApprove && (
        <div className="flex flex-col gap-3 rounded-2xl border border-glass-border bg-glass-fill p-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy || record.status === "schvaleny"}
              onClick={approve}
              className="rounded-xl bg-gradient-to-r from-gold to-gold-light px-4 py-2 text-sm font-semibold text-base-950 transition hover:opacity-90 disabled:opacity-40"
            >
              Schválit
            </button>
            <button
              type="button"
              disabled={busy || record.status === "vraceny_k_oprave"}
              onClick={() => setShowReturnReason((v) => !v)}
              className="rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/5 disabled:opacity-40"
            >
              Vrátit k opravě
            </button>
          </div>

          {showReturnReason && (
            <div className="flex flex-col gap-2">
              <label className="text-xs text-white/50">Důvod vrácení (povinné)</label>
              <textarea
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                rows={2}
                className="rounded-xl border border-glass-border bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-turquoise"
              />
              {returnError && <p className="text-xs text-red-300">{returnError}</p>}
              <button
                type="button"
                onClick={submitReturn}
                disabled={busy}
                className="self-start rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/5"
              >
                Potvrdit vrácení
              </button>
            </div>
          )}
        </div>
      )}

      <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
          Evidence přítomnosti
        </h2>
        <Row label="Začátek práce" value={record.work_start ?? "—"} />
        <Row label="Konec práce" value={record.work_end ?? "—"} />
        <Row label="Přestávka" value={`${record.break_minutes} min`} />
        <Row label="Celkem přítomnosti" value={formatMinutes(record.presence_total_minutes)} />
        <p className="mt-2 text-xs text-white/30">Pouze evidence přítomnosti, nepočítá se z toho mzda.</p>
      </section>

      <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
          Pracovní výkon
        </h2>
        {workItems.length === 0 ? (
          <p className="text-sm text-white/35">Žádné pracovní činnosti.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {workItems.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 border-b border-white/5 py-2 last:border-0">
                <div>
                  <p className="text-sm text-white/85">{item.activity_name}</p>
                  {item.note && <p className="text-xs text-white/35">{item.note}</p>}
                </div>
                <p className="text-sm text-white/70">
                  {item.quantity} {UNIT_LABELS[item.unit]} × {formatMoney(item.unit_price)} ={" "}
                  <span className="font-semibold text-turquoise-light">{formatMoney(item.total_price)}</span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-white/50">Záloha</h2>
        <Row label="Denní záloha" value={formatMoney(record.daily_advance)} />
        <Row
          label="Způsob vyplacení"
          value={record.advance_payment_method ? PAYMENT_METHOD_LABELS[record.advance_payment_method] : "—"}
        />
        <Row label="Poznámka k záloze" value={record.advance_note ?? "—"} />
      </section>

      <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-white/50">Souhrn</h2>
        <Row label="Celkový denní výdělek" value={formatMoney(record.total_earnings)} />
        <Row label="Denní záloha" value={formatMoney(record.daily_advance)} />
        <Row label="Doplatek" value={<span className="font-semibold text-turquoise-light">{formatMoney(record.balance_due)}</span>} />
      </section>

      <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
          Historie změn
        </h2>
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
      </section>
    </div>
  );
}
