import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import AttendanceForm from "@/components/attendance/AttendanceForm";
import { NO_PERMISSION_MESSAGE } from "@/lib/authErrors";
import { loadAppContext } from "@/lib/appContext";
import { createClient } from "@/lib/supabase/server";
import type { Employee, Order } from "@/types/database.types";

export const metadata = {
  title: "Nový záznam docházky | VH Bulldig ERP 9",
};

const MODULE_KEY = "dochazka";

export default async function NewAttendancePage() {
  const ctx = await loadAppContext();
  if (!ctx) redirect("/prihlaseni");

  const { profile, company, grantedKeys, isMajitel, isAdministrator, isZamestnanec, visibleModules } = ctx!;

  const hasPermission = grantedKeys.has(MODULE_KEY);
  const canManage = isMajitel || (isAdministrator && hasPermission);

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
  const [{ data: employeesData }, { data: ordersData }] = await Promise.all([
    supabase.from("employees").select("*").eq("company_id", company.id),
    supabase.from("orders").select("*").eq("company_id", company.id).eq("status", "aktivni"),
  ]);

  const employees = (employeesData ?? []) as unknown as Employee[];
  const orders = (ordersData ?? []) as unknown as Order[];
  const ownEmployee = employees.find((e) => e.profile_id === profile.id);

  const canCreate = canManage || (isZamestnanec && Boolean(ownEmployee));

  if (!canCreate) {
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
      <h1 className="mb-6 font-display text-xl font-semibold text-white">Nový záznam docházky</h1>
      <AttendanceForm
        companyId={company.id}
        employees={employees}
        orders={orders}
        lockedEmployeeId={isZamestnanec ? ownEmployee?.id : undefined}
        changedByProfileId={profile.id}
        changedByName={profile.full_name || profile.email}
        isEmployeeSelf={isZamestnanec}
      />
    </AppShell>
  );
}
