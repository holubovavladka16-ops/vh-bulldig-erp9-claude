import Link from "next/link";
import DocumentStatusBadge from "./DocumentStatusBadge";
import { documentTypeLabel } from "@/lib/documentTemplates";
import type { DocumentV2 } from "@/types/database.types";

export default function EmployeeDocumentsSection({ documents }: { documents: DocumentV2[] }) {
  return (
    <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
      <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
        Smlouvy a dokumenty
      </h2>
      {documents.length === 0 ? (
        <p className="text-sm text-white/35">Zatím nejsou žádné dokumenty.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {documents.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 py-2 last:border-0">
              <div>
                <p className="text-sm text-white/85">{d.custom_type_name || documentTypeLabel(d.document_type)}</p>
                <p className="text-xs text-white/40">
                  {d.document_number}
                  {d.effective_date && ` · Účinnost: ${new Date(d.effective_date).toLocaleDateString("cs-CZ")}`}
                  {d.expiry_date && ` · Do: ${new Date(d.expiry_date).toLocaleDateString("cs-CZ")}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <DocumentStatusBadge status={d.status} />
                <Link href={`/moduly/smlouvy-a-dokumenty/${d.id}`} className="rounded-lg border border-glass-border px-2 py-1 text-xs font-medium text-white/70 transition hover:bg-white/5">
                  Otevřít
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
