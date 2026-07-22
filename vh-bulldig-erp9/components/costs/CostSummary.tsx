import { COST_CATEGORIES } from "@/lib/costs";
import { formatMoney } from "@/lib/attendance";
import type { CostCategory } from "@/types/database.types";

interface Props {
  categoryTotals: Record<CostCategory, number>;
  laborCost: number;
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-glass-border bg-glass-fill p-4 text-center shadow-lg backdrop-blur-xs">
      <p className="font-display text-lg font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-white/40">{label}</p>
    </div>
  );
}

export default function CostSummary({ categoryTotals, laborCost }: Props) {
  const otherTotal = Object.values(categoryTotals).reduce((s, v) => s + v, 0);
  const grandTotal = otherTotal + laborCost;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {COST_CATEGORIES.map((c) => (
          <Box key={c.key} label={c.label} value={formatMoney(categoryTotals[c.key] ?? 0)} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Box label="Mzdové náklady" value={formatMoney(laborCost)} />
        <Box label="Ostatní náklady celkem" value={formatMoney(otherTotal)} />
        <Box label="Celkové náklady" value={formatMoney(grandTotal)} />
      </div>
    </div>
  );
}
