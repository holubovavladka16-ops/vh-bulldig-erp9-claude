import Link from "next/link";
import { Pencil } from "lucide-react";
import ConnectionMap from "./ConnectionMap";
import ConnectionPdf from "./ConnectionPdf";
import ConnectionPdfShareButtons from "./ConnectionPdfShareButtons";
import { formatMeters } from "@/lib/geo";
import type { Company, Connection, ConnectionHistoryEntry, ConnectionPhoto, ConnectionPoint } from "@/types/database.types";

const METHOD_LABELS: Record<string, string> = {
  prubezne_gps: "Průběžné GPS měření trasy",
  body_a_b: "Měření mezi bodem A a bodem B",
  dve_adresy: "Měření mezi dvěma adresami",
};

const HISTORY_LABELS: Record<string, string> = {
  vytvoreni: "Vytvoření přípojky",
  zmena_nazvu: "Změna názvu",
  zmena_zakazky: "Změna zakázky",
  zmena_mereni: "Nové měření (původní zachováno v historii)",
  zmena_delky: "Změna délky",
  zmena_gps_bodu: "Změna GPS bodů",
  pridani_fotografie: "Přidání fotografie",
  odstraneni_fotografie: "Odstranění fotografie",
  zmena_poznamky: "Změna poznámky",
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
  connection: Connection;
  orderName: string;
  points: ConnectionPoint[];
  photos: ConnectionPhoto[];
  history: ConnectionHistoryEntry[];
  company: Company | null;
  canEdit: boolean;
  justSaved?: boolean;
}

export default function ConnectionDetail({
  connection,
  orderName,
  points,
  photos,
  history,
  company,
  canEdit,
  justSaved,
}: Props) {
  const fileName = `pripojka-${connection.name.replace(/\s+/g, "-")}.pdf`;

  return (
    <div className="flex flex-col gap-6">
      {justSaved && (
        <p className="rounded-xl bg-turquoise/10 px-4 py-3 text-center text-sm text-turquoise-light">
          Přípojka byla úspěšně uložena.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-white">{connection.name}</h1>
        {canEdit && (
          <Link
            href={`/moduly/pripojky/${connection.id}/upravit`}
            className="flex items-center gap-2 rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/5"
          >
            <Pencil size={14} />
            Upravit
          </Link>
        )}
      </div>

      <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
        <Row label="Datum" value={new Date(connection.connection_date).toLocaleDateString("cs-CZ")} />
        <Row label="Zakázka" value={orderName} />
        <Row label="Způsob měření" value={METHOD_LABELS[connection.measurement_method]} />
        <Row label="Naměřená délka" value={connection.measured_length_meters !== null ? formatMeters(connection.measured_length_meters) : "—"} />
        <Row label="Poznámka" value={connection.note ?? "—"} />
        <Row label="Autor záznamu" value={connection.created_by_name ?? "—"} />
        <Row label="Vytvořeno" value={new Date(connection.created_at).toLocaleString("cs-CZ")} />
      </section>

      {points.length > 0 && (
        <section>
          <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
            Mapa trasy
          </h2>
          <ConnectionMap
            points={points.map((p) => ({ id: p.id, lat: p.latitude, lng: p.longitude, popupText: p.label ?? undefined }))}
          />
        </section>
      )}

      <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
          Fotografie ({photos.length})
        </h2>
        {photos.length === 0 ? (
          <p className="text-sm text-white/35">Žádné fotografie.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {photos.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={p.id} src={p.photo_url} alt={p.note ?? "Fotografie přípojky"} className="h-24 w-full rounded-lg object-cover" />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
          Export a sdílení PDF
        </h2>
        <ConnectionPdfShareButtons
          document={<ConnectionPdf company={company} connection={connection} orderName={orderName} points={points} photos={photos} />}
          fileName={fileName}
        />
      </section>

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
    </div>
  );
}
