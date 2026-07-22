import { categorizeWorkItems, type CategoryTotals } from "@/lib/reports";
import type { AttendanceRecord, AttendanceWorkItem, Employee } from "@/types/database.types";

export interface EmployeePayrollSummary {
  employee: Employee;
  workDays: number;
  totals: CategoryTotals;
  totalEarnings: number;
  totalAdvances: number;
  balanceDue: number;
}

/** Pouze schválené záznamy (bod 12 Modulu 15 / bod 10 Modulu 8). */
export function buildPayrollSummary(
  employee: Employee,
  records: AttendanceRecord[],
  itemsByRecordId: Record<string, AttendanceWorkItem[]>
): EmployeePayrollSummary {
  const approved = records.filter((r) => r.status === "schvaleny");
  const allItems = approved.flatMap((r) => itemsByRecordId[r.id] ?? []);

  return {
    employee,
    workDays: approved.length,
    totals: categorizeWorkItems(allItems),
    totalEarnings: approved.reduce((s, r) => s + Number(r.total_earnings), 0),
    totalAdvances: approved.reduce((s, r) => s + Number(r.daily_advance), 0),
    balanceDue: approved.reduce((s, r) => s + Number(r.balance_due), 0),
  };
}
