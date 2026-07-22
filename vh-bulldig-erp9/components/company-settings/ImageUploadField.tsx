"use client";

import { useRef } from "react";
import { ImageOff, Upload, X } from "lucide-react";

interface Props {
  label: string;
  previewUrl: string | null;
  uploadLabel: string;
  onSelectFile: (file: File) => void;
  onRemove: () => void;
  readOnly?: boolean;
  error?: string | null;
}

export default function ImageUploadField({
  label,
  previewUrl,
  uploadLabel,
  onSelectFile,
  onRemove,
  readOnly,
  error,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-glass-border bg-white/5">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt={label} className="h-full w-full object-contain" />
        ) : (
          <ImageOff size={28} className="text-white/20" />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onSelectFile(file);
            e.target.value = "";
          }}
        />
        {!readOnly && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-2 rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/5 hover:text-white"
            >
              <Upload size={14} />
              {previewUrl ? "Změnit " + uploadLabel.toLowerCase() : uploadLabel}
            </button>
            {previewUrl && (
              <button
                type="button"
                onClick={onRemove}
                className="flex items-center gap-2 rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/10"
              >
                <X size={14} />
                Odstranit
              </button>
            )}
          </div>
        )}
        <p className="text-xs text-white/35">
          Podporované formáty: PNG, JPG, JPEG, WEBP. Lze vybrat z galerie
          telefonu i ze souborů počítače.
        </p>
        {error && <p className="text-xs text-red-300">{error}</p>}
      </div>
    </div>
  );
}
