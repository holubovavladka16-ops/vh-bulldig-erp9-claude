"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Plus, MapPinned } from "lucide-react";
import ConnectionCard from "./ConnectionCard";
import ConnectionMap from "./ConnectionMap";
import type { Connection, ConnectionPoint, Order } from "@/types/database.types";

interface Props {
  connections: Connection[];
  orders: Order[];
  orderNameById: Record<string, string>;
  pointsByConnectionId: Record<string, ConnectionPoint[]>;
  photoCountByConnectionId: Record<string, number>;
  canEdit: boolean;
}

const selectClass =
  "rounded-xl border border-glass-border bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-turquoise";

export default function ConnectionsListClient({
  connections,
  orders,
  orderNameById,
  pointsByConnectionId,
  photoCountByConnectionId,
  canEdit,
}: Props) {
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
    router.push(`/moduly/pripojky?${params.toString()}`);
  }

  const allPoints = connections.flatMap((c) =>
    (pointsByConnectionId[c.id] ?? []).map((p) => ({
      id: p.id,
      lat: p.latitude,
      lng: p.longitude,
      popupText: c.name,
    }))
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-white">Přípojky</h1>
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <Link
              href="/moduly/pripojky/novy"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-light px-4 py-2.5 text-sm font-semibold text-base-950 transition hover:opacity-90"
            >
              <Plus size={16} />
              Nový záznam přípojky
            </Link>
            <Link
              href="/moduly/pripojky/novy"
              className="flex items-center gap-2 rounded-xl border border-glass-border px-4 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/5"
            >
              <MapPinned size={16} />
              Změřit trasu
            </Link>
          </div>
        )}
      </div>

      <form onSubmit={applyFilters} className="flex flex-wrap gap-3">
        <select value={orderId} onChange={(e) => setOrderId(e.target.value)} className={selectClass}>
          <option value="" className="bg-base-900">Všechny zakázky</option>
          {orders.map((o) => (
            <option key={o.id} value={o.id} className="bg-base-900">{o.name}</option>
          ))}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={selectClass} />
        <span className="self-center text-white/30">–</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={selectClass} />
        <button type="submit" className="rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/5">
          Použít filtr
        </button>
      </form>

      {allPoints.length > 0 && (
        <div>
          <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-white/50">Mapa</h2>
          <ConnectionMap points={allPoints} showLine={false} height={360} />
        </div>
      )}

      {connections.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-glass-border p-10 text-center text-sm text-white/40">
          Žádné přípojky neodpovídají zadaným kritériím.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {connections.map((c) => (
            <ConnectionCard
              key={c.id}
              connection={c}
              orderName={orderNameById[c.order_id] ?? "—"}
              pointCount={(pointsByConnectionId[c.id] ?? []).length}
              photoCount={photoCountByConnectionId[c.id] ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
