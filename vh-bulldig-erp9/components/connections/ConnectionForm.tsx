"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadConnectionPhoto, removeConnectionPhoto } from "@/lib/connectionPhotos";
import { validateCompanyImage } from "@/lib/companyAssets";
import TrackMeasurement, { type TrackResult } from "./measurement/TrackMeasurement";
import PointABMeasurement, { type PointABResult } from "./measurement/PointABMeasurement";
import AddressMeasurement, { type AddressResult } from "./measurement/AddressMeasurement";
import ConnectionPhotoUploader, { type PhotoDraft, newPhotoKey } from "./ConnectionPhotoUploader";
import ConnectionMap from "./ConnectionMap";
import { formatMeters } from "@/lib/geo";
import type { Connection, ConnectionMeasurementMethod, ConnectionPhoto, ConnectionPoint, Order } from "@/types/database.types";

interface PreparedPoint {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  point_order: number;
  label: string | null;
}

interface Props {
  companyId: string;
  orders: Order[];
  existingConnection?: Connection;
  existingPoints?: ConnectionPoint[];
  existingPhotos?: ConnectionPhoto[];
  changedByProfileId: string;
  changedByName: string;
}

const METHOD_LABELS: Record<ConnectionMeasurementMethod, string> = {
  prubezne_gps: "Průběžné GPS měření trasy",
  body_a_b: "Měření mezi bodem A a bodem B",
  dve_adresy: "Měření mezi dvěma adresami",
};

const inputClass =
  "w-full rounded-xl border border-glass-border bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition focus:border-turquoise focus:ring-1 focus:ring-turquoise";

