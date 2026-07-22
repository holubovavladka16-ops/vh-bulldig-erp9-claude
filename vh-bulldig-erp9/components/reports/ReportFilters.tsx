"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { Employee, Order } from "@/types/database.types";

interface Props {
  employees: Employee[];
  orders: Order[];
  lockedEmployeeId?: string;
}

const selectClass =
  "rounded-xl border border-glass-border bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-turquoise";

export default function ReportFilters({ employees, orders, lockedEmployeeId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [type, setType] = useState(searchParams.get("typ") ?? "zamestnanec");
  const [employeeId, setEmployeeId] = useState(lockedEmployeeId ?? searchParams.get("zamestnanec") ?? "");
  const [orderId, setOrderId] = useState(searchParams.get("zakazka") ?? "");
  const [dateFrom, setDateFrom] = useState(searchParams.get("od") ?? "");
  const [dateTo, setDateTo] = useState(searchParams.get("do") ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("typ", type);
    if (employeeId) params.set("zamestnanec", employeeId);
    if (orderId) params.set("zakazka", orderId);
    if (dateFrom) params.set("od", dateFrom);
    if (dateTo) params.set("do", dateTo);
    router.push(`/moduly/vykazy?${params.toString()}`);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType("zamestnanec")}
          className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
            type === "zamestnanec" ? "border-turquoise bg-turquoise/10 text-turquoise-light" : "border-glass-border text-white/60 hover:bg-white/5"
          }`}
        >
          Výkaz zaměstnance
        </button>
        <button
          type="button"
          onClick={() => setType("zakazka")}
          className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
            type === "zakazka" ? "border-turquoise bg-turquoise/10 text-turquoise-light" : "border-glass-border text-white/60 hover:bg-white/5"
          }`}
        >
          Výkaz zakázky
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {type === "zamestnanec" && (
          <select
            value={employeeId}
            disabled={Boolean(lockedEmployeeId)}
            onChange={(e) => setEmployeeId(e.target.value)}
            className={selectClass}
          >
            <option value="" className="bg-base-900">Vyberte zaměstnance…</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id} className="bg-base-900">
                {e.first_name} {e.last_name}
              </option>
            ))}
          </select>
        )}

        {type === "zakazka" && (
          <select value={orderId} onChange={(e) => setOrderId(e.target.value)} className={selectClass}>
            <option value="" className="bg-base-900">Vyberte zakázku…</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id} className="bg-base-900">
                {o.name}
              </option>
            ))}
          </select>
        )}

        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={selectClass} placeholder="Období od" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={selectClass} placeholder="Období do" />

        <button
          type="submit"
          className="rounded-xl bg-gradient-to-r from-gold to-gold-light px-4 py-2 text-sm font-semibold text-base-950 transition hover:opacity-90"
        >
          Zobrazit výkaz
        </button>
      </div>
    </form>
  );
}
