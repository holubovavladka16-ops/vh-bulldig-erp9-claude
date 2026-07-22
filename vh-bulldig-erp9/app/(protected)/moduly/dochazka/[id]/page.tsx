import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import AttendanceDetail from "@/components/attendance/AttendanceDetail";
import { NO_PERMISSION_MESSAGE } from "@/lib/authErrors";
import { loadAppContext } from "@/lib/appContext";
import { createClient } from "@/lib/supabase/server";
import type { AttendanceHistoryEntry, AttendanceRecord, AttendanceWorkItem, Employee, Order } from "@/types/database.types";

export const metadata = {
  title: "Detail docházky | VH Bulldig ERP 9",
};

const MODULE_KEY = "dochazka";

interface Props {
  params: { id: string };
  searchParams: { ulozeno?: string };
}

export default async function AttendanceDetailPage({ params, searchParams }: Props) {
  const ctx = await loadAppContext();
  if (!ctx) redirect("/prihlaseni");

  const { profile, company, grantedKeys, isMajitel, isAdministrator, visibleModules } = ctx!;

  const shellProps = {
    modules: visibleModules,
    companyName: company?.name ?? "",
    logoUrl: company?.logo_url,
    fullName: profile.full_name || profile.email,
    role: profile.role,
  };

  const supabase = createClient();

  const { data: recordData } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

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

  const [{ data: itemsData }, { data: historyData }, { data: employeeData }, { data: orderData }] = await Promise.all([
    supabase.from("attendance_work_items").select("*").eq("attendance_record_id", record.id).order("created_at"),
    supabase.from("attendance_history").select("*").eq("attendance_record_id", record.id).order("changed_at", { ascending: false }),
    supabase.from("employees").select("*").eq("id", record.employee_id).maybeSingle(),
    supabase.from("orders").select("*").eq("id", record.order_id).maybeSingle(),
  ]);

  const workItems = (itemsData ?? []) as unknown as AttendanceWorkItem[];
  const history = (historyData ?? []) as unknown as AttendanceHistoryEntry[];
  const employee = employeeData as unknown as Employee | null;
  const order = orderData as unknown as Order | null;

  const hasPermission = grantedKeys.has(MODULE_KEY);
  const canManage = isMajitel || (isAdministrator && hasPermission);
  const isOwnRecord = employee?.profile_id === profile.id;
  const canEdit = canManage || (isOwnRecord && ["rozepsany", "vraceny_k_oprave"].includes(record.status));
  const canApprove = canManage;

  return (
    <AppShell {...shellProps}>
      <AttendanceDetail
        record={record}
        workItems={workItems}
        history={history}
        employeeName={employee ? `${employee.first_name} ${employee.last_name}` : "—"}
        orderName={order?.name ?? "—"}
        canEdit={canEdit}
        canApprove={canApprove}
        changedByProfileId={profile.id}
        changedByName={profile.full_name || profile.email}
        justSaved={searchParams.ulozeno === "1"}
      />
    </AppShell>
  );
}
