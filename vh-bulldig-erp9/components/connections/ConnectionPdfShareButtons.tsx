"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Download, Eye, Mail, Share2 } from "lucide-react";

interface Props {
  document: React.ReactElement;
  fileName: string;
}

export default function ConnectionPdfShareButtons({ document: doc, fileName }: Props) {
  const [busy, setBusy] = useState<string | null>(null);

  async function getBlob() {
    return pdf(doc).toBlob();
  }

  async function handleDownload() {
    setBusy("download");
    try {
      const blob = await getBlob();
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

  async function handlePreview() {
    setBusy("preview");
    try {
      const blob = await getBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } finally {
      setBusy(null);
    }
  }

  async function handleShare() {
    setBusy("share");
    try {
      const blob = await getBlob();
      const file = new File([blob], fileName, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: fileName });
      } else {
        // Prohlížeč neumí sdílet skutečný soubor - nabídneme alespoň stažení.
        await handleDownload();
      }
    } catch {
      // Uživatel sdílení zrušil.
    } finally {
      setBusy(null);
    }
  }

  async function handleEmailShare() {
    setBusy("email");
    try {
      const blob = await getBlob();
      const file = new File([blob], fileName, { type: "application/pdf" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: fileName });
      } else {
        window.location.href = `mailto:?subject=${encodeURIComponent(fileName)}`;
        await handleDownload();
      }
    } catch {
      // zrušeno
    } finally {
      setBusy(null);
    }
  }

  const btnClass =
    "flex items-center gap-2 rounded-xl border border-glass-border px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-white/5 disabled:opacity-50";

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={handlePreview} disabled={busy !== null} className={btnClass}>
        <Eye size={14} />
        Náhled
      </button>
      <button type="button" onClick={handleDownload} disabled={busy !== null} className={btnClass}>
        <Download size={14} />
        Stáhnout
      </button>
      <button type="button" onClick={handleEmailShare} disabled={busy !== null} className={btnClass}>
        <Mail size={14} />
        E-mail
      </button>
      <button type="button" onClick={handleShare} disabled={busy !== null} className={btnClass}>
        <Share2 size={14} />
        {busy === "share" ? "Sdílím…" : "Sdílet (WhatsApp/Messenger/systémové)"}
      </button>
    </div>
  );
}
