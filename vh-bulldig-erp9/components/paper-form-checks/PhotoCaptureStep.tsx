"use client";

import { useRef, useState } from "react";
import { Camera, ImagePlus, FileUp, X } from "lucide-react";
import { assessImageQuality, LOW_QUALITY_MESSAGE, type ImageQualityResult } from "@/lib/imageQuality";

export interface CapturedFile {
  key: string;
  file: File;
  previewUrl: string | null;
  quality: ImageQualityResult | null;
  isPdf: boolean;
}

interface Props {
  files: CapturedFile[];
  onChange: (files: CapturedFile[]) => void;
}

let keyCounter = 0;

export default function PhotoCaptureStep({ files, onChange }: Props) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [checking, setChecking] = useState(false);

  async function addFile(file: File) {
    keyCounter += 1;
    const key = `f-${Date.now()}-${keyCounter}`;
    const isPdf = file.type === "application/pdf";

    if (isPdf) {
      onChange([...files, { key, file, previewUrl: null, quality: null, isPdf: true }]);
      return;
    }

    setChecking(true);
    try {
      const quality = await assessImageQuality(file);
      const previewUrl = URL.createObjectURL(file);
      onChange([...files, { key, file, previewUrl, quality, isPdf: false }]);
    } finally {
      setChecking(false);
    }
  }

  function removeFile(key: string) {
    onChange(files.filter((f) => f.key !== key));
  }

  return (
    <div className="flex flex-col gap-4">
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) addFile(f);
          e.target.value = "";
        }}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) addFile(f);
          e.target.value = "";
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) addFile(f);
          e.target.value = "";
        }}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-light px-4 py-2.5 text-sm font-semibold text-base-950 transition hover:opacity-90"
        >
          <Camera size={16} />
          Vyfotit formulář
        </button>
        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          className="flex items-center gap-2 rounded-xl border border-glass-border px-4 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/5"
        >
          <ImagePlus size={16} />
          Vybrat z galerie
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 rounded-xl border border-glass-border px-4 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/5"
        >
          <FileUp size={16} />
          Nahrát formulář (PDF/obrázek)
        </button>
      </div>

      {checking && <p className="text-xs text-white/40">Kontroluji kvalitu fotografie…</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {files.map((f) => (
          <div key={f.key} className="relative rounded-xl border border-glass-border bg-white/5 p-2">
            <button
              type="button"
              onClick={() => removeFile(f.key)}
              className="absolute right-1 top-1 z-10 rounded-lg bg-black/60 p-1 text-white/70 hover:text-white"
            >
              <X size={14} />
            </button>
            {f.isPdf ? (
              <div className="flex h-24 items-center justify-center text-xs text-white/50">PDF soubor</div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={f.previewUrl ?? undefined} alt="Fotografie formuláře" className="h-24 w-full rounded-lg object-cover" />
            )}
            {f.quality && !f.quality.ok && (
              <p className="mt-1 text-[10px] text-amber-300">{LOW_QUALITY_MESSAGE}</p>
            )}
            {f.quality && f.quality.issues.length > 0 && (
              <p className="mt-1 text-[10px] text-white/30">{f.quality.issues.join(", ")}</p>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-white/30">
        Zkontrolujte prosím sami, že je formulář celý v záběru a že je viditelný QR kód a ID – toto
        automatická kontrola kvality neumí ověřit.
      </p>
    </div>
  );
}
