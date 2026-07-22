"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import AttendanceRecordCard from "./AttendanceRecordCard";
import type { AttendanceRecord, Employee, Order } from "@/types/database.types";

interface Props {
  records: AttendanceRecord[];
  employees: Employee[];
  orders: Order[];
  workItemCounts: Record<string, number>;
  canCreate: boolean;
  lockToOwnEmployeeId?: string;
}

export default function AttendanceListClient({
  records,
  employees,
  orders,
  workItemCounts,
  canCreate,
  lockToOwnEmployeeId,
}: Props) {
  const [employeeFilter, setEmployeeFilter] = useState(lockToOwnEmployeeId ?? "");
  const [orderFilter, setOrderFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const employeeNameById = useMemo(() => {
    const map = new Map<string, string>();
    employees.forEach((e) => map.set(e.id, `${e.first_name} ${e.last_name}`));
    return map;
  }, [employees]);

  const orderNameById = useMemo(() => {
    const map = new Map<string, string>();
    orders.forEach((o) => map.set(o.id, o.name));
    return map;
  }, [orders]);

  const filtered = records.filter((r) => {
    if (employeeFilter && r.employee_id !== employeeFilter) return false;
    if (orderFilter && r.order_id !== orderFilter) return false;
    if (fromDate && r.record_date < fromDate) return false;
    if (toDate && r.record_date > toDate) return false;
    return true;
  });

  const selectClass =
    "rounded-xl border border-glass-border bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-turquoise";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-white">Docházka</h1>
        {canCreate && (
          <Link
            href="/moduly/dochazka/novy"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-light px-4 py-2.5 text-sm font-semibold text-base-950 transition hover:opacity-90"
          >
            <Plus size={16} />
            Nový záznam docházky
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {!lockToOwnEmployeeId && (
          <select value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)} className={selectClass}>
            <option value="" className="bg-base-900">Všichni zaměstnanci</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id} className="bg-base-900">
                {e.first_name} {e.last_name}
              </option>
            ))}
          </select>
        )}

        <select value={orderFilter} onChange={(e) => setOrderFilter(e.target.value)} className={selectClass}>
          <option value="" className="bg-base-900">Všechny zakázky</option>
          {orders.map((o) => (
            <option key={o.id} value={o.id} className="bg-base-900">
              {o.name}
            </option>
          ))}
        </select>

        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={selectClass} />
        <span className="self-center text-white/30">–</span>
        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={selectClass} />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-glass-border p-10 text-center text-sm text-white/40">
          Žádné záznamy neodpovídají zadaným kritériím.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => (
            <AttendanceRecordCard
              key={r.id}
              record={r}
              employeeName={employeeNameById.get(r.employee_id) ?? "—"}
              orderName={orderNameById.get(r.order_id) ?? "—"}
              workItemCount={workItemCounts[r.id] ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
