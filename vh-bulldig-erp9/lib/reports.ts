import { ACTIVITY_PRESETS } from "@/lib/pricing";
import type { AttendanceRecord, AttendanceWorkItem, Employee, Order } from "@/types/database.types";

const LABEL = {
  hodinova: ACTIVITY_PRESETS.find((a) => a.key === "hodinova_sazba")!.label,
  vykop: ACTIVITY_PRESETS.find((a) => a.key === "rucni_vykop")!.label,
  pruraz: ACTIVITY_PRESETS.find((a) => a.key === "pruraz")!.label,
  demontaz: ACTIVITY_PRESETS.find((a) => a.key === "demontaz_dlazby")!.label,
  pokladka: ACTIVITY_PRESETS.find((a) => a.key === "pokladka_dlazby")!.label,
  denni: ACTIVITY_PRESETS.find((a) => a.key === "denni_sazba_ukol")!.label,
};

export interface CategoryTotals {
  hoursWorked: number; // hod
  manualDigBm: number; // bm
  breakthroughsKs: number; // ks
  pavingRemovalM2: number; // m²
  pavingLayingM2: number; // m²
  dailyRateDays: number; // den
  otherActivities: { name: string; quantity: number; unit: string }[];
}

export function categorizeWorkItems(items: AttendanceWorkItem[]): CategoryTotals {
  const totals: CategoryTotals = {
    hoursWorked: 0,
    manualDigBm: 0,
    breakthroughsKs: 0,
    pavingRemovalM2: 0,
    pavingLayingM2: 0,
    dailyRateDays: 0,
    otherActivities: [],
  };

  const otherMap = new Map<string, { quantity: number; unit: string }>();

  for (const item of items) {
    switch (item.activity_name) {
      case LABEL.hodinova:
        totals.hoursWorked += Number(item.quantity);
        break;
      case LABEL.vykop:
        totals.manualDigBm += Number(item.quantity);
        break;
      case LABEL.pruraz:
        totals.breakthroughsKs += Number(item.quantity);
        break;
      case LABEL.demontaz:
        totals.pavingRemovalM2 += Number(item.quantity);
        break;
      case LABEL.pokladka:
        totals.pavingLayingM2 += Number(item.quantity);
        break;
      case LABEL.denni:
        totals.dailyRateDays += Number(item.quantity);
        break;
      default: {
        const key = `${item.activity_name}__${item.unit}`;
        const existing = otherMap.get(key);
        if (existing) {
          existing.quantity += Number(item.quantity);
        } else {
          otherMap.set(key, { quantity: Number(item.quantity), unit: item.unit });
        }
      }
    }
  }

  totals.otherActivities = Array.from(otherMap.entries()).map(([key, v]) => ({
    name: key.split("__")[0],
    quantity: v.quantity,
    unit: v.unit,
  }));

  return totals;
}

export interface DayDetail {
  record: AttendanceRecord;
  orderName: string;
  workItems: AttendanceWorkItem[];
}

export interface EmployeeReport {
  employee: Employee;
  dateFrom: string;
  dateTo: string;
  workDays: number;
  orderNames: string[];
  totals: CategoryTotals;
  totalEarnings: number;
  totalAdvances: number;
  totalBalance: number;
  days: DayDetail[];
}

export function buildEmployeeReport(
  employee: Employee,
  records: AttendanceRecord[],
  itemsByRecordId: Record<string, AttendanceWorkItem[]>,
  orderNameById: Record<string, string>,
  dateFrom: string,
  dateTo: string
): EmployeeReport {
  const approved = records.filter((r) => r.status === "schvaleny");
  const allItems = approved.flatMap((r) => itemsByRecordId[r.id] ?? []);

  const orderNames = Array.from(new Set(approved.map((r) => orderNameById[r.order_id] ?? "—")));

  const days: DayDetail[] = approved
    .sort((a, b) => a.record_date.localeCompare(b.record_date))
    .map((r) => ({
      record: r,
      orderName: orderNameById[r.order_id] ?? "—",
      workItems: itemsByRecordId[r.id] ?? [],
    }));

  return {
    employee,
    dateFrom,
    dateTo,
    workDays: approved.length,
    orderNames,
    totals: categorizeWorkItems(allItems),
    totalEarnings: approved.reduce((s, r) => s + Number(r.total_earnings), 0),
    totalAdvances: approved.reduce((s, r) => s + Number(r.daily_advance), 0),
    totalBalance: approved.reduce((s, r) => s + Number(r.balance_due), 0),
    days,
  };
}

export interface EmployeeOnOrderSummary {
  employee: Employee;
  workDays: number;
  hoursWorked: number;
  totalEarnings: number;
  totalAdvances: number;
  totalBalance: number;
}

export interface OrderReport {
  order: Order;
  dateFrom: string;
  dateTo: string;
  employees: EmployeeOnOrderSummary[];
  workDays: number;
  totals: CategoryTotals;
  totalLaborCost: number;
  days: DayDetail[];
}

export function buildOrderReport(
  order: Order,
  records: AttendanceRecord[],
  itemsByRecordId: Record<string, AttendanceWorkItem[]>,
  employeeById: Record<string, Employee>,
  dateFrom: string,
  dateTo: string
): OrderReport {
  const approved = records.filter((r) => r.status === "schvaleny");
  const allItems = approved.flatMap((r) => itemsByRecordId[r.id] ?? []);

  const byEmployee = new Map<string, AttendanceRecord[]>();
  for (const r of approved) {
    const list = byEmployee.get(r.employee_id) ?? [];
    list.push(r);
    byEmployee.set(r.employee_id, list);
  }

  const employees: EmployeeOnOrderSummary[] = Array.from(byEmployee.entries()).map(([employeeId, recs]) => {
    const items = recs.flatMap((r) => itemsByRecordId[r.id] ?? []);
    const hours = items
      .filter((i) => i.activity_name === LABEL.hodinova)
      .reduce((s, i) => s + Number(i.quantity), 0);

    return {
      employee: employeeById[employeeId],
      workDays: recs.length,
      hoursWorked: hours,
      totalEarnings: recs.reduce((s, r) => s + Number(r.total_earnings), 0),
      totalAdvances: recs.reduce((s, r) => s + Number(r.daily_advance), 0),
      totalBalance: recs.reduce((s, r) => s + Number(r.balance_due), 0),
    };
  });

  const days: DayDetail[] = approved
    .sort((a, b) => a.record_date.localeCompare(b.record_date))
    .map((r) => ({
      record: r,
      orderName: order.name,
      workItems: itemsByRecordId[r.id] ?? [],
    }));

  return {
    order,
    dateFrom,
    dateTo,
    employees,
    workDays: approved.length,
    totals: categorizeWorkItems(allItems),
    totalLaborCost: approved.reduce((s, r) => s + Number(r.total_earnings), 0),
    days,
  };
}
