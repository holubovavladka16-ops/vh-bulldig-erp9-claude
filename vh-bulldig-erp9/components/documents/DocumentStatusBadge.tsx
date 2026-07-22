import type { DocumentStatusV2 } from "@/types/database.types";

export const DOC_STATUS_LABELS: Record<DocumentStatusV2, string> = {
  rozepsany: "Rozepsaný",
  pripraveny_ke_kontrole: "Připravený ke kontrole",
  schvaleny: "Schválený",
  odeslany_k_podpisu: "Odeslaný k podpisu",
  podepsany: "Podepsaný",
  ukonceny: "Ukončený",
  zruseny: "Zrušený",
  archivovany: "Archivovaný",
};

const CLASSES: Record<DocumentStatusV2, string> = {
  rozepsany: "bg-white/10 text-white/50",
  pripraveny_ke_kontrole: "bg-blue-500/10 text-blue-300",
  schvaleny: "bg-turquoise/10 text-turquoise-light",
  odeslany_k_podpisu: "bg-amber-500/10 text-amber-300",
  podepsany: "bg-emerald-500/10 text-emerald-300",
  ukonceny: "bg-white/10 text-white/40",
  zruseny: "bg-red-500/10 text-red-300",
  archivovany: "bg-white/5 text-white/30",
};

export default function DocumentStatusBadge({ status }: { status: DocumentStatusV2 }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${CLASSES[status]}`}>
      {DOC_STATUS_LABELS[status]}
    </span>
  );
}
