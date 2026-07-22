"use client";

import { useState } from "react";
import ConnectionMap from "@/components/connections/ConnectionMap";
import { getCurrentPosition, haversineDistanceMeters, formatMeters, GPS_ERROR_MESSAGE, type LatLng } from "@/lib/geo";

export interface PointABResult {
  pointA: LatLng & { accuracy: number | null };
  pointB: LatLng & { accuracy: number | null };
  lengthMeters: number;
}

interface Props {
  onComplete: (result: PointABResult) => void;
  readOnly?: boolean;
  initialA?: LatLng & { accuracy: number | null };
  initialB?: LatLng & { accuracy: number | null };
}

export default function PointABMeasurement({ onComplete, readOnly, initialA, initialB }: Props) {
  const [pointA, setPointA] = useState<(LatLng & { accuracy: number | null }) | null>(initialA ?? null);
  const [pointB, setPointB] = useState<(LatLng & { accuracy: number | null }) | null>(initialB ?? null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"A" | "B" | null>(null);

  async function capture(which: "A" | "B") {
    setLoading(which);
    setError(null);
    try {
      const pos = await getCurrentPosition();
      const point = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
      if (which === "A") {
        setPointA(point);
      } else {
        setPointB(point);
      }
      const a = which === "A" ? point : pointA;
      const b = which === "B" ? point : pointB;
      if (a && b) {
        onComplete({ pointA: a, pointB: b, lengthMeters: haversineDistanceMeters(a, b) });
      }
    } catch {
      setError(GPS_ERROR_MESSAGE);
    } finally {
      setLoading(null);
    }
  }

  const lengthMeters = pointA && pointB ? haversineDistanceMeters(pointA, pointB) : null;

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      {!readOnly && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => capture("A")}
            disabled={loading !== null}
            className="rounded-xl border border-glass-border px-4 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/5 disabled:opacity-50"
          >
            {loading === "A" ? "Měřím…" : "Zaměřit bod A"}
          </button>
          <button
            type="button"
            onClick={() => capture("B")}
            disabled={loading !== null}
            className="rounded-xl border border-glass-border px-4 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/5 disabled:opacity-50"
          >
            {loading === "B" ? "Měřím…" : "Zaměřit bod B"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <PointInfo label="Bod A" point={pointA} />
        <PointInfo label="Bod B" point={pointB} />
      </div>

      {lengthMeters !== null && (
        <p className="text-sm text-white/70">
          Naměřená vzdálenost: <span className="font-semibold text-turquoise-light">{formatMeters(lengthMeters)}</span>
        </p>
      )}

      {(pointA || pointB) && (
        <ConnectionMap
          points={[
            ...(pointA ? [{ id: "A", lat: pointA.lat, lng: pointA.lng, popupText: "Bod A" }] : []),
            ...(pointB ? [{ id: "B", lat: pointB.lat, lng: pointB.lng, popupText: "Bod B" }] : []),
          ]}
        />
      )}
    </div>
  );
}

function PointInfo({ label, point }: { label: string; point: (LatLng & { accuracy: number | null }) | null }) {
  return (
    <div className="rounded-xl border border-glass-border bg-white/5 p-3 text-xs text-white/60">
      <p className="mb-1 font-semibold text-white/80">{label}</p>
      {point ? (
        <>
          <p>Šířka: {point.lat.toFixed(6)}</p>
          <p>Délka: {point.lng.toFixed(6)}</p>
          <p>Přesnost: {point.accuracy ? `±${Math.round(point.accuracy)} m` : "—"}</p>
        </>
      ) : (
        <p className="text-white/30">Zatím nezaměřeno.</p>
      )}
    </div>
  );
}