export default function ConnectionForm({
  companyId,
  orders,
  existingConnection,
  existingPoints,
  existingPhotos,
  changedByProfileId,
  changedByName,
}: Props) {
  const supabase = createClient();
  const router = useRouter();
  const isEdit = Boolean(existingConnection);

  const [connectionDate, setConnectionDate] = useState(existingConnection?.connection_date ?? new Date().toISOString().slice(0, 10));
  const [orderId, setOrderId] = useState(existingConnection?.order_id ?? "");
  const [name, setName] = useState(existingConnection?.name ?? "");
  const [note, setNote] = useState(existingConnection?.note ?? "");

  const [method, setMethod] = useState<ConnectionMeasurementMethod>(existingConnection?.measurement_method ?? "prubezne_gps");
  const [remeasuring, setRemeasuring] = useState(!isEdit);

  const [preparedPoints, setPreparedPoints] = useState<PreparedPoint[]>([]);
  const [lengthMeters, setLengthMeters] = useState<number | null>(existingConnection?.measured_length_meters ?? null);
  const [measurementStartedAt, setMeasurementStartedAt] = useState<string | null>(existingConnection?.measurement_started_at ?? null);
  const [measurementEndedAt, setMeasurementEndedAt] = useState<string | null>(existingConnection?.measurement_ended_at ?? null);
  const [hasNewMeasurement, setHasNewMeasurement] = useState(false);

  const [photos, setPhotos] = useState<PhotoDraft[]>(
    (existingPhotos ?? []).map((p) => ({
      key: newPhotoKey(),
      previewUrl: p.photo_url,
      pointId: p.point_id ?? "",
      note: p.note ?? "",
      existingId: p.id,
    }))
  );
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function handleTrackComplete(result: TrackResult) {
    setPreparedPoints(result.points.map((p, i) => ({ latitude: p.lat, longitude: p.lng, accuracy: p.accuracy, point_order: i, label: null })));
    setLengthMeters(result.lengthMeters);
    setMeasurementStartedAt(result.startedAt);
    setMeasurementEndedAt(result.endedAt);
    setHasNewMeasurement(true);
  }

  function handlePointABComplete(result: PointABResult) {
    setPreparedPoints([
      { latitude: result.pointA.lat, longitude: result.pointA.lng, accuracy: result.pointA.accuracy, point_order: 0, label: "A" },
      { latitude: result.pointB.lat, longitude: result.pointB.lng, accuracy: result.pointB.accuracy, point_order: 1, label: "B" },
    ]);
    setLengthMeters(result.lengthMeters);
    setHasNewMeasurement(true);
  }

  function handleAddressComplete(result: AddressResult) {
    setPreparedPoints([
      { latitude: result.start.lat, longitude: result.start.lng, accuracy: null, point_order: 0, label: "pocatek" },
      { latitude: result.end.lat, longitude: result.end.lng, accuracy: null, point_order: 1, label: "cil" },
    ]);
    setLengthMeters(result.lengthMeters);
    setHasNewMeasurement(true);
  }

  function handleAddPhoto(file: File) {
    const err = validateCompanyImage(file);
    setPhotoError(err);
    if (err) return;
    setPhotos((prev) => [...prev, { key: newPhotoKey(), file, previewUrl: URL.createObjectURL(file), pointId: "", note: "" }]);
  }

  function updatePhoto(key: string, patch: Partial<PhotoDraft>) {
    setPhotos((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  }

  function removePhoto(key: string) {
    setPhotos((prev) => prev.filter((p) => p.key !== key));
  }

  const pointOptions = preparedPoints
    .map((p, i) => ({ id: `new-${i}`, label: p.label ?? `Bod ${i + 1}` }))
    .concat((existingPoints ?? []).map((p) => ({ id: p.id, label: p.label ?? `Bod ${p.point_order + 1}` })));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!orderId) {
      setError("Vyberte zakázku.");
      return;
    }
    if (!name.trim()) {
      setError("Zadejte název nebo označení přípojky.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        company_id: companyId,
        order_id: orderId,
        connection_date: connectionDate,
        name: name.trim(),
        note: note.trim() || null,
        measurement_method: method,
        measured_length_meters: lengthMeters,
        measurement_started_at: measurementStartedAt,
        measurement_ended_at: measurementEndedAt,
        created_by: changedByProfileId,
        created_by_name: changedByName,
      };

      let connectionId = existingConnection?.id;

      if (isEdit && existingConnection) {
        if (hasNewMeasurement) {
          // Zachovej historii původního měření před přepsáním (bod 14).
          await supabase.from("connection_history").insert({
            connection_id: existingConnection.id,
            change_type: "zmena_mereni",
            changed_by: changedByProfileId,
            changed_by_name: changedByName,
            details: {
              puvodni_zpusob: existingConnection.measurement_method,
              puvodni_delka: existingConnection.measured_length_meters,
              puvodni_body: existingPoints,
            },
          } as never);
        }

        const { error: updateError } = await supabase
          .from("connections")
          .update(payload as never)
          .eq("id", existingConnection.id);

        if (updateError) {
          setError("Uložení se nezdařilo. Zkuste to prosím znovu.");
          return;
        }

        if (hasNewMeasurement) {
          await supabase.from("connection_points").delete().eq("connection_id", existingConnection.id);
          if (preparedPoints.length > 0) {
            await supabase.from("connection_points").insert(
              preparedPoints.map((p) => ({ connection_id: existingConnection.id, ...p })) as never
            );
          }
        }
      } else {
        const { data, error: insertError } = await supabase
          .from("connections")
          .insert(payload as never)
          .select()
          .single();

        if (insertError || !data) {
          setError("Uložení se nezdařilo. Zkuste to prosím znovu.");
          return;
        }

        connectionId = (data as unknown as Connection).id;

        if (preparedPoints.length > 0) {
          await supabase.from("connection_points").insert(
            preparedPoints.map((p) => ({ connection_id: connectionId, ...p })) as never
          );
        }

        await supabase.from("connection_history").insert({
          connection_id: connectionId,
          change_type: "vytvoreni",
          changed_by: changedByProfileId,
          changed_by_name: changedByName,
        } as never);
      }

      // Nové fotografie nahrát do Storage a uložit odkazy.
      if (connectionId) {
        for (const p of photos) {
          if (p.file) {
            const uploaded = await uploadConnectionPhoto(supabase, companyId, connectionId, p.file);
            const linkedPointId = p.pointId.startsWith("new-") ? null : p.pointId || null;
            await supabase.from("connection_photos").insert({
              connection_id: connectionId,
              point_id: linkedPointId,
              photo_url: uploaded.url,
              photo_path: uploaded.path,
              note: p.note.trim() || null,
            } as never);
          }
        }

        // Odstraněné existující fotografie.
        const remainingExistingIds = new Set(photos.filter((p) => p.existingId).map((p) => p.existingId));
        for (const existing of existingPhotos ?? []) {
          if (!remainingExistingIds.has(existing.id)) {
            await removeConnectionPhoto(supabase, existing.photo_path);
            await supabase.from("connection_photos").delete().eq("id", existing.id);
          }
        }
      }

      router.push(`/moduly/pripojky/${connectionId}${isEdit ? "" : "?ulozeno=1"}`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-white/60">Datum</span>
            <input type="date" value={connectionDate} onChange={(e) => setConnectionDate(e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-white/60">Zakázka<span className="text-red-300"> *</span></span>
            <select value={orderId} onChange={(e) => setOrderId(e.target.value)} className={inputClass}>
              <option value="" className="bg-base-900">Vyberte…</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id} className="bg-base-900">{o.name}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm text-white/60">Název nebo označení přípojky<span className="text-red-300"> *</span></span>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="např. Vodovodní přípojka – severní strana" />
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm text-white/60">Poznámka</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={inputClass} />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
        <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
          Způsob měření
        </h2>

        {isEdit && !remeasuring ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-white/70">{METHOD_LABELS[method]}</p>
            {lengthMeters !== null && (
              <p className="text-sm text-white/70">
                Naměřená délka: <span className="font-semibold text-turquoise-light">{formatMeters(lengthMeters)}</span>
              </p>
            )}
            {existingPoints && existingPoints.length > 0 && (
              <ConnectionMap
                points={existingPoints.map((p) => ({ id: p.id, lat: p.latitude, lng: p.longitude, popupText: p.label ?? undefined }))}
              />
            )}
            <button
              type="button"
              onClick={() => setRemeasuring(true)}
              className="self-start rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/5"
            >
              Změřit znovu
            </button>
            <p className="text-xs text-white/30">
              Původní měření zůstane zachováno v historii, dokud znovu neprovedete a neuložíte nové měření.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(METHOD_LABELS) as ConnectionMeasurementMethod[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                    method === m
                      ? "border-turquoise bg-turquoise/10 text-turquoise-light"
                      : "border-glass-border text-white/60 hover:bg-white/5"
                  }`}
                >
                  {METHOD_LABELS[m]}
                </button>
              ))}
            </div>

            {method === "prubezne_gps" && <TrackMeasurement onComplete={handleTrackComplete} />}
            {method === "body_a_b" && <PointABMeasurement onComplete={handlePointABComplete} />}
            {method === "dve_adresy" && <AddressMeasurement onComplete={handleAddressComplete} />}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
        <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
          Fotografie
        </h2>
        <ConnectionPhotoUploader
          photos={photos}
          pointOptions={pointOptions}
          onAdd={handleAddPhoto}
          onChange={updatePhoto}
          onRemove={removePhoto}
        />
        {photoError && <p className="mt-2 text-xs text-red-300">{photoError}</p>}
      </section>

      {error && (
        <p role="alert" className="rounded-xl bg-red-500/10 px-4 py-3 text-center text-sm text-red-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="self-center rounded-xl bg-gradient-to-r from-gold to-gold-light px-8 py-3 text-base font-semibold text-base-950 transition hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Ukládám…" : "Uložit přípojku"}
      </button>
    </form>
  );
}
