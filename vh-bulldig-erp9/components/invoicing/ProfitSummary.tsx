import { formatMoney } from "@/lib/attendance";
import type { ProfitCalculation } from "@/lib/profit";

function Box({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="rounded-2xl border border-glass-border bg-glass-fill p-4 text-center shadow-lg backdrop-blur-xs">
      <p className={`font-display text-lg font-semibold ${className ?? "text-white"}`}>{value}</p>
      <p className="mt-1 text-xs text-white/40">{label}</p>
    </div>
  );
}

export default function ProfitSummary({ calc }: { calc: ProfitCalculation }) {
  const isProfit = calc.result > 0;
  const isLoss = calc.result < 0;
  const resultLabel = isProfit ? "Zisk" : isLoss ? "Ztráta" : "Výsledek";
  const resultClass = isProfit ? "text-emerald-400" : isLoss ? "text-red-400" : "text-white";

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      <Box label="Vyfakturováno" value={formatMoney(calc.invoicedAmount)} />
      <Box label="Mzdové náklady" value={formatMoney(calc.laborCost)} />
      <Box label="Ostatní náklady" value={formatMoney(calc.otherCosts)} />
      <Box label="Celkové náklady" value={formatMoney(calc.totalCosts)} />
      <Box label={resultLabel} value={formatMoney(calc.result)} className={resultClass} />
    </div>
  );
}
