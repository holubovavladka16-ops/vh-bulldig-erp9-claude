import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import PaperFormsListClient from "@/components/paper-forms/PaperFormsListClient";
import { NO_PERMISSION_MESSAGE } from "@/lib/authErrors";
import { loadAppContext } from "@/lib/appContext";
import { createClient } from "@/lib/supabase/server";
import type { Employee, EmploymentType, PaperForm } from "@/types/database.types";

export const metadata = {
  title: "Papírový formulář | VH Bulldig ERP 9",
};

const MODULE_KEY = "papirovy-formular";

export default async function PaperFormsListPage() {
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

  // RLS zajistí, že Zaměstnanec dostane jen svůj vlastní formulář.
  const [{ data: formsData }, { data: employeesData }, { data: typesData }] = await Promise.all([
    supabase.from("paper_forms").select("*").eq("company_id", company.id).order("created_at", { ascending: false }),
    supabase.from("employees").select("*").eq("company_id", company.id),
    supabase.from("employment_types").select("*").eq("company_id", company.id),
  ]);

  const forms = (formsData ?? []) as unknown as PaperForm[];
  const employees = (employeesData ?? []) as unknown as Employee[];
  const employmentTypes = (typesData ?? []) as unknown as EmploymentType[];
  const employeesById = Object.fromEntries(employees.map((e) => [e.id, e]));

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  return (
    <AppShell {...shellProps}>
      <PaperFormsListClient
        forms={forms}
        employeesById={employeesById}
        employmentTypes={employmentTypes}
        company={company}
        siteUrl={siteUrl}
        companyId={company.id}
        canCreate={canManage}
        changedByProfileId={profile.id}
        changedByName={profile.full_name || profile.email}
      />
    </AppShell>
  );
}
