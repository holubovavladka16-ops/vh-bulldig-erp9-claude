"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import InvoicingCard from "./InvoicingCard";
import ProfitSummary from "./ProfitSummary";
import type { InvoicingRecord, Order } from "@/types/database.types";
import type { ProfitCalculation } from "@/lib/profit";

interface Props {
  records: InvoicingRecord[];
  orders: Order[];
  orderNameById: Record<string, string>;
  aggregate: ProfitCalculation;
  canEdit: boolean;
}

const selectClass =
  "rounded-xl border border-glass-border bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-turquoise";

export default function InvoicingListClient({ records, orders, orderNameById, aggregate, canEdit }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [orderId, setOrderId] = useState(searchParams.get("zakazka") ?? "");
  const [dateFrom, setDateFrom] = useState(searchParams.get("od") ?? "");
  const [dateTo, setDateTo] = useState(searchParams.get("do") ?? "");

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (orderId) params.set("zakazka", orderId);
    if (dateFrom) params.set("od", dateFrom);
    if (dateTo) params.set("do", dateTo);
    router.push(`/moduly/fakturace-a-prehled-zisku?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-white">Fakturace a přehled zisku</h1>
        {canEdit && (
          <Link
            href="/moduly/fakturace-a-prehled-zisku/nova"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-light px-4 py-2.5 text-sm font-semibold text-base-950 transition hover:opacity-90"
          >
            <Plus size={16} />
            Přidat fakturovanou částku
          </Link>
        )}
      </div>

      <form onSubmit={applyFilters} className="flex flex-wrap gap-3">
        <select value={orderId} onChange={(e) => setOrderId(e.target.value)} className={selectClass}>
          <option value="" className="bg-base-900">Všechny zakázky</option>
          {orders.map((o) => (
            <option key={o.id} value={o.id} className="bg-base-900">
              {o.name}
            </option>
          ))}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={selectClass} />
        <span className="self-center text-white/30">–</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={selectClass} />
        <button
          type="submit"
          className="rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/5"
        >
          Použít filtr
        </button>
      </form>

      <ProfitSummary calc={aggregate} />

      {records.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-glass-border p-10 text-center text-sm text-white/40">
          Žádné záznamy fakturace neodpovídají zadaným kritériím.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {records.map((r) => (
            <InvoicingCard key={r.id} record={r} orderName={orderNameById[r.order_id] ?? "—"} />
          ))}
        </div>
      )}
    </div>
  );
}
