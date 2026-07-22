import Link from "next/link";
import CheckResultBadge from "./CheckResultBadge";
import { MONTH_NAMES } from "@/lib/paperForm";
import type { PaperFormCheck } from "@/types/database.types";

interface Props {
  check: PaperFormCheck;
  formNumber: string;
  employeeName: string;
}

export default function CheckCard({ check, formNumber, employeeName }: Props) {
  return (
    <Link
      href={`/moduly/kontrola-papiroveho-formulare/${check.id}`}
      className="flex flex-col gap-2 rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs transition hover:border-turquoise/40 hover:bg-white/[0.06]"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-display text-sm font-semibold text-white">{formNumber}</p>
        {check.overall_result && <CheckResultBadge result={check.overall_result} />}
      </div>
      <p className="text-sm text-white/70">{employeeName}</p>
      <p className="text-xs text-white/40">{MONTH_NAMES[check.month - 1]} {check.year}</p>
      <p className="text-xs text-white/40">{new Date(check.created_at).toLocaleDateString("cs-CZ")} · {check.created_by_name ?? "—"}</p>
      <span className="mt-1 inline-block self-start rounded-xl border border-glass-border px-3 py-1.5 text-xs font-medium text-white/70">
        Otevřít detail
      </span>
    </Link>
  );
}
