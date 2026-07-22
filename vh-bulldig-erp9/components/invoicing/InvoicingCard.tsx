import Link from "next/link";
import { formatMoney } from "@/lib/attendance";
import type { InvoicingRecord } from "@/types/database.types";

export default function InvoicingCard({ record, orderName }: { record: InvoicingRecord; orderName: string }) {
  return (
    <Link
      href={`/moduly/fakturace-a-prehled-zisku/${record.id}`}
      className="flex flex-col gap-2 rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs transition hover:border-turquoise/40 hover:bg-white/[0.06]"
    >
      <p className="font-display text-sm font-semibold text-white">{orderName}</p>
      <p className="text-xs text-white/40">
        {new Date(record.period_from).toLocaleDateString("cs-CZ")} – {new Date(record.period_to).toLocaleDateString("cs-CZ")}
      </p>
      <p className="font-display text-lg font-semibold text-turquoise-light">{formatMoney(record.invoiced_amount)}</p>
      {record.note && <p className="text-xs text-white/35">{record.note}</p>}
      <span className="mt-1 inline-block self-start rounded-xl border border-glass-border px-3 py-1.5 text-xs font-medium text-white/70">
        Otevřít
      </span>
    </Link>
  );
}
