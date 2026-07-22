import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import PaperFormDetail from "@/components/paper-forms/PaperFormDetail";
import { NO_PERMISSION_MESSAGE } from "@/lib/authErrors";
import { loadAppContext } from "@/lib/appContext";
import { createClient } from "@/lib/supabase/server";
import type { Employee, EmploymentType, PaperForm, PaperFormHistoryEntry } from "@/types/database.types";

export const metadata = {
  title: "Detail formuláře | VH Bulldig ERP 9",
};

const MODULE_KEY = "papirovy-formular";

export default async function PaperFormDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { prirazeno?: string };
}) {
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

  const { data: formData } = await supabase.from("paper_forms").select("*").eq("id", params.id).maybeSingle();
  const form = formData as unknown as PaperForm | null;

  if (!form) {
    return (
      <AppShell {...shellProps}>
        <p className="mx-auto max-w-md rounded-xl bg-red-500/10 px-4 py-3 text-center text-red-300">
          {NO_PERMISSION_MESSAGE}
        </p>
      </AppShell>
    );
  }

  const [{ data: employeeData }, { data: historyData }] = await Promise.all([
    form.employee_id
      ? supabase.from("employees").select("*").eq("id", form.employee_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("paper_form_history").select("*").eq("form_id", form.id).order("changed_at", { ascending: false }),
  ]);

  const employee = employeeData as unknown as Employee | null;
  const history = (historyData ?? []) as unknown as PaperFormHistoryEntry[];

  let employmentTypeName = "—";
  if (employee) {
    const { data: typeData } = await supabase
      .from("employment_types")
      .select("*")
      .eq("id", employee.employment_type_id)
      .maybeSingle();
    employmentTypeName = (typeData as unknown as EmploymentType | null)?.name ?? "—";
  }

  const hasPermission = grantedKeys.has(MODULE_KEY);
  const canInvalidate = isMajitel || (isAdministrator && hasPermission);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  return (
    <AppShell {...shellProps}>
      <PaperFormDetail
        form={form}
        employee={employee}
        employmentTypeName={employmentTypeName}
        company={company}
        siteUrl={siteUrl}
        history={history}
        canInvalidate={canInvalidate}
        changedByProfileId={profile.id}
        changedByName={profile.full_name || profile.email}
        justAssigned={searchParams.prirazeno === "1"}
      />
    </AppShell>
  );
}
