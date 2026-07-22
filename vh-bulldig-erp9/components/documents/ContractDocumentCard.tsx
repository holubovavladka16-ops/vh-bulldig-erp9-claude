import Link from "next/link";
import DocumentStatusBadge from "./DocumentStatusBadge";
import ConnectionPdfShareButtons from "@/components/connections/ConnectionPdfShareButtons";
import DocumentPdf from "./pdf/DocumentPdf";
import { documentTypeLabel } from "@/lib/documentTemplates";
import type { Company, DocumentV2 } from "@/types/database.types";

interface Props {
  doc: DocumentV2;
  relatedName: string | null;
  company: Company | null;
}

export default function ContractDocumentCard({ doc, relatedName, company }: Props) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-sm font-semibold text-white">{doc.document_number}</p>
          <p className="text-xs text-white/40">{doc.custom_type_name || documentTypeLabel(doc.document_type)}</p>
        </div>
        <DocumentStatusBadge status={doc.status} />
      </div>
      <p className="text-sm text-white/70">{doc.title}</p>
      {relatedName && <p className="text-xs text-white/40">{relatedName}</p>}
      <p className="text-xs text-white/40">
        Vytvořeno: {new Date(doc.created_at).toLocaleDateString("cs-CZ")}
        {doc.effective_date && ` · Účinnost: ${new Date(doc.effective_date).toLocaleDateString("cs-CZ")}`}
      </p>
      <p className="text-xs text-white/30">{doc.created_by_name ?? "—"}</p>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Link
          href={`/moduly/smlouvy-a-dokumenty/${doc.id}`}
          className="rounded-xl border border-glass-border px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/5"
        >
          Otevřít
        </Link>
        <ConnectionPdfShareButtons
          document={<DocumentPdf company={company} doc={doc} />}
          fileName={`${doc.document_number}.pdf`}
        />
      </div>
    </div>
  );
}
