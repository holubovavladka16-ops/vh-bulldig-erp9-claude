import type { DesignDef } from "@/lib/themes";

interface Props {
  design: DesignDef;
  active: boolean;
  onApply: () => void;
}

export default function DesignPreviewCard({ design, active, onApply }: Props) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border p-4 transition ${
        active ? "border-turquoise bg-turquoise/5" : "border-glass-border bg-glass-fill"
      }`}
    >
      <div
        className="flex h-16 w-full items-center gap-2 rounded-xl p-3"
        style={{ backgroundColor: design.base }}
      >
        <span className="h-5 w-5 rounded-full" style={{ backgroundColor: design.accent1 }} />
        <span className="h-5 w-5 rounded-full" style={{ backgroundColor: design.accent2 }} />
        <span className="ml-auto h-2 w-10 rounded-full bg-white/15" />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">{design.label}</p>
        {active && <span className="rounded-full bg-turquoise/10 px-2 py-0.5 text-[10px] font-medium text-turquoise-light">Aktivní</span>}
      </div>

      <button
        type="button"
        onClick={onApply}
        disabled={active}
        className="rounded-xl border border-glass-border px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-white/5 disabled:opacity-40"
      >
        {active ? "Použito" : "Použít design"}
      </button>
    </div>
  );
}
