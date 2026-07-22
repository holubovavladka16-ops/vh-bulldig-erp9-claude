"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Oprava výchozích ikon markerů Leafletu (jinak by ukazovaly na chybějící soubory).
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  popupText?: string;
  popupNode?: React.ReactNode;
}

export interface MapRoute {
  id: string;
  points: { lat: number; lng: number }[];
  color?: string;
  popupNode?: React.ReactNode;
}

interface Props {
  points: MapPoint[];
  routes?: MapRoute[];
  showLine?: boolean;
  height?: number;
  onPointClick?: (point: MapPoint) => void;
  onRouteClick?: (route: MapRoute) => void;
  focusPoint?: { lat: number; lng: number; zoom?: number } | null;
}

function FitBounds({ points, focusPoint }: { points: MapPoint[]; focusPoint?: { lat: number; lng: number; zoom?: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (focusPoint) {
      map.flyTo([focusPoint.lat, focusPoint.lng], focusPoint.zoom ?? 17);
      return;
    }
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 16);
    } else {
      map.fitBounds(points.map((p) => [p.lat, p.lng] as [number, number]), { padding: [30, 30] });
    }
  }, [points, focusPoint, map]);
  return null;
}

export default function ConnectionMapInner({ points, routes, showLine = true, height = 320, onPointClick, onRouteClick, focusPoint }: Props) {
  const center: [number, number] = points.length > 0 ? [points[0].lat, points[0].lng] : [50.0755, 14.4378];
  const allBoundsPoints = [...points, ...(routes ?? []).flatMap((r) => r.points.map((p) => ({ id: r.id, ...p })))];

  return (
    <div style={{ height }} className="overflow-hidden rounded-xl">
      <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; OpenStreetMap přispěvatelé'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {showLine && !routes && points.length > 1 && (
          <Polyline positions={points.map((p) => [p.lat, p.lng])} pathOptions={{ color: "#2DD4C8" }} />
        )}
        {routes?.map((r) => (
          <Polyline
            key={r.id}
            positions={r.points.map((p) => [p.lat, p.lng])}
            pathOptions={{ color: r.color ?? "#C9A24B" }}
            eventHandlers={onRouteClick ? { click: () => onRouteClick(r) } : undefined}
          >
            {r.popupNode && <Popup>{r.popupNode}</Popup>}
          </Polyline>
        ))}
        {points.map((p) => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            eventHandlers={onPointClick ? { click: () => onPointClick(p) } : undefined}
          >
            {(p.popupNode || p.popupText) && <Popup>{p.popupNode ?? p.popupText}</Popup>}
          </Marker>
        ))}
        <FitBounds points={allBoundsPoints} focusPoint={focusPoint} />
      </MapContainer>
    </div>
  );
}
