"use client";

import { useState } from "react";
import { PDFViewer, pdf } from "@react-pdf/renderer";
import { X, Download, Share2 } from "lucide-react";

interface Props {
  document: React.ReactElement;
  fileName: string;
  onClose: () => void;
}

export default function GpsPhotoPdfPreviewModal({ document: doc, fileName, onClose }: Props) {
  const [busy, setBusy] = useState<string | null>(null);

  async function handleDownload() {
    setBusy("download");
    try {
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(null);
    }
  }

  async function handleShare() {
    setBusy("share");
    try {
      const blob = await pdf(doc).toBlob();
      const file = new File([blob], fileName, { type: "application/pdf" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: fileName });
      } else {
        await handleDownload();
      }
    } catch {
      // sdílení zrušeno
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/80 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleDownload}
            disabled={busy !== null}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-light px-4 py-2 text-sm font-semibold text-base-950 transition hover:opacity-90 disabled:opacity-50"
          >
            <Download size={14} />
            Stáhnout PDF
          </button>
          <button
            type="button"
            onClick={handleShare}
            disabled={busy !== null}
            className="flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
          >
            <Share2 size={14} />
            Sdílet PDF
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
        >
          <X size={14} />
          Zavřít náhled
        </button>
      </div>

      <div className="flex-1 overflow-hidden rounded-xl bg-white">
        <PDFViewer width="100%" height="100%" showToolbar={false} style={{ border: "none" }}>
          {doc}
        </PDFViewer>
      </div>
    </div>
  );
}
