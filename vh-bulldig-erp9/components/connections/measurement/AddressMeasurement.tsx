"use client";

import { useState } from "react";
import ConnectionMap from "@/components/connections/ConnectionMap";
import { geocodeAddress } from "@/lib/geocoding";
import { haversineDistanceMeters, formatMeters, type LatLng } from "@/lib/geo";

export interface AddressResult {
  start: LatLng & { displayName: string };
  end: LatLng & { displayName: string };
  lengthMeters: number;
}

interface Props {
  onComplete: (result: AddressResult) => void;
  readOnly?: boolean;
}

export default function AddressMeasurement({ onComplete, readOnly }: Props) {
  const [startStreet, setStartStreet] = useState("");
  const [startNumber, setStartNumber] = useState("");
  const [endStreet, setEndStreet] = useState("");
  const [endNumber, setEndNumber] = useState("");

  const [start, setStart] = useState<(LatLng & { displayName: string }) | null>(null);
  const [end, setEnd] = useState<(LatLng & { displayName: string }) | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    "w-full rounded-xl border border-glass-border bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-turquoise";

  async function search() {
    if (!startStreet.trim() || !endStreet.trim()) {
      setError("Zadejte obě adresy.");
      return;
    }
    setSearching(true);
    setError(null);
    setConfirmed(false);
    try {
      const [startResult, endResult] = await Promise.all([
        geocodeAddress(`${startStreet} ${startNumber}`.trim()),
        geocodeAddress(`${endStreet} ${endNumber}`.trim()),
      ]);

      if (!startResult || !endResult) {
        setError("Adresu se nepodařilo najít na mapě. Zkontrolujte zadání a zkuste to znovu.");
        return;
      }

      setStart(startResult);
      setEnd(endResult);
    } catch {
      setError("Vyhledání adres se nezdařilo. Zkontrolujte připojení k internetu.");
    } finally {
      setSearching(false);
    }
  }

  function confirm() {
    if (!start || !end) return;
    setConfirmed(true);
    onComplete({ start, end, lengthMeters: haversineDistanceMeters(start, end) });
  }

  return (
    <div className="flex flex-col gap-4">
      {!readOnly && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex gap-2">
              <input value={startStreet} onChange={(e) => setStartStreet(e.target.value)} placeholder="Počáteční adresa (ulice, město)" className={inputClass} />
              <input value={startNumber} onChange={(e) => setStartNumber(e.target.value)} placeholder="č.p." className={`${inputClass} w-24`} />
            </div>
            <div className="flex gap-2">
              <input value={endStreet} onChange={(e) => setEndStreet(e.target.value)} placeholder="Cílová adresa (ulice, město)" className={inputClass} />
              <input value={endNumber} onChange={(e) => setEndNumber(e.target.value)} placeholder="č.p." className={`${inputClass} w-24`} />
            </div>
          </div>
          <button
            type="button"
            onClick={search}
            disabled={searching}
            className="self-start rounded-xl border border-glass-border px-4 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/5 disabled:opacity-50"
          >
            {searching ? "Hledám…" : "Vyhledat adresy na mapě"}
          </button>
        </>
      )}

      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      {start && end && (
        <>
          <ConnectionMap
            points={[
              { id: "start", lat: start.lat, lng: start.lng, popupText: start.displayName },
              { id: "end", lat: end.lat, lng: end.lng, popupText: end.displayName },
            ]}
          />
          <p className="text-xs text-white/50">Počátek: {start.displayName}</p>
          <p className="text-xs text-white/50">Cíl: {end.displayName}</p>
          <p className="text-sm text-white/70">
            Vypočítaná vzdálenost:{" "}
            <span className="font-semibold text-turquoise-light">{formatMeters(haversineDistanceMeters(start, end))}</span>
          </p>

          {!readOnly && !confirmed && (
            <label className="flex items-center gap-2 text-sm text-white/70">
              <input type="checkbox" onChange={(e) => e.target.checked && confirm()} />
              Potvrzuji, že obě nalezená místa jsou správná.
            </label>
          )}
          {confirmed && <p className="text-xs text-emerald-300">Místa potvrzena.</p>}
        </>
      )}
    </div>
  );
}
