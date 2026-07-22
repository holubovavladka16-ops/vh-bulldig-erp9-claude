import { redirect } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import ReportFilters from "@/components/reports/ReportFilters";
import EmployeeReportView from "@/components/reports/EmployeeReportView";
import OrderReportView from "@/components/reports/OrderReportView";
import ExportPdfButton from "@/components/reports/ExportPdfButton";
import EmployeeReportPdf from "@/components/reports/pdf/EmployeeReportPdf";
import OrderReportPdf from "@/components/reports/pdf/OrderReportPdf";
import { buildEmployeeReport, buildOrderReport } from "@/lib/reports";
import { NO_PERMISSION_MESSAGE } from "@/lib/authErrors";
import { loadAppContext } from "@/lib/appContext";
import { createClient } from "@/lib/supabase/server";
import type { AttendanceRecord, AttendanceWorkItem, Employee, Order } from "@/types/database.types";

export const metadata = {
  title: "Výkazy | VH Bulldig ERP 9",
};

const MODULE_KEY = "vykazy";

interface Props {
  searchParams: { typ?: string; zamestnanec?: string; zakazka?: string; od?: string; do?: string };
}

export default async function ReportsPage({ searchParams }: Props) {
  const ctx = await loadAppContext();
  if (!ctx) redirect("/prihlaseni");

  const { profile, company, grantedKeys, isMajitel, isAdministrator, isUcetni, isZamestnanec, visibleModules } = ctx!;

  const hasPermission = grantedKeys.has(MODULE_KEY);
  const canManage = isMajitel || (isAdministrator && hasPermission);
  const canView = canManage || (isUcetni && hasPermission) || isZamestnanec;

  const shellProps = {
    modules: visibleModules,
    companyName: company?.name ?? "",
    logoUrl: company?.logo_url,
    fullName: profile.full_name || profile.email,
    role: profile.role,
  };

  if (!canView || !company) {
    return (
      <AppShell {...shellProps}>
        <p className="mx-auto max-w-md rounded-xl bg-red-500/10 px-4 py-3 text-center text-red-300">
          {NO_PERMISSION_MESSAGE}
        </p>
      </AppShell>
    );
  }

  const supabase = createClient();

  const [{ data: employeesData }, { data: ordersData }] = await Promise.all([
    supabase.from("employees").select("*").eq("company_id", company.id),
    supabase.from("orders").select("*").eq("company_id", company.id),
  ]);

  const employees = (employeesData ?? []) as unknown as Employee[];
  const orders = (ordersData ?? []) as unknown as Order[];
  const ownEmployee = employees.find((e) => e.profile_id === profile.id);

  const type = isZamestnanec ? "zamestnanec" : searchParams.typ === "zakazka" ? "zakazka" : "zamestnanec";
  const employeeId = isZamestnanec ? ownEmployee?.id ?? "" : searchParams.zamestnanec ?? "";
  const orderId = searchParams.zakazka ?? "";
  const dateFrom = searchParams.od ?? "";
  const dateTo = searchParams.do ?? "";

  let content: React.ReactNode = (
    <p className="rounded-2xl border border-dashed border-glass-border p-10 text-center text-sm text-white/40">
      Vyberte {type === "zamestnanec" ? "zaměstnance" : "zakázku"} a klikněte na „Zobrazit výkaz“.
    </p>
  );
  let pdfExport: React.ReactNode = null;

  if (type === "zamestnanec" && employeeId) {
    const employee = employees.find((e) => e.id === employeeId);
    if (employee) {
      let query = supabase.from("attendance_records").select("*").eq("employee_id", employeeId);
      if (dateFrom) query = query.gte("record_date", dateFrom);
      if (dateTo) query = query.lte("record_date", dateTo);
      const { data: recordsData } = await query;
      const records = (recordsData ?? []) as unknown as AttendanceRecord[];

      const { data: itemsData } = await supabase
        .from("attendance_work_items")
        .select("*")
        .in("attendance_record_id", records.map((r) => r.id).length ? records.map((r) => r.id) : ["-"]);
      const items = (itemsData ?? []) as unknown as AttendanceWorkItem[];
      const itemsByRecordId = items.reduce((acc: Record<string, AttendanceWorkItem[]>, item) => {
        (acc[item.attendance_record_id] ??= []).push(item);
        return acc;
      }, {});

      const orderNameById = Object.fromEntries(orders.map((o) => [o.id, o.name]));
      const report = buildEmployeeReport(employee, records, itemsByRecordId, orderNameById, dateFrom, dateTo);

      content = <EmployeeReportView report={report} />;
      pdfExport = (
        <ExportPdfButton
          document={<EmployeeReportPdf report={report} company={company} />}
          fileName={`vykaz-zamestnance-${employee.last_name}.pdf`}
        />
      );
    }
  } else if (type === "zakazka" && orderId) {
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      let query = supabase.from("attendance_records").select("*").eq("order_id", orderId);
      if (dateFrom) query = query.gte("record_date", dateFrom);
      if (dateTo) query = query.lte("record_date", dateTo);
      const { data: recordsData } = await query;
      const records = (recordsData ?? []) as unknown as AttendanceRecord[];

      const { data: itemsData } = await supabase
        .from("attendance_work_items")
        .select("*")
        .in("attendance_record_id", records.map((r) => r.id).length ? records.map((r) => r.id) : ["-"]);
      const items = (itemsData ?? []) as unknown as AttendanceWorkItem[];
      const itemsByRecordId = items.reduce((acc: Record<string, AttendanceWorkItem[]>, item) => {
        (acc[item.attendance_record_id] ??= []).push(item);
        return acc;
      }, {});

      const employeeById = Object.fromEntries(employees.map((e) => [e.id, e]));
      const report = buildOrderReport(order, records, itemsByRecordId, employeeById, dateFrom, dateTo);

      content = <OrderReportView report={report} />;
      pdfExport = (
        <ExportPdfButton
          document={<OrderReportPdf report={report} company={company} />}
          fileName={`vykaz-zakazky-${order.name}.pdf`}
        />
      );
    }
  }

  return (
    <AppShell {...shellProps}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-xl font-semibold text-white">Výkazy</h1>
          <div className="flex items-center gap-2">
            {pdfExport}
            {canManage && (
              <Link
                href="/moduly/vykazy/kontrola"
                className="rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/5"
              >
                Výkazy ke kontrole
              </Link>
            )}
          </div>
        </div>

        <ReportFilters
          employees={employees}
          orders={orders}
          lockedEmployeeId={isZamestnanec ? ownEmployee?.id : undefined}
        />

        {content}
      </div>
    </AppShell>
  );
}
