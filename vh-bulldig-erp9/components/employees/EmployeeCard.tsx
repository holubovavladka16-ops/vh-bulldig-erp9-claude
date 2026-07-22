import Link from "next/link";
import StatusBadge from "./StatusBadge";
import type { Employee } from "@/types/database.types";

interface Props {
  employee: Employee;
  employmentTypeName: string;
}

export default function EmployeeCard({ employee, employmentTypeName }: Props) {
  return (
    <Link
      href={`/moduly/zamestnanci/${employee.id}`}
      className="flex flex-col gap-3 rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs transition hover:border-turquoise/40 hover:bg-white/[0.06]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-base font-semibold text-white">
            {employee.first_name} {employee.last_name}
          </p>
          <p className="text-sm text-white/50">{employee.position}</p>
        </div>
        <StatusBadge status={employee.status} />
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/40">
        <span>Nástup: {new Date(employee.start_date).toLocaleDateString("cs-CZ")}</span>
        <span>{employmentTypeName}</span>
      </div>

      <div className="mt-1 flex flex-wrap gap-2">
        <span className="inline-block self-start rounded-xl border border-glass-border px-3 py-1.5 text-xs font-medium text-white/70">
          Otevřít kartu
        </span>
        <span
          role="link"
          tabIndex={0}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = `/moduly/individualni-cenik/${employee.id}`;
          }}
          className="inline-block cursor-pointer self-start rounded-xl border border-glass-border px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/5"
        >
          Ceník
        </span>
      </div>
    </Link>
  );
}
