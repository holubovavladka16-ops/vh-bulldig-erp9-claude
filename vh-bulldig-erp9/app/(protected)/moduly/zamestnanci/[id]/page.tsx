import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import WorkerCard from "@/components/employees/WorkerCard";
import { NO_PERMISSION_MESSAGE } from "@/lib/authErrors";
import { loadAppContext } from "@/lib/appContext";
import { createClient } from "@/lib/supabase/server";
import type { Employee, EmployeeHistoryEntry, EmploymentType, DocumentV2 } from "@/types/database.types";

export const metadata = {
  title: "Karta dělníka | VH Bulldig ERP 9",
};

const MODULE_KEY = "zamestnanci";

interface Props {
  params: { id: string };
  searchParams: { zaregistrovano?: string };
}

export default async function WorkerCardPage({ params, searchParams }: Props) {
  const ctx = await loadAppContext();
  if (!ctx) redirect("/prihlaseni");

  const { profile, company, grantedKeys, isMajitel, isAdministrator, isUcetni, visibleModules } = ctx!;

  const shellProps = {
    modules: visibleModules,
    companyName: company?.name ?? "",
    logoUrl: company?.logo_url,
    fullName: profile.full_name || profile.email,
    role: profile.role,
  };

  const supabase = createClient();

  // RLS ("employees_select_scoped") už sama zajistí, že Zaměstnanec
  // dostane pouze svůj vlastní záznam a nikdo neoprávněný nedostane nic.
  const { data: employeeData } = await supabase
    .from("employees")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  const employee = employeeData as unknown as Employee | null;

  if (!employee) {
    return (
      <AppShell {...shellProps}>
        <p className="mx-auto max-w-md rounded-xl bg-red-500/10 px-4 py-3 text-center text-red-300">
          {NO_PERMISSION_MESSAGE}
        </p>
      </AppShell>
    );
  }

  const [{ data: typeData }, { data: historyData }, { data: documentsData }] = await Promise.all([
    supabase.from("employment_types").select("*").eq("id", employee.employment_type_id).maybeSingle(),
    supabase
      .from("employee_history")
      .select("*")
      .eq("employee_id", employee.id)
      .order("changed_at", { ascending: false }),
    supabase.from("documents").select("*").eq("employee_id", employee.id).order("created_at", { ascending: false }),
  ]);

  const employmentType = typeData as unknown as EmploymentType | null;
  const historyEntries = (historyData ?? []) as unknown as EmployeeHistoryEntry[];
  const documents = (documentsData ?? []) as unknown as DocumentV2[];

  const hasPermission = grantedKeys.has(MODULE_KEY);
  const canEdit = isMajitel || (isAdministrator && hasPermission);
  const isOwnCard = employee.profile_id === profile.id;

  const hasPricingPermission = grantedKeys.has("individualni-cenik");
  const canEditPricing = isMajitel || (isAdministrator && hasPricingPermission);
  const canViewPricing = canEditPricing || isOwnCard || (isUcetni && hasPricingPermission);

  return (
    <AppShell {...shellProps}>
      <WorkerCard
        employee={employee}
        employmentTypeName={employmentType?.name ?? "—"}
        historyEntries={historyEntries}
        documents={documents}
        canEdit={canEdit}
        canEditPricing={canEditPricing}
        canViewPricing={canViewPricing}
        justRegistered={searchParams.zaregistrovano === "1"}
      />
    </AppShell>
  );
}
