"use client";

import { useState } from "react";
import { Eye, Download, Share2 } from "lucide-react";
import { documentTypeLabel } from "@/lib/documentTypes";
import type { GeneratedDocument } from "@/types/database.types";

interface Props {
  doc: GeneratedDocument;
  employeeName: string | null;
  orderName: string | null;
}

export default function DocumentCard({ doc, employeeName, orderName }: Props) {
  const [busy, setBusy] = useState(false);

  async function handleShare() {
    setBusy(true);
    try {
      const response = await fetch(doc.file_url);
      const blob = await response.blob();
      const file = new File([blob], doc.file_name, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: doc.file_name });
      } else {
        window.open(doc.file_url, "_blank");
      }
    } catch {
      // sdílení zrušeno nebo selhalo
    } finally {
      setBusy(false);
    }
  }

  const period = doc.period_from
    ? `${new Date(doc.period_from).toLocaleDateString("cs-CZ")} – ${doc.period_to ? new Date(doc.period_to).toLocaleDateString("cs-CZ") : "—"}`
    : "—";

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
      <p className="font-display text-sm font-semibold text-white">{doc.file_name}</p>
      <p className="text-xs text-white/40">{documentTypeLabel(doc.document_type)}</p>
      <p className="text-xs text-white/40">{new Date(doc.created_at).toLocaleString("cs-CZ")}</p>
      {(employeeName || orderName) && <p className="text-xs text-white/50">{employeeName ?? orderName}</p>}
      <p className="text-xs text-white/40">Období: {period}</p>
      <p className="text-xs text-white/30">{doc.created_by_name ?? "—"}</p>

      <div className="mt-2 flex flex-wrap gap-2">
        <a
          href={doc.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-xl border border-glass-border px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/5"
        >
          <Eye size={13} />
          Náhled
        </a>
        <a
          href={doc.file_url}
          download={doc.file_name}
          className="flex items-center gap-1.5 rounded-xl border border-glass-border px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/5"
        >
          <Download size={13} />
          Stáhnout
        </a>
        <button
          type="button"
          onClick={handleShare}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-xl border border-glass-border px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/5 disabled:opacity-50"
        >
          <Share2 size={13} />
          Sdílet
        </button>
      </div>
    </div>
  );
}
