import Link from "next/link";

interface Props {
  photo: {
    id: string;
    photo_url: string;
    taken_at: string;
    address: string | null;
    latitude: number | null;
    author_name: string | null;
  };
  orderName: string;
}

export default function GpsPhotoCard({ photo, orderName }: Props) {
  return (
    <Link
      href={`/moduly/foto-gps/${photo.id}`}
      className="flex flex-col gap-2 overflow-hidden rounded-2xl border border-glass-border bg-glass-fill shadow-lg backdrop-blur-xs transition hover:border-turquoise/40 hover:bg-white/[0.06]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.photo_url} alt="Fotografie" className="h-40 w-full object-cover" />
      <div className="flex flex-col gap-1 p-4">
        <p className="text-xs text-white/40">{new Date(photo.taken_at).toLocaleString("cs-CZ")}</p>
        <p className="text-sm text-white/85">{orderName}</p>
        <p className="text-xs text-white/40">{photo.address ?? (photo.latitude ? "GPS bez adresy" : "Bez GPS")}</p>
        <p className="text-xs text-white/30">{photo.author_name ?? "—"}</p>
        <span className="mt-1 inline-block self-start rounded-xl border border-glass-border px-3 py-1.5 text-xs font-medium text-white/70">
          Otevřít
        </span>
      </div>
    </Link>
  );
}
