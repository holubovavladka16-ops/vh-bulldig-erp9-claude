import Link from "next/link";
import AttendanceStatusBadge from "./AttendanceStatusBadge";
import { formatMoney } from "@/lib/attendance";
import type { AttendanceRecord } from "@/types/database.types";

interface Props {
  record: AttendanceRecord;
  employeeName: string;
  orderName: string;
  workItemCount: number;
}

export default function AttendanceRecordCard({ record, employeeName, orderName, workItemCount }: Props) {
  return (
    <Link
      href={`/moduly/dochazka/${record.id}`}
      className="flex flex-col gap-2 rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs transition hover:border-turquoise/40 hover:bg-white/[0.06]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-sm font-semibold text-white">
            {new Date(record.record_date).toLocaleDateString("cs-CZ")}
          </p>
          <p className="text-sm text-white/60">{employeeName}</p>
          <p className="text-xs text-white/40">{orderName}</p>
        </div>
        <AttendanceStatusBadge status={record.status} />
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-white/50">
        <span>
          Přítomnost: {record.work_start ?? "—"}–{record.work_end ?? "—"}
        </span>
        <span>Pracovní výkon: {workItemCount} činností</span>
        <span>Výdělek: {formatMoney(record.total_earnings)}</span>
        <span>Záloha: {formatMoney(record.daily_advance)}</span>
        <span className="col-span-2 font-medium text-turquoise-light">
          Doplatek: {formatMoney(record.balance_due)}
        </span>
      </div>

      <span className="mt-1 inline-block self-start rounded-xl border border-glass-border px-3 py-1.5 text-xs font-medium text-white/70">
        Otevřít
      </span>
    </Link>
  );
}
