import type { LatLng } from "./geo";

export interface ReverseGeocodeResult {
  address: string;
}

/**
 * Převede GPS souřadnice na skutečnou adresu pomocí Nominatim
 * (OpenStreetMap) reverse geocoding. Nevrací nikdy vymyšlenou adresu -
 * pokud se nic nenajde, vrací null.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;

  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) return null;

  const data = (await response.json()) as {
    display_name?: string;
    address?: Record<string, string>;
  };

  if (!data.display_name) return null;

  const a = data.address ?? {};
  const street = a.road ? `${a.road}${a.house_number ? " " + a.house_number : ""}` : "";
  const city = a.city || a.town || a.village || a.municipality || "";
  const zip = a.postcode || "";
  const country = a.country || "";
  const composed = [street, [zip, city].filter(Boolean).join(" "), country].filter(Boolean).join(", ");

  return { address: composed || data.display_name };
}

export interface GeocodeResult extends LatLng {
  displayName: string;
}

/**
 * Vyhledá adresu pomocí veřejného Nominatim (OpenStreetMap) API.
 * Nevyžaduje API klíč. Používá se pouze pro Variantu 3 (dvě adresy).
 */
export async function geocodeAddress(query: string): Promise<GeocodeResult | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) return null;

  const data = (await response.json()) as { lat: string; lon: string; display_name: string }[];
  if (!data.length) return null;

  return {
    lat: Number(data[0].lat),
    lng: Number(data[0].lon),
    displayName: data[0].display_name,
  };
}
