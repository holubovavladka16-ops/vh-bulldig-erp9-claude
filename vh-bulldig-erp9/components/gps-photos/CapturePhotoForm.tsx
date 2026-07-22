"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, ImagePlus, RotateCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadGpsPhoto } from "@/lib/gpsPhotoUpload";
import { validateCompanyImage } from "@/lib/companyAssets";
import { getCurrentPosition } from "@/lib/geo";
import { reverseGeocode } from "@/lib/geocoding";
import ConnectionMap from "@/components/connections/ConnectionMap";
import type { GpsPhoto, Order } from "@/types/database.types";

interface Props {
  companyId: string;
  orders: Order[];
  authorId: string;
  authorName: string;
}

type GpsState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "permission_denied" }
  | { status: "error" }
  | { status: "success"; lat: number; lng: number; accuracy: number | null };

export default function CapturePhotoForm({ companyId, orders, authorId, authorName }: Props) {
  const supabase = createClient();
  const router = useRouter();

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [gps, setGps] = useState<GpsState>({ status: "idle" });
  const [address, setAddress] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);

  const [orderId, setOrderId] = useState("");
  const [note, setNote] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const capturedAt = useRef<Date | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  async function loadGps() {
    setGps({ status: "loading" });
    setAddress(null);
    setAddressError(null);
    try {
      const pos = await getCurrentPosition();
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setGps({ status: "success", lat, lng, accuracy: pos.coords.accuracy });

      setAddressLoading(true);
      try {
        const result = await reverseGeocode(lat, lng);
        if (result) {
          setAddress(result.address);
        } else {
          setAddressError("Adresu se nepodařilo načíst.");
        }
      } catch {
        setAddressError("Adresu se nepodařilo načíst.");
      } finally {
        setAddressLoading(false);
      }
    } catch (err) {
      const geoErr = err as GeolocationPositionError;
      if (geoErr && geoErr.code === 1) {
        setGps({ status: "permission_denied" });
      } else {
        setGps({ status: "error" });
      }
    }
  }

  function handlePhotoSelected(file: File) {
    const err = validateCompanyImage(file);
    setPhotoError(err);
    if (err) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    capturedAt.current = new Date();
    // Bod 2: nejdřív fotografie, TEPRVE POTOM GPS.
    loadGps();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);

    if (!photoFile) {
      setSaveError("Nejdříve pořiďte nebo vyberte fotografii.");
      return;
    }
    if (!orderId) {
      setSaveError("Vyberte zakázku.");
      return;
    }

    setSaving(true);
    try {
      const uploaded = await uploadGpsPhoto(supabase, companyId, photoFile);

      const payload = {
        company_id: companyId,
        order_id: orderId,
        photo_url: uploaded.url,
        photo_path: uploaded.path,
        latitude: gps.status === "success" ? gps.lat : null,
        longitude: gps.status === "success" ? gps.lng : null,
        accuracy: gps.status === "success" ? gps.accuracy : null,
        address: address,
        taken_at: (capturedAt.current ?? new Date()).toISOString(),
        author_id: authorId,
        author_name: authorName,
        note: note.trim() || null,
      };

      const { data, error } = await supabase.from("gps_photos").insert(payload as never).select().single();

      if (error || !data) {
        setSaveError("Uložení se nezdařilo. Zkuste to prosím znovu.");
        return;
      }

      const newPhoto = data as unknown as GpsPhoto;

      await supabase.from("gps_photo_history").insert({
        photo_id: newPhoto.id,
        change_type: "vytvoreni",
        changed_by: authorId,
        changed_by_name: authorName,
      } as never);

      router.push(`/moduly/foto-gps/${newPhoto.id}?ulozeno=1`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-glass-border bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition focus:border-turquoise focus:ring-1 focus:ring-turquoise";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* 1. Pořídit fotografii */}
      <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handlePhotoSelected(file);
            e.target.value = "";
          }}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handlePhotoSelected(file);
            e.target.value = "";
          }}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-light px-5 py-3 text-sm font-semibold text-base-950 transition hover:opacity-90"
          >
            <Camera size={18} />
            Pořídit fotografii
          </button>
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="flex items-center gap-2 rounded-xl border border-glass-border px-4 py-3 text-sm font-medium text-white/80 transition hover:bg-white/5"
          >
            <ImagePlus size={16} />
            Vybrat z galerie
          </button>
        </div>
        {photoError && <p className="mt-2 text-xs text-red-300">{photoError}</p>}
      </section>

      {/* 2. Náhled fotografie */}
      {photoPreview && (
        <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoPreview} alt="Náhled fotografie" className="mx-auto max-h-80 rounded-xl object-contain" />
        </section>
      )}

      {/* 3-4. Načítání GPS, souřadnice a přesnost */}
      {photoFile && (
        <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
            GPS poloha
          </h2>

          {gps.status === "loading" && (
            <p className="flex items-center gap-2 text-sm text-white/60">
              <RotateCw size={14} className="animate-spin" />
              Načítám GPS polohu a adresu…
            </p>
          )}

          {gps.status === "permission_denied" && (
            <div className="flex flex-col gap-2">
              <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
                Pro uložení GPS údajů povolte aplikaci přístup k poloze.
              </p>
              <button
                type="button"
                onClick={loadGps}
                className="self-start rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/5"
              >
                Načíst polohu znovu
              </button>
            </div>
          )}

          {gps.status === "error" && (
            <div className="flex flex-col gap-2">
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
                Polohu se nepodařilo načíst. Fotografie zůstala zachována.
              </p>
              <button
                type="button"
                onClick={loadGps}
                className="self-start rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/5"
              >
                Načíst polohu znovu
              </button>
            </div>
          )}

          {gps.status === "success" && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Stat label="Zeměpisná šířka" value={gps.lat.toFixed(6)} />
                <Stat label="Zeměpisná délka" value={gps.lng.toFixed(6)} />
                <Stat label="Přesnost GPS" value={gps.accuracy ? `±${Math.round(gps.accuracy)} m` : "—"} />
              </div>

              <div>
                <p className="text-xs text-white/40">Adresa</p>
                {addressLoading ? (
                  <p className="text-sm text-white/50">Načítám adresu…</p>
                ) : address ? (
                  <p className="text-sm text-white/85">{address}</p>
                ) : (
                  <p className="text-sm text-amber-300">{addressError}</p>
                )}
              </div>

              <ConnectionMap points={[{ id: "photo", lat: gps.lat, lng: gps.lng }]} height={220} />

              <button
                type="button"
                onClick={loadGps}
                className="self-start rounded-xl border border-glass-border px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/5"
              >
                Načíst polohu znovu
              </button>
            </div>
          )}
        </section>
      )}

      {/* 7. Zakázka, 8. Poznámka */}
      {photoFile && (
        <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-white/60">Zakázka<span className="text-red-300"> *</span></span>
            <select value={orderId} onChange={(e) => setOrderId(e.target.value)} className={inputClass}>
              <option value="" className="bg-base-900">Vyberte…</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id} className="bg-base-900">{o.name}</option>
              ))}
            </select>
          </label>
          <label className="mt-4 flex flex-col gap-1.5">
            <span className="text-sm text-white/60">Poznámka</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={inputClass} />
          </label>
        </section>
      )}

      {saveError && (
        <p role="alert" className="rounded-xl bg-red-500/10 px-4 py-3 text-center text-sm text-red-300">
          {saveError}
        </p>
      )}

      {/* 9. Uložit */}
      {photoFile && (
        <button
          type="submit"
          disabled={saving}
          className="self-center rounded-xl bg-gradient-to-r from-gold to-gold-light px-8 py-3 text-base font-semibold text-base-950 transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Ukládám…" : "Uložit fotografii"}
        </button>
      )}
    </form>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-glass-border bg-white/5 p-3 text-center">
      <p className="font-display text-sm font-semibold text-white">{value}</p>
      <p className="mt-1 text-[11px] text-white/40">{label}</p>
    </div>
  );
}
