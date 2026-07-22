import type { BackupStatus } from "@/types/database.types";

const LABELS: Record<BackupStatus, string> = {
  probiha: "Probíhá",
  dokonceno: "Dokončeno",
  selhalo: "Selhalo",
};

const CLASSES: Record<BackupStatus, string> = {
  probiha: "bg-amber-500/10 text-amber-300",
  dokonceno: "bg-emerald-500/10 text-emerald-300",
  selhalo: "bg-red-500/10 text-red-300",
};

export default function BackupStatusBadge({ status }: { status: BackupStatus }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${CLASSES[status]}`}>
      {LABELS[status]}
    </span>
  );
}

export const BACKUP_STATUS_LABELS = LABELS;
