import { PAPER_FORM_STATUS_LABELS } from "@/lib/paperForm";
import type { PaperFormStatus } from "@/types/database.types";

const CLASSES: Record<PaperFormStatus, string> = {
  vytvoreny: "bg-white/10 text-white/50",
  vytisteny: "bg-blue-500/10 text-blue-300",
  prirazeny: "bg-turquoise/10 text-turquoise-light",
  odevzdany: "bg-amber-500/10 text-amber-300",
  zkontrolovany: "bg-emerald-500/10 text-emerald-300",
  uzavreny: "bg-white/10 text-white/40",
  zneplatneny: "bg-red-500/10 text-red-300",
};

export default function PaperFormStatusBadge({ status }: { status: PaperFormStatus }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${CLASSES[status]}`}>
      {PAPER_FORM_STATUS_LABELS[status]}
    </span>
  );
}
