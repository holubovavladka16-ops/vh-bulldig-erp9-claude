"use client";

import { useEffect, useRef, useState } from "react";
import ConnectionMap from "@/components/connections/ConnectionMap";
import { trackLengthMeters, formatMeters, GPS_ERROR_MESSAGE, type LatLng } from "@/lib/geo";

export interface TrackResult {
  points: (LatLng & { accuracy: number | null; recordedAt: string })[];
  lengthMeters: number;
  startedAt: string;
  endedAt: string;
}

interface Props {
  onComplete: (result: TrackResult) => void;
  readOnly?: boolean;
}

export default function TrackMeasurement({ onComplete, readOnly }: Props) {
  const [tracking, setTracking] = useState(false);
  const [points, setPoints] = useState<(LatLng & { accuracy: number | null; recordedAt: string })[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);

  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function start() {
    if (!navigator.geolocation) {
      setError(GPS_ERROR_MESSAGE);
      return;
    }
    setError(null);
    setPoints([]);
    const now = new Date().toISOString();
    setStartedAt(now);
    setElapsedSec(0);
    setTracking(true);

    timerRef.current = setInterval(() => setElapsedSec((s) => s + 1), 1000);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPoints((prev) => [
          ...prev,
          {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            recordedAt: new Date().toISOString(),
          },
        ]);
      },
      () => setError(GPS_ERROR_MESSAGE),
      { enableHighAccuracy: true, maximumAge: 0 }
    );
  }

  function stop() {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    setTracking(false);
    const endedAt = new Date().toISOString();
    const lengthMeters = trackLengthMeters(points);
    if (startedAt) {
      onComplete({ points, lengthMeters, startedAt, endedAt });
    }
  }

  const lengthMeters = trackLengthMeters(points);
  const lastAccuracy = points[points.length - 1]?.accuracy ?? null;

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      {!readOnly && (
        <div className="flex gap-2">
          {!tracking ? (
            <button
              type="button"
              onClick={start}
              className="rounded-xl bg-gradient-to-r from-gold to-gold-light px-5 py-3 text-sm font-semibold text-base-950 transition hover:opacity-90"
            >
              Zahájit měření
            </button>
          ) : (
            <button
              type="button"
              onClick={stop}
              className="rounded-xl border border-red-400/40 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
            >
              Ukončit měření
            </button>
          )}
        </div>
      )}

      {(tracking || points.length > 0) && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Doba měření" value={`${Math.floor(elapsedSec / 60)}:${String(elapsedSec % 60).padStart(2, "0")}`} />
          <Stat label="Naměřená délka" value={formatMeters(lengthMeters)} />
          <Stat label="Přesnost GPS" value={lastAccuracy ? `±${Math.round(lastAccuracy)} m` : "—"} />
          <Stat label="Počet bodů" value={String(points.length)} />
        </div>
      )}

      {points.length > 0 && (
        <ConnectionMap
          points={points.map((p, i) => ({ id: String(i), lat: p.lat, lng: p.lng }))}
          showLine
        />
      )}
    </div>
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
