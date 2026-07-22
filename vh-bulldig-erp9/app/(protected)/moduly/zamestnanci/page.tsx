import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import EmployeesListClient from "@/components/employees/EmployeesListClient";
import { NO_PERMISSION_MESSAGE } from "@/lib/authErrors";
import { loadAppContext } from "@/lib/appContext";
import { createClient } from "@/lib/supabase/server";
import type { Employee, EmploymentType } from "@/types/database.types";

export const metadata = {
  title: "Zaměstnanci | VH Bulldig ERP 9",
};

const MODULE_KEY = "zamestnanci";

export default async function EmployeesListPage() {
  const ctx = await loadAppContext();
  if (!ctx) redirect("/prihlaseni");

  const { profile, company, grantedKeys, isMajitel, isAdministrator, isUcetni, isZamestnanec, visibleModules } = ctx!;

  const hasPermission = grantedKeys.has(MODULE_KEY);
  const canEdit = isMajitel || (isAdministrator && hasPermission);
  const canView = canEdit || (isUcetni && hasPermission);

  const shellProps = {
    modules: visibleModules,
    companyName: company?.name ?? "",
    logoUrl: company?.logo_url,
    fullName: profile.full_name || profile.email,
    role: profile.role,
  };

  if (isZamestnanec || !canView || !company) {
    return (
      <AppShell {...shellProps}>
        <p className="mx-auto max-w-md rounded-xl bg-red-500/10 px-4 py-3 text-center text-red-300">
          {NO_PERMISSION_MESSAGE}
        </p>
      </AppShell>
    );
  }

  const supabase = createClient();

  const { data: employeesData } = await supabase
    .from("employees")
    .select("*")
    .eq("company_id", company.id)
    .order("last_name", { ascending: true });

  const { data: typesData } = await supabase
    .from("employment_types")
    .select("*")
    .eq("company_id", company.id)
    .order("name", { ascending: true });

  const employees = (employeesData ?? []) as unknown as Employee[];
  const employmentTypes = (typesData ?? []) as unknown as EmploymentType[];

  return (
    <AppShell {...shellProps}>
      <EmployeesListClient
        employees={employees}
        employmentTypes={employmentTypes}
        companyId={company.id}
        canEdit={canEdit}
      />
    </AppShell>
  );
}
