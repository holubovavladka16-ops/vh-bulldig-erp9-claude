"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Camera, FileText } from "lucide-react";
import GpsPhotoCard from "./GpsPhotoCard";
import GpsPhotoPdfPreviewModal from "./GpsPhotoPdfPreviewModal";
import GpsPhotoDocumentationPdf from "./GpsPhotoDocumentationPdf";
import ConnectionMap from "@/components/connections/ConnectionMap";
import type { Company, GpsPhoto, Order } from "@/types/database.types";

interface Props {
  photos: GpsPhoto[];
  orders: Order[];
  orderNameById: Record<string, string>;
  company: Company | null;
  canCreate: boolean;
}

const selectClass =
  "rounded-xl border border-glass-border bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-turquoise";

export default function GpsPhotosListClient({ photos, orders, orderNameById, company, canCreate }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [orderId, setOrderId] = useState(searchParams.get("zakazka") ?? "");
  const [dateFrom, setDateFrom] = useState(searchParams.get("od") ?? "");
  const [dateTo, setDateTo] = useState(searchParams.get("do") ?? "");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  function toggleSelected(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  }

  const selectedPhotos = photos.filter((p) => selectedIds.includes(p.id));

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (orderId) params.set("zakazka", orderId);
    if (dateFrom) params.set("od", dateFrom);
    if (dateTo) params.set("do", dateTo);
    router.push(`/moduly/foto-gps?${params.toString()}`);
  }

  const mapPoints = photos
    .filter((p) => p.latitude !== null && p.longitude !== null)
    .map((p) => ({
      id: p.id,
      lat: p.latitude as number,
      lng: p.longitude as number,
      popupNode: (
        <div className="flex w-40 flex-col gap-1 text-xs text-neutral-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.photo_url} alt="Fotografie" className="h-20 w-full rounded object-cover" />
          <p className="font-semibold">{new Date(p.taken_at).toLocaleString("cs-CZ")}</p>
          <p>{orderNameById[p.order_id] ?? "—"}</p>
          <p className="text-neutral-500">{p.address ?? "—"}</p>
          {p.note && <p className="italic text-neutral-500">{p.note}</p>}
          <Link href={`/moduly/foto-gps/${p.id}`} className="mt-1 font-medium text-blue-600 underline">
            Otevřít detail
          </Link>
        </div>
      ),
    }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-white">Fotodokumentace s GPS</h1>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectMode((v) => !v);
              setSelectedIds([]);
            }}
            className="rounded-xl border border-glass-border px-4 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/5"
          >
            {selectMode ? "Zrušit výběr" : "Vybrat pro PDF"}
          </button>
          {selectMode && selectedIds.length > 0 && (
            <button
              type="button"
              onClick={() => setShowPdfPreview(true)}
              className="flex items-center gap-2 rounded-xl border border-glass-border px-4 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/5"
            >
              <FileText size={16} />
              Vytvořit PDF ({selectedIds.length})
            </button>
          )}
          {canCreate && (
            <Link
              href="/moduly/foto-gps/nova"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-light px-4 py-2.5 text-sm font-semibold text-base-950 transition hover:opacity-90"
            >
              <Camera size={16} />
              Pořídit fotografii
            </Link>
          )}
        </div>
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

      {mapPoints.length > 0 && (
        <div>
          <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-white/50">Mapa</h2>
          <ConnectionMap points={mapPoints} showLine={false} height={360} />
        </div>
      )}

      {photos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-glass-border p-10 text-center text-sm text-white/40">
          Žádné fotografie neodpovídají zadaným kritériím.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {photos.map((p) =>
            selectMode ? (
              <div key={p.id} className="relative">
                <label className="absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-md bg-black/60">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(p.id)}
                    onChange={() => toggleSelected(p.id)}
                  />
                </label>
                <GpsPhotoCard photo={p} orderName={orderNameById[p.order_id] ?? "—"} />
              </div>
            ) : (
              <GpsPhotoCard key={p.id} photo={p} orderName={orderNameById[p.order_id] ?? "—"} />
            )
          )}
        </div>
      )}

      {showPdfPreview && selectedPhotos.length > 0 && (
        <GpsPhotoPdfPreviewModal
          document={<GpsPhotoDocumentationPdf company={company} orderNameById={orderNameById} photos={selectedPhotos} />}
          fileName={`gps-fotodoklad-${selectedPhotos.length}-fotografii.pdf`}
          onClose={() => setShowPdfPreview(false)}
        />
      )}
    </div>
  );
}
