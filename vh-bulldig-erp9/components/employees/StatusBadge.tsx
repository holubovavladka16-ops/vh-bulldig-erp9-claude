import type { EmployeeStatus } from "@/types/database.types";

const LABELS: Record<EmployeeStatus, string> = {
  aktivni: "Aktivní",
  neaktivni: "Neaktivní",
  ukonceny: "Ukončený pracovní poměr",
  pozastaveny: "Dočasně pozastavený",
};

const CLASSES: Record<EmployeeStatus, string> = {
  aktivni: "bg-emerald-500/10 text-emerald-300",
  neaktivni: "bg-white/10 text-white/50",
  ukonceny: "bg-red-500/10 text-red-300",
  pozastaveny: "bg-amber-500/10 text-amber-300",
};

export default function StatusBadge({ status }: { status: EmployeeStatus }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${CLASSES[status]}`}>
      {LABELS[status]}
    </span>
  );
}

export const STATUS_LABELS = LABELS;
