import Link from "next/link";
import AttendanceStatusBadge from "@/components/attendance/AttendanceStatusBadge";
import { formatMoney } from "@/lib/attendance";
import type { AttendanceRecord } from "@/types/database.types";

interface Props {
  records: AttendanceRecord[];
  employeeNameById: Record<string, string>;
  orderNameById: Record<string, string>;
}

export default function ReviewQueueList({ records, employeeNameById, orderNameById }: Props) {
  if (records.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-glass-border p-10 text-center text-sm text-white/40">
        Žádné záznamy nečekají na kontrolu.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {records.map((r) => (
        <div
          key={r.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-glass-border bg-glass-fill p-4 shadow-lg backdrop-blur-xs"
        >
          <div>
            <p className="font-medium text-white">{employeeNameById[r.employee_id] ?? "—"}</p>
            <p className="text-xs text-white/40">
              {new Date(r.record_date).toLocaleDateString("cs-CZ")} · {orderNameById[r.order_id] ?? "—"}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-white/50">
            <span>Výdělek: {formatMoney(r.total_earnings)}</span>
            <span>Záloha: {formatMoney(r.daily_advance)}</span>
            <AttendanceStatusBadge status={r.status} />
            <Link
              href={`/moduly/dochazka/${r.id}`}
              className="rounded-xl border border-glass-border px-3 py-1.5 font-medium text-white/70 transition hover:bg-white/5"
            >
              Otevřít
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
