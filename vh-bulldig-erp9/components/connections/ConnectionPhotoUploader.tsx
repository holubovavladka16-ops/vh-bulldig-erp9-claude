"use client";

import { useRef } from "react";
import { Camera, ImagePlus, X } from "lucide-react";

export interface PhotoDraft {
  key: string;
  file?: File;
  previewUrl: string;
  pointId: string;
  note: string;
  existingId?: string; // pokud jde o už uloženou fotografii při úpravě
}

interface PointOption {
  id: string;
  label: string;
}

interface Props {
  photos: PhotoDraft[];
  pointOptions: PointOption[];
  onAdd: (file: File) => void;
  onChange: (key: string, patch: Partial<PhotoDraft>) => void;
  onRemove: (key: string) => void;
  readOnly?: boolean;
}

let keyCounter = 0;
export function newPhotoKey() {
  keyCounter += 1;
  return `photo-${Date.now()}-${keyCounter}`;
}

export default function ConnectionPhotoUploader({ photos, pointOptions, onAdd, onChange, onRemove, readOnly }: Props) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-4">
      {!readOnly && (
        <div className="flex flex-wrap gap-2">
          {/* capture="environment" otevře na telefonu skutečný fotoaparát, ne galerii */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onAdd(file);
              e.target.value = "";
            }}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onAdd(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex items-center gap-2 rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/5"
          >
            <Camera size={16} />
            Vyfotit
          </button>
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="flex items-center gap-2 rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/5"
          >
            <ImagePlus size={16} />
            Vybrat z galerie
          </button>
        </div>
      )}

      {photos.length === 0 ? (
        <p className="text-sm text-white/35">Zatím žádné fotografie.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {photos.map((p) => (
            <div key={p.key} className="flex gap-3 rounded-xl border border-glass-border bg-white/5 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.previewUrl} alt="Fotografie přípojky" className="h-20 w-20 shrink-0 rounded-lg object-cover" />
              <div className="flex flex-1 flex-col gap-2">
                <select
                  value={p.pointId}
                  disabled={readOnly}
                  onChange={(e) => onChange(p.key, { pointId: e.target.value })}
                  className="rounded-lg border border-glass-border bg-white/5 px-2 py-1 text-xs text-white outline-none focus:border-turquoise"
                >
                  <option value="" className="bg-base-900">Bez propojení s bodem</option>
                  {pointOptions.map((pt) => (
                    <option key={pt.id} value={pt.id} className="bg-base-900">
                      {pt.label}
                    </option>
                  ))}
                </select>
                <input
                  value={p.note}
                  disabled={readOnly}
                  onChange={(e) => onChange(p.key, { note: e.target.value })}
                  placeholder="Poznámka"
                  className="rounded-lg border border-glass-border bg-white/5 px-2 py-1 text-xs text-white outline-none focus:border-turquoise"
                />
              </div>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => onRemove(p.key)}
                  className="self-start rounded-lg border border-glass-border p-1.5 text-red-300 transition hover:bg-red-500/10"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
