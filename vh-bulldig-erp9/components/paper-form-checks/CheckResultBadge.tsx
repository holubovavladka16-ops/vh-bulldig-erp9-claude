import type { CheckOverallResult } from "@/types/database.types";

const LABELS: Record<CheckOverallResult, string> = {
  shoda: "SHODA",
  castecna_shoda: "ČÁSTEČNÁ SHODA",
  neshoda: "NESHODA",
  nelze_precist: "NELZE PŘEČÍST",
};

const CLASSES: Record<CheckOverallResult, string> = {
  shoda: "bg-emerald-500/10 text-emerald-300",
  castecna_shoda: "bg-amber-500/10 text-amber-300",
  neshoda: "bg-red-500/10 text-red-300",
  nelze_precist: "bg-white/10 text-white/50",
};

export default function CheckResultBadge({ result }: { result: CheckOverallResult }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${CLASSES[result]}`}>
      {LABELS[result]}
    </span>
  );
}

export const CHECK_RESULT_LABELS = LABELS;
