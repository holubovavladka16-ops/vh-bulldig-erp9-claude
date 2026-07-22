"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ConnectionMap, { type MapPoint, type MapRoute } from "@/components/connections/ConnectionMap";
import { mapyCzUrl, googleMapsUrl, googleStreetViewUrl } from "@/lib/mapLinks";
import { formatMeters } from "@/lib/geo";
import type { Connection, ConnectionPoint, GpsPhoto, Order } from "@/types/database.types";

interface Props {
  orders: Order[];
  photos: GpsPhoto[];
  connections: Connection[];
  pointsByConnectionId: Record<string, ConnectionPoint[]>;
}

const selectClass =
  "rounded-xl border border-glass-border bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-turquoise";

interface ResultItem {
  key: string;
  type: "foto" | "bod" | "trasa";
  date: string;
  orderName: string;
  label: string;
  hasGps: boolean;
  focus: { lat: number; lng: number; zoom?: number } | null;
  detailHref: string;
}

export default function MapOverviewClient({ orders, photos, connections, pointsByConnectionId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [orderId, setOrderId] = useState(searchParams.get("zakazka") ?? "");
  const [dateFrom, setDateFrom] = useState(searchParams.get("od") ?? "");
  const [dateTo, setDateTo] = useState(searchParams.get("do") ?? "");

  const [showPhotos, setShowPhotos] = useState(true);
  const [showPoints, setShowPoints] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);

  const [focusPoint, setFocusPoint] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (orderId) params.set("zakazka", orderId);
    if (dateFrom) params.set("od", dateFrom);
    if (dateTo) params.set("do", dateTo);
    router.push(`/moduly/mapa?${params.toString()}`);
  }

  const orderNameById = useMemo(() => Object.fromEntries(orders.map((o) => [o.id, o.name])), [orders]);

  const photoPoints: MapPoint[] = useMemo(
    () =>
      showPhotos
        ? photos
            .filter((p) => p.latitude !== null && p.longitude !== null)
            .map((p) => ({
              id: `foto-${p.id}`,
              lat: p.latitude as number,
              lng: p.longitude as number,
              popupNode: (
                <div className="flex w-40 flex-col gap-1 text-xs text-neutral-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.photo_url} alt="Fotografie" className="h-20 w-full rounded object-cover" />
                  <p className="font-semibold">{new Date(p.taken_at).toLocaleString("cs-CZ")}</p>
                  <p>{orderNameById[p.order_id] ?? "—"}</p>
                  <p className="text-neutral-500">{p.address ?? "—"}</p>
                  <p className="text-neutral-500">
                    {p.latitude!.toFixed(5)}, {p.longitude!.toFixed(5)} {p.accuracy ? `(±${Math.round(p.accuracy)} m)` : ""}
                  </p>
                  {p.note && <p className="italic text-neutral-500">{p.note}</p>}
                  <div className="mt-1 flex flex-col gap-0.5">
                    <a href={mapyCzUrl(p.latitude!, p.longitude!)} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Mapy.cz</a>
                    <a href={googleMapsUrl(p.latitude!, p.longitude!)} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Maps</a>
                    <a href={googleStreetViewUrl(p.latitude!, p.longitude!)} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Street View</a>
                  </div>
                  <Link href={`/moduly/foto-gps/${p.id}`} className="mt-1 font-medium text-blue-600 underline">
                    Otevřít detail
                  </Link>
                </div>
              ),
            }))
        : [],
    [photos, showPhotos, orderNameById]
  );

  const connectionPointMarkers: MapPoint[] = useMemo(
    () =>
      showPoints
        ? connections.flatMap((c) =>
            (pointsByConnectionId[c.id] ?? []).map((pt, i) => ({
              id: `bod-${pt.id}`,
              lat: pt.latitude,
              lng: pt.longitude,
              popupNode: (
                <div className="flex w-40 flex-col gap-1 text-xs text-neutral-800">
                  <p className="font-semibold">{pt.label || `Bod ${i + 1}`}</p>
                  <p>{pt.latitude.toFixed(5)}, {pt.longitude.toFixed(5)}</p>
                  <p className="text-neutral-500">{pt.accuracy ? `±${Math.round(pt.accuracy)} m` : "—"}</p>
                  <p className="text-neutral-500">{new Date(pt.recorded_at).toLocaleString("cs-CZ")}</p>
                  <p>{c.name}</p>
                  <p className="text-neutral-500">{orderNameById[c.order_id] ?? "—"}</p>
                  <Link href={`/moduly/pripojky/${c.id}`} className="mt-1 font-medium text-blue-600 underline">
                    Otevřít detail
                  </Link>
                </div>
              ),
            }))
          )
        : [],
    [connections, pointsByConnectionId, showPoints, orderNameById]
  );

  const routes: MapRoute[] = useMemo(
    () =>
      showRoutes
        ? connections
            .filter((c) => (pointsByConnectionId[c.id] ?? []).length > 1)
            .map((c) => ({
              id: `trasa-${c.id}`,
              points: (pointsByConnectionId[c.id] ?? []).map((p) => ({ lat: p.latitude, lng: p.longitude })),
              popupNode: (
                <div className="flex w-40 flex-col gap-1 text-xs text-neutral-800">
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-neutral-500">{orderNameById[c.order_id] ?? "—"}</p>
                  <p>{c.measured_length_meters !== null ? formatMeters(c.measured_length_meters) : "—"}</p>
                  <Link href={`/moduly/pripojky/${c.id}`} className="mt-1 font-medium text-blue-600 underline">
                    Otevřít přípojku
                  </Link>
                </div>
              ),
            }))
        : [],
    [connections, pointsByConnectionId, showRoutes, orderNameById]
  );

  const results: ResultItem[] = useMemo(() => {
    const items: ResultItem[] = [];

    photos.forEach((p) => {
      const hasGps = p.latitude !== null && p.longitude !== null;
      items.push({
        key: `foto-${p.id}`,
        type: "foto",
        date: p.taken_at,
        orderName: orderNameById[p.order_id] ?? "—",
        label: hasGps ? p.address ?? "GPS poloha bez adresy" : "GPS poloha není dostupná.",
        hasGps,
        focus: hasGps ? { lat: p.latitude as number, lng: p.longitude as number } : null,
        detailHref: `/moduly/foto-gps/${p.id}`,
      });
    });

    connections.forEach((c) => {
      const pts = pointsByConnectionId[c.id] ?? [];
      if (pts.length === 0) {
        items.push({
          key: `conn-${c.id}`,
          type: "trasa",
          date: c.connection_date,
          orderName: orderNameById[c.order_id] ?? "—",
          label: `${c.name} — GPS poloha není dostupná.`,
          hasGps: false,
          focus: null,
          detailHref: `/moduly/pripojky/${c.id}`,
        });
      } else if (pts.length === 1) {
        items.push({
          key: `conn-${c.id}`,
          type: "bod",
          date: c.connection_date,
          orderName: orderNameById[c.order_id] ?? "—",
          label: c.name,
          hasGps: true,
          focus: { lat: pts[0].latitude, lng: pts[0].longitude },
          detailHref: `/moduly/pripojky/${c.id}`,
        });
      } else {
        items.push({
          key: `conn-${c.id}`,
          type: "trasa",
          date: c.connection_date,
          orderName: orderNameById[c.order_id] ?? "—",
          label: `${c.name} (${formatMeters(c.measured_length_meters ?? 0)})`,
          hasGps: true,
          focus: { lat: pts[0].latitude, lng: pts[0].longitude, zoom: 15 },
          detailHref: `/moduly/pripojky/${c.id}`,
        });
      }
    });

    return items.sort((a, b) => b.date.localeCompare(a.date));
  }, [photos, connections, pointsByConnectionId, orderNameById]);

  const TYPE_LABELS: Record<ResultItem["type"], string> = {
    foto: "GPS fotografie",
    bod: "Bod přípojky",
    trasa: "Trasa přípojky",
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-xl font-semibold text-white">Mapa s body a fotografiemi</h1>

      <form onSubmit={applyFilters} className="flex flex-wrap gap-3">
        <select value={orderId} onChange={(e) => setOrderId(e.target.value)} className={selectClass}>
          <option value="" className="bg-base-900">Všechny povolené zakázky</option>
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

      <div className="flex flex-wrap gap-2">
        {[
          { label: "Fotografie s GPS", value: showPhotos, set: setShowPhotos },
          { label: "Body přípojek", value: showPoints, set: setShowPoints },
          { label: "Trasy přípojek", value: showRoutes, set: setShowRoutes },
        ].map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={() => t.set(!t.value)}
            className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
              t.value ? "border-turquoise bg-turquoise/10 text-turquoise-light" : "border-glass-border text-white/40 hover:bg-white/5"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
        <ConnectionMap
          points={[...photoPoints, ...connectionPointMarkers]}
          routes={routes}
          showLine={false}
          height={460}
          focusPoint={focusPoint}
        />

        <div className="flex max-h-[460px] flex-col gap-2 overflow-y-auto">
          {results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-glass-border p-6 text-center text-sm text-white/40">
              Žádné výsledky neodpovídají zadaným kritériím.
            </div>
          ) : (
            results.map((r) => (
              <div key={r.key} className="rounded-xl border border-glass-border bg-glass-fill p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/60">
                    {TYPE_LABELS[r.type]}
                  </span>
                  <span className="text-[11px] text-white/40">{new Date(r.date).toLocaleDateString("cs-CZ")}</span>
                </div>
                <p className="mt-1 text-sm text-white/85">{r.label}</p>
                <p className="text-xs text-white/40">{r.orderName}</p>
                <div className="mt-2 flex gap-2">
                  {r.focus && (
                    <button
                      type="button"
                      onClick={() => setFocusPoint(r.focus)}
                      className="rounded-lg border border-glass-border px-2 py-1 text-[11px] font-medium text-white/70 transition hover:bg-white/5"
                    >
                      Zobrazit na mapě
                    </button>
                  )}
                  <Link
                    href={r.detailHref}
                    className="rounded-lg border border-glass-border px-2 py-1 text-[11px] font-medium text-white/70 transition hover:bg-white/5"
                  >
                    Otevřít detail
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
