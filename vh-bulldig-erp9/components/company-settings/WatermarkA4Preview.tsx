import type { WatermarkSize } from "@/types/database.types";

interface Props {
  watermarkUrl: string | null;
  opacity: number; // 5-20
  size: WatermarkSize;
}

const SIZE_WIDTH_PERCENT: Record<WatermarkSize, number> = {
  maly: 30,
  stredni: 50,
  velky: 70,
  automaticky: 55,
};

export default function WatermarkA4Preview({ watermarkUrl, opacity, size }: Props) {
  const widthPercent = SIZE_WIDTH_PERCENT[size];

  return (
    <div className="mx-auto aspect-[210/297] w-full max-w-[280px] rounded-md bg-white p-4 text-[8px] leading-tight text-neutral-800 shadow-2xl">
      <div className="relative h-full w-full overflow-hidden">
        {/* Ukázkový obsah dokumentu, aby bylo vidět, že vodoznak nepřekrývá text ani tabulku */}
        <div className="relative z-10 flex h-full flex-col gap-2">
          <div className="h-2 w-2/3 rounded bg-neutral-300" />
          <div className="h-1.5 w-1/2 rounded bg-neutral-200" />
          <div className="mt-2 h-1.5 w-full rounded bg-neutral-200" />
          <div className="h-1.5 w-full rounded bg-neutral-200" />
          <div className="h-1.5 w-4/5 rounded bg-neutral-200" />

          <div className="mt-3 flex-1 rounded border border-neutral-300">
            <div className="grid grid-cols-4 gap-px bg-neutral-200 p-1">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="h-2 rounded-sm bg-neutral-100" />
              ))}
            </div>
          </div>

          <div className="mt-2 h-1.5 w-1/3 rounded bg-neutral-300" />
        </div>

        {watermarkUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={watermarkUrl}
            alt="Náhled vodoznaku"
            style={{ opacity: opacity / 100, width: `${widthPercent}%` }}
            className="pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 object-contain"
          />
        )}
      </div>
    </div>
  );
}
