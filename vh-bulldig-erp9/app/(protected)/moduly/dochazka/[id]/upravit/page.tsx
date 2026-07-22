import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import AttendanceForm from "@/components/attendance/AttendanceForm";
import { NO_PERMISSION_MESSAGE } from "@/lib/authErrors";
import { loadAppContext } from "@/lib/appContext";
import { createClient } from "@/lib/supabase/server";
import type { AttendanceRecord, AttendanceWorkItem, Employee, Order } from "@/types/database.types";

export const metadata = {
  title: "Upravit docházku | VH Bulldig ERP 9",
};

const MODULE_KEY = "dochazka";

export default async function EditAttendancePage({ params }: { params: { id: string } }) {
  const ctx = await loadAppContext();
  if (!ctx) redirect("/prihlaseni");

  const { profile, company, grantedKeys, isMajitel, isAdministrator, isZamestnanec, visibleModules } = ctx!;

  const shellProps = {
    modules: visibleModules,
    companyName: company?.name ?? "",
    logoUrl: company?.logo_url,
    fullName: profile.full_name || profile.email,
    role: profile.role,
  };

  if (!company) {
    return (
      <AppShell {...shellProps}>
        <p className="mx-auto max-w-md rounded-xl bg-red-500/10 px-4 py-3 text-center text-red-300">
          {NO_PERMISSION_MESSAGE}
        </p>
      </AppShell>
    );
  }

  const supabase = createClient();

  const { data: recordData } = await supabase.from("attendance_records").select("*").eq("id", params.id).maybeSingle();
  const record = recordData as unknown as AttendanceRecord | null;

  if (!record) {
    return (
      <AppShell {...shellProps}>
        <p className="mx-auto max-w-md rounded-xl bg-red-500/10 px-4 py-3 text-center text-red-300">
          {NO_PERMISSION_MESSAGE}
        </p>
      </AppShell>
    );
  }

  const [{ data: employeesData }, { data: ordersData }, { data: itemsData }, { data: employeeData }] = await Promise.all([
    supabase.from("employees").select("*").eq("company_id", company.id),
    supabase.from("orders").select("*").eq("company_id", company.id).eq("status", "aktivni"),
    supabase.from("attendance_work_items").select("*").eq("attendance_record_id", record.id).order("created_at"),
    supabase.from("employees").select("*").eq("id", record.employee_id).maybeSingle(),
  ]);

  const employees = (employeesData ?? []) as unknown as Employee[];
  const orders = (ordersData ?? []) as unknown as Order[];
  const workItems = (itemsData ?? []) as unknown as AttendanceWorkItem[];
  const recordEmployee = employeeData as unknown as Employee | null;

  const hasPermission = grantedKeys.has(MODULE_KEY);
  const canManage = isMajitel || (isAdministrator && hasPermission);
  const isOwnRecord = recordEmployee?.profile_id === profile.id;
  const canEdit = canManage || (isOwnRecord && ["rozepsany", "vraceny_k_oprave"].includes(record.status));

  if (!canEdit) {
    return (
      <AppShell {...shellProps}>
        <p className="mx-auto max-w-md rounded-xl bg-red-500/10 px-4 py-3 text-center text-red-300">
          {NO_PERMISSION_MESSAGE}
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell {...shellProps}>
      <h1 className="mb-6 font-display text-xl font-semibold text-white">Upravit docházku</h1>
      <AttendanceForm
        companyId={company.id}
        employees={employees}
        orders={orders}
        lockedEmployeeId={isZamestnanec ? recordEmployee?.id : undefined}
        existingRecord={record}
        existingWorkItems={workItems}
        changedByProfileId={profile.id}
        changedByName={profile.full_name || profile.email}
        isEmployeeSelf={isZamestnanec}
      />
    </AppShell>
  );
}
