"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Copy, Check, Mail, QrCode } from "lucide-react";
import {
  buildShareUrl,
  buildWhatsAppShareUrl,
  buildMessengerShareUrl,
  buildMailtoShareUrl,
} from "@/lib/shareLinks";

interface Props {
  shareToken: string;
  employeeName: string;
}

export default function ShareFormSection({ shareToken, employeeName }: Props) {
  const [siteUrl, setSiteUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    setSiteUrl(window.location.origin);
  }, []);

  const link = siteUrl ? buildShareUrl(shareToken, siteUrl) : "";

  useEffect(() => {
    if (!link) return;
    QRCode.toDataURL(link, { margin: 1, width: 220 }).then(setQrDataUrl).catch(() => setQrDataUrl(null));
  }, [link]);

  async function handleCopy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API nemusí být dostupné - uživatel může odkaz zkopírovat ručně.
    }
  }

  async function handleShareOther() {
    if (!link) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Zaměstnanecký formulář", url: link });
      } catch {
        // Uživatel sdílení zrušil.
      }
    } else {
      handleCopy();
    }
  }

  return (
    <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
      <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
        Sdílený formulář zaměstnance
      </h2>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-glass-border bg-white/5 px-3 py-2">
          <span className="truncate text-xs text-white/60">{link}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-xl border border-glass-border px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-white/5"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Zkopírováno" : "Kopírovat odkaz"}
          </button>

          <a
            href={buildWhatsAppShareUrl(link, employeeName)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-glass-border px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-white/5"
          >
            WhatsApp
          </a>

          <a
            href={buildMessengerShareUrl(link)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-glass-border px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-white/5"
          >
            Messenger
          </a>

          <a
            href={buildMailtoShareUrl(link, employeeName)}
            className="flex items-center gap-2 rounded-xl border border-glass-border px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-white/5"
          >
            <Mail size={14} />
            E-mail
          </a>

          <button
            type="button"
            onClick={handleShareOther}
            className="flex items-center gap-2 rounded-xl border border-glass-border px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-white/5"
          >
            Sdílet jinak
          </button>

          <button
            type="button"
            onClick={() => setShowQr((v) => !v)}
            className="flex items-center gap-2 rounded-xl border border-glass-border px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-white/5"
          >
            <QrCode size={14} />
            {showQr ? "Skrýt QR kód" : "Zobrazit QR kód"}
          </button>
        </div>

        {showQr && qrDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrDataUrl} alt="QR kód sdíleného formuláře" className="h-40 w-40 rounded-lg bg-white p-2" />
        )}

        <p className="text-xs text-white/35">
          Zaměstnanec přes tento odkaz vidí pouze své vlastní údaje.
        </p>
      </div>
    </section>
  );
}
