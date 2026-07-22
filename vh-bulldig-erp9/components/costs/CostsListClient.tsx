"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import CostCard from "./CostCard";
import CostSummary from "./CostSummary";
import { COST_CATEGORIES } from "@/lib/costs";
import type { Cost, CostCategory, Order } from "@/types/database.types";

interface Props {
  costs: Cost[];
  orders: Order[];
  orderNameById: Record<string, string>;
  categoryTotals: Record<CostCategory, number>;
  laborCost: number;
  canEdit: boolean;
}

const selectClass =
  "rounded-xl border border-glass-border bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-turquoise";

export default function CostsListClient({ costs, orders, orderNameById, categoryTotals, laborCost, canEdit }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [orderId, setOrderId] = useState(searchParams.get("zakazka") ?? "");
  const [category, setCategory] = useState(searchParams.get("kategorie") ?? "");
  const [dateFrom, setDateFrom] = useState(searchParams.get("od") ?? "");
  const [dateTo, setDateTo] = useState(searchParams.get("do") ?? "");

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (orderId) params.set("zakazka", orderId);
    if (category) params.set("kategorie", category);
    if (dateFrom) params.set("od", dateFrom);
    if (dateTo) params.set("do", dateTo);
    router.push(`/moduly/naklady?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-white">Náklady</h1>
        {canEdit && (
          <Link
            href="/moduly/naklady/novy"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-light px-4 py-2.5 text-sm font-semibold text-base-950 transition hover:opacity-90"
          >
            <Plus size={16} />
            Přidat náklad
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

        <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass}>
          <option value="" className="bg-base-900">Všechny kategorie</option>
          {COST_CATEGORIES.map((c) => (
            <option key={c.key} value={c.key} className="bg-base-900">
              {c.label}
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

      <CostSummary categoryTotals={categoryTotals} laborCost={laborCost} />

      {costs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-glass-border p-10 text-center text-sm text-white/40">
          Žádné náklady neodpovídají zadaným kritériím.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {costs.map((c) => (
            <CostCard key={c.id} cost={c} orderName={orderNameById[c.order_id] ?? "—"} />
          ))}
        </div>
      )}
    </div>
  );
}
