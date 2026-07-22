import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import AttendanceListClient from "@/components/attendance/AttendanceListClient";
import { NO_PERMISSION_MESSAGE } from "@/lib/authErrors";
import { loadAppContext } from "@/lib/appContext";
import { createClient } from "@/lib/supabase/server";
import type { AttendanceRecord, Employee, Order } from "@/types/database.types";

export const metadata = {
  title: "Docházka | VH Bulldig ERP 9",
};

const MODULE_KEY = "dochazka";

export default async function AttendanceListPage() {
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

  // RLS už omezí, která data se skutečně vrátí (Zaměstnanec dostane
  // jen své vlastní záznamy).
  const [{ data: recordsData }, { data: employeesData }, { data: ordersData }] = await Promise.all([
    supabase.from("attendance_records").select("*").order("record_date", { ascending: false }),
    supabase.from("employees").select("*").eq("company_id", company.id),
    supabase.from("orders").select("*").eq("company_id", company.id),
  ]);

  const records = (recordsData ?? []) as unknown as AttendanceRecord[];
  const employees = (employeesData ?? []) as unknown as Employee[];
  const orders = (ordersData ?? []) as unknown as Order[];

  let workItemCounts: Record<string, number> = {};
  if (records.length > 0) {
    const { data: itemsData } = await supabase
      .from("attendance_work_items")
      .select("attendance_record_id")
      .in("attendance_record_id", records.map((r) => r.id));

    workItemCounts = (itemsData ?? []).reduce((acc: Record<string, number>, row: { attendance_record_id: string }) => {
      acc[row.attendance_record_id] = (acc[row.attendance_record_id] ?? 0) + 1;
      return acc;
    }, {});
  }

  const ownEmployee = employees.find((e) => e.profile_id === profile.id);
  const lockToOwnEmployeeId = isZamestnanec ? ownEmployee?.id : undefined;

  return (
    <AppShell {...shellProps}>
      <AttendanceListClient
        records={records}
        employees={employees}
        orders={orders}
        workItemCounts={workItemCounts}
        canCreate={canManage || (isZamestnanec && Boolean(ownEmployee))}
        lockToOwnEmployeeId={lockToOwnEmployeeId}
      />
    </AppShell>
  );
}
