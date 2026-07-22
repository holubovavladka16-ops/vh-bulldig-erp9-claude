import { ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_CLASSES } from "@/lib/attendance";
import type { AttendanceStatus } from "@/types/database.types";

export default function AttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${ATTENDANCE_STATUS_CLASSES[status]}`}>
      {ATTENDANCE_STATUS_LABELS[status]}
    </span>
  );
}
