import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import EmployeeForm from "@/components/employees/EmployeeForm";
import { NO_PERMISSION_MESSAGE } from "@/lib/authErrors";
import { loadAppContext } from "@/lib/appContext";
import { createClient } from "@/lib/supabase/server";
import type { EmploymentType } from "@/types/database.types";

export const metadata = {
  title: "Nový zaměstnanec | VH Bulldig ERP 9",
};

const MODULE_KEY = "zamestnanci";

export default async function NewEmployeePage() {
  const ctx = await loadAppContext();
  if (!ctx) redirect("/prihlaseni");

  const { profile, company, grantedKeys, isMajitel, isAdministrator, visibleModules } = ctx!;
  const canEdit = isMajitel || (isAdministrator && grantedKeys.has(MODULE_KEY));

  const shellProps = {
    modules: visibleModules,
    companyName: company?.name ?? "",
    logoUrl: company?.logo_url,
    fullName: profile.full_name || profile.email,
    role: profile.role,
  };

  if (!canEdit || !company) {
    return (
      <AppShell {...shellProps}>
        <p className="mx-auto max-w-md rounded-xl bg-red-500/10 px-4 py-3 text-center text-red-300">
          {NO_PERMISSION_MESSAGE}
        </p>
      </AppShell>
    );
  }

  const supabase = createClient();
  const { data: typesData } = await supabase
    .from("employment_types")
    .select("*")
    .eq("company_id", company.id)
    .order("name", { ascending: true });

  const employmentTypes = (typesData ?? []) as unknown as EmploymentType[];

  return (
    <AppShell {...shellProps}>
      <h1 className="mb-6 font-display text-xl font-semibold text-white">
        Nový zaměstnanec
      </h1>
      <EmployeeForm
        companyId={company.id}
        employmentTypes={employmentTypes}
        changedByProfileId={profile.id}
        changedByName={profile.full_name || profile.email}
      />
    </AppShell>
  );
}
