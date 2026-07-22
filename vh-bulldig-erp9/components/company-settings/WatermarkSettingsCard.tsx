"use client";

import type { WatermarkSize } from "@/types/database.types";
import SettingsCard from "./SettingsCard";
import WatermarkA4Preview from "./WatermarkA4Preview";

const SIZE_OPTIONS: { value: WatermarkSize; label: string }[] = [
  { value: "maly", label: "Malý" },
  { value: "stredni", label: "Střední" },
  { value: "velky", label: "Velký" },
  { value: "automaticky", label: "Automaticky podle dokumentu" },
];

interface Props {
  watermarkUrl: string | null;
  opacity: number;
  size: WatermarkSize;
  readOnly: boolean;
  onOpacityChange: (value: number) => void;
  onSizeChange: (value: WatermarkSize) => void;
  onApply: () => void;
  onResetRecommended: () => void;
  onRemove: () => void;
  saving?: boolean;
}

export default function WatermarkSettingsCard({
  watermarkUrl,
  opacity,
  size,
  readOnly,
  onOpacityChange,
  onSizeChange,
  onApply,
  onResetRecommended,
  onRemove,
  saving,
}: Props) {
  return (
    <SettingsCard title="Nastavení vodoznaku">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-5">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm text-white/60">Průhlednost vodoznaku</span>
              <span className="font-display text-sm font-semibold text-turquoise-light">
                {opacity} %
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={20}
              step={1}
              value={opacity}
              disabled={readOnly}
              onChange={(e) => onOpacityChange(Number(e.target.value))}
              className="w-full accent-turquoise disabled:opacity-50"
            />
            <div className="mt-1 flex justify-between text-[11px] text-white/30">
              <span>5 %</span>
              <span>20 %</span>
            </div>
          </div>

          <div>
            <span className="mb-2 block text-sm text-white/60">Velikost vodoznaku</span>
            <div className="flex flex-wrap gap-2">
              {SIZE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={readOnly}
                  onClick={() => onSizeChange(opt.value)}
                  className={`rounded-xl border px-3 py-2 text-xs font-medium transition disabled:opacity-50 ${
                    size === opt.value
                      ? "border-turquoise bg-turquoise/10 text-turquoise-light"
                      : "border-glass-border text-white/60 hover:bg-white/5"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {!readOnly && (
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={onApply}
                disabled={saving || !watermarkUrl}
                className="rounded-xl bg-gradient-to-r from-gold to-gold-light px-4 py-2 text-sm font-semibold text-base-950 transition hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Ukládám…" : "Použít nastavení"}
              </button>
              <button
                type="button"
                onClick={onResetRecommended}
                className="rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/70 transition hover:bg-white/5"
              >
                Obnovit doporučené hodnoty
              </button>
              <button
                type="button"
                onClick={onRemove}
                disabled={!watermarkUrl}
                className="rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/10 disabled:opacity-30"
              >
                Odstranit vodoznak
              </button>
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 text-center text-xs text-white/40">Náhled dokumentu A4</p>
          <WatermarkA4Preview watermarkUrl={watermarkUrl} opacity={opacity} size={size} />
        </div>
      </div>
    </SettingsCard>
  );
}
