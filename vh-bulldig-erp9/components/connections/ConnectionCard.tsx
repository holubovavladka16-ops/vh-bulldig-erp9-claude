import Link from "next/link";
import { formatMeters } from "@/lib/geo";
import type { Connection } from "@/types/database.types";

interface Props {
  connection: Connection;
  orderName: string;
  pointCount: number;
  photoCount: number;
}

export default function ConnectionCard({ connection, orderName, pointCount, photoCount }: Props) {
  return (
    <Link
      href={`/moduly/pripojky/${connection.id}`}
      className="flex flex-col gap-2 rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs transition hover:border-turquoise/40 hover:bg-white/[0.06]"
    >
      <p className="font-display text-sm font-semibold text-white">{connection.name}</p>
      <p className="text-xs text-white/40">
        {new Date(connection.connection_date).toLocaleDateString("cs-CZ")} · {orderName}
      </p>
      <div className="mt-1 grid grid-cols-3 gap-2 text-xs text-white/50">
        <span>Délka: {connection.measured_length_meters !== null ? formatMeters(connection.measured_length_meters) : "—"}</span>
        <span>Body: {pointCount}</span>
        <span>Foto: {photoCount}</span>
      </div>
      <span className="mt-1 inline-block self-start rounded-xl border border-glass-border px-3 py-1.5 text-xs font-medium text-white/70">
        Otevřít
      </span>
    </Link>
  );
}
