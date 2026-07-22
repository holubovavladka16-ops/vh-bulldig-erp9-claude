import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import CheckListClient from "@/components/paper-form-checks/CheckListClient";
import { NO_PERMISSION_MESSAGE } from "@/lib/authErrors";
import { loadAppContext } from "@/lib/appContext";
import { createClient } from "@/lib/supabase/server";
import type { Employee, PaperForm, PaperFormCheck } from "@/types/database.types";

export const metadata = {
  title: "Kontrola papírového formuláře | VH Bulldig ERP 9",
};

const MODULE_KEY = "kontrola-papiroveho-formulare";

export default async function ChecksListPage() {
  const ctx = await loadAppContext();
  if (!ctx) redirect("/prihlaseni");

  const { profile, company, grantedKeys, isMajitel, isAdministrator, isUcetni, isZamestnanec, visibleModules } = ctx!;

  const hasPermission = grantedKeys.has(MODULE_KEY);
  const canCreate = isMajitel || ((isAdministrator || isUcetni) && hasPermission);
  const canView = canCreate || isZamestnanec;

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

  const { data: checksData } = await supabase
    .from("paper_form_checks")
    .select("*")
    .eq("company_id", company.id)
    .order("created_at", { ascending: false });
  const checks = (checksData ?? []) as unknown as PaperFormCheck[];

  const formIds = Array.from(new Set(checks.map((c) => c.form_id)));
  const employeeIds = Array.from(new Set(checks.map((c) => c.employee_id)));

  const [{ data: formsData }, { data: employeesData }] = await Promise.all([
    formIds.length ? supabase.from("paper_forms").select("*").in("id", formIds) : Promise.resolve({ data: [] }),
    employeeIds.length ? supabase.from("employees").select("*").in("id", employeeIds) : Promise.resolve({ data: [] }),
  ]);

  const forms = (formsData ?? []) as unknown as PaperForm[];
  const employees = (employeesData ?? []) as unknown as Employee[];
  const formsById = Object.fromEntries(forms.map((f) => [f.id, f]));
  const employeesById = Object.fromEntries(employees.map((e) => [e.id, e]));

  return (
    <AppShell {...shellProps}>
      <CheckListClient checks={checks} formsById={formsById} employeesById={employeesById} canCreate={canCreate} />
    </AppShell>
  );
}
