import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import ReviewQueueList from "@/components/reports/ReviewQueueList";
import { NO_PERMISSION_MESSAGE } from "@/lib/authErrors";
import { loadAppContext } from "@/lib/appContext";
import { createClient } from "@/lib/supabase/server";
import type { AttendanceRecord, Employee, Order } from "@/types/database.types";

export const metadata = {
  title: "Výkazy ke kontrole | VH Bulldig ERP 9",
};

const MODULE_KEY = "vykazy";

export default async function ReviewQueuePage() {
  const ctx = await loadAppContext();
  if (!ctx) redirect("/prihlaseni");

  const { profile, company, grantedKeys, isMajitel, isAdministrator, visibleModules } = ctx!;
  const canManage = isMajitel || (isAdministrator && grantedKeys.has(MODULE_KEY));

  const shellProps = {
    modules: visibleModules,
    companyName: company?.name ?? "",
    logoUrl: company?.logo_url,
    fullName: profile.full_name || profile.email,
    role: profile.role,
  };

  if (!canManage || !company) {
    return (
      <AppShell {...shellProps}>
        <p className="mx-auto max-w-md rounded-xl bg-red-500/10 px-4 py-3 text-center text-red-300">
          {NO_PERMISSION_MESSAGE}
        </p>
      </AppShell>
    );
  }

  const supabase = createClient();

  const [{ data: recordsData }, { data: employeesData }, { data: ordersData }] = await Promise.all([
    supabase
      .from("attendance_records")
      .select("*")
      .in("status", ["odeslany", "vraceny_k_oprave"])
      .order("record_date", { ascending: false }),
    supabase.from("employees").select("*").eq("company_id", company.id),
    supabase.from("orders").select("*").eq("company_id", company.id),
  ]);

  const records = (recordsData ?? []) as unknown as AttendanceRecord[];
  const employees = (employeesData ?? []) as unknown as Employee[];
  const orders = (ordersData ?? []) as unknown as Order[];

  const employeeNameById = Object.fromEntries(employees.map((e) => [e.id, `${e.first_name} ${e.last_name}`]));
  const orderNameById = Object.fromEntries(orders.map((o) => [o.id, o.name]));

  return (
    <AppShell {...shellProps}>
      <div className="flex flex-col gap-6">
        <h1 className="font-display text-xl font-semibold text-white">Výkazy ke kontrole</h1>
        <ReviewQueueList records={records} employeeNameById={employeeNameById} orderNameById={orderNameById} />
      </div>
    </AppShell>
  );
}
