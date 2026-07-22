import Link from "next/link";
import { COST_CATEGORY_LABELS } from "@/lib/costs";
import { formatMoney } from "@/lib/attendance";
import type { Cost } from "@/types/database.types";

export default function CostCard({ cost, orderName }: { cost: Cost; orderName: string }) {
  return (
    <Link
      href={`/moduly/naklady/${cost.id}`}
      className="flex flex-col gap-2 rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs transition hover:border-turquoise/40 hover:bg-white/[0.06]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-sm font-semibold text-white">
            {new Date(cost.cost_date).toLocaleDateString("cs-CZ")}
          </p>
          <p className="text-xs text-white/40">{orderName}</p>
        </div>
        <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/60">
          {COST_CATEGORY_LABELS[cost.category]}
        </span>
      </div>
      <p className="text-sm text-white/70">{cost.description}</p>
      <p className="font-display text-lg font-semibold text-turquoise-light">{formatMoney(cost.amount)}</p>
      <span className="mt-1 inline-block self-start rounded-xl border border-glass-border px-3 py-1.5 text-xs font-medium text-white/70">
        Otevřít
      </span>
    </Link>
  );
}
