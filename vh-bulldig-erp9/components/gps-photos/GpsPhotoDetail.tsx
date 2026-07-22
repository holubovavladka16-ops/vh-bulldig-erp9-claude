"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getCurrentPosition, GPS_ERROR_MESSAGE } from "@/lib/geo";
import { reverseGeocode } from "@/lib/geocoding";
import { mapyCzUrl, googleMapsUrl, googleStreetViewUrl } from "@/lib/mapLinks";
import ConnectionMap from "@/components/connections/ConnectionMap";
import GpsPhotoPdfPreviewModal from "./GpsPhotoPdfPreviewModal";
import GpsPhotoDocumentationPdf from "./GpsPhotoDocumentationPdf";
import type { Company, GpsPhoto, GpsPhotoHistoryEntry } from "@/types/database.types";

const HISTORY_LABELS: Record<string, string> = {
  vytvoreni: "Vytvoření fotografie",
  zmena_zakazky: "Změna zakázky",
  zmena_poznamky: "Změna poznámky",
  opakovane_nacteni_gps: "Opakované načtení GPS",
  zmena_adresy: "Změna adresy",
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
  photo: GpsPhoto;
  orderName: string;
  history: GpsPhotoHistoryEntry[];
  company: Company | null;
  canEdit: boolean;
  changedByProfileId: string;
  changedByName: string;
  justSaved?: boolean;
}

export default function GpsPhotoDetail({
  photo: initialPhoto,
  orderName,
  history,
  company,
  canEdit,
  changedByProfileId,
  changedByName,
  justSaved,
}: Props) {
  const supabase = createClient();
  const [photo, setPhoto] = useState(initialPhoto);
  const [reloading, setReloading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  const hasCoords = photo.latitude !== null && photo.longitude !== null;

  async function reloadGps() {
    setReloading(true);
    setGpsError(null);
    try {
      const pos = await getCurrentPosition();
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const geo = await reverseGeocode(lat, lng).catch(() => null);

      const { error } = await supabase
        .from("gps_photos")
        .update({
          latitude: lat,
          longitude: lng,
          accuracy: pos.coords.accuracy,
          address: geo?.address ?? photo.address,
        } as never)
        .eq("id", photo.id);

      if (!error) {
        await supabase.from("gps_photo_history").insert({
          photo_id: photo.id,
          change_type: "opakovane_nacteni_gps",
          changed_by: changedByProfileId,
          changed_by_name: changedByName,
          details: { lat, lng },
        } as never);

        setPhoto((p) => ({ ...p, latitude: lat, longitude: lng, accuracy: pos.coords.accuracy, address: geo?.address ?? p.address }));
      }
    } catch {
      setGpsError(GPS_ERROR_MESSAGE);
    } finally {
      setReloading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {justSaved && (
        <p className="rounded-xl bg-turquoise/10 px-4 py-3 text-center text-sm text-turquoise-light">
          Fotografie s GPS byla úspěšně uložena.
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-glass-border bg-glass-fill shadow-lg backdrop-blur-xs">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.photo_url} alt="Fotografie" className="max-h-[480px] w-full object-contain bg-black" />
      </div>

      <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
        <Row label="Datum" value={new Date(photo.taken_at).toLocaleDateString("cs-CZ")} />
        <Row label="Čas" value={new Date(photo.taken_at).toLocaleTimeString("cs-CZ")} />
        <Row label="GPS souřadnice" value={hasCoords ? `${photo.latitude!.toFixed(6)}, ${photo.longitude!.toFixed(6)}` : "—"} />
        <Row label="Přesnost GPS" value={photo.accuracy ? `±${Math.round(photo.accuracy)} m` : "—"} />
        <Row label="Adresa" value={photo.address ?? "Adresu se nepodařilo načíst."} />
        <Row label="Zakázka" value={orderName} />
        <Row label="Autor" value={photo.author_name ?? "—"} />
        <Row label="Poznámka" value={photo.note ?? "—"} />

        {canEdit && (
          <div className="mt-3">
            <button
              type="button"
              onClick={reloadGps}
              disabled={reloading}
              className="rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/5 disabled:opacity-50"
            >
              {reloading ? "Načítám…" : "Načíst polohu znovu"}
            </button>
            {gpsError && <p className="mt-2 text-xs text-red-300">{gpsError}</p>}
          </div>
        )}
      </section>

      {hasCoords && (
        <>
          <ConnectionMap points={[{ id: photo.id, lat: photo.latitude!, lng: photo.longitude! }]} />
          <div className="flex flex-wrap gap-3">
            <a href={mapyCzUrl(photo.latitude!, photo.longitude!)} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/5">
              Otevřít v Mapy.cz
            </a>
            <a href={googleMapsUrl(photo.latitude!, photo.longitude!)} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/5">
              Otevřít v Google Maps
            </a>
            <a href={googleStreetViewUrl(photo.latitude!, photo.longitude!)} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/5">
              Otevřít v Google Street View
            </a>
          </div>
        </>
      )}

      <button
        type="button"
        onClick={() => setShowPdfPreview(true)}
        className="self-start rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/5"
      >
        Vytvořit PDF této fotografie
      </button>

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

      {showPdfPreview && (
        <GpsPhotoPdfPreviewModal
          document={<GpsPhotoDocumentationPdf company={company} orderNameById={{ [photo.order_id]: orderName }} photos={[photo]} />}
          fileName={`gps-fotodoklad-${photo.id.slice(0, 8)}.pdf`}
          onClose={() => setShowPdfPreview(false)}
        />
      )}
    </div>
  );
}
