import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import WorkerCard from "@/components/employees/WorkerCard";
import PaperFormStatusBadge from "@/components/paper-forms/PaperFormStatusBadge";
import ScanRegistrationForm from "@/components/paper-forms/ScanRegistrationForm";
import { NO_PERMISSION_MESSAGE } from "@/lib/authErrors";
import { loadAppContext } from "@/lib/appContext";
import { createClient } from "@/lib/supabase/server";
import type {
  Employee,
  EmployeeHistoryEntry,
  EmploymentType,
  PaperForm,
} from "@/types/database.types";

export const metadata = {
  title: "Naskenovaný formulář | VH Bulldig ERP 9",
};

const ZAMESTNANCI_KEY = "zamestnanci";
const CENIK_KEY = "individualni-cenik";

export default async function ScanPaperFormPage({ params }: { params: { token: string } }) {
  const ctx = await loadAppContext();
  if (!ctx) redirect("/prihlaseni");

  const {
    profile,
    company,
    grantedKeys,
    isMajitel,
    isAdministrator,
    isUcetni,
    visibleModules,
  } = ctx!;

  const shellProps = {
    modules: visibleModules,
    companyName: company?.name ?? "",
    logoUrl: company?.logo_url,
    fullName: profile.full_name || profile.email,
    role: profile.role,
  };

  const supabase = createClient();

  // RLS už zajistí, že formulář dostaneme jen pokud na něj máme nárok
  // (Majitel/Administrátor+Účetní s oprávněním, nebo vlastní přiřazený
  // formulář zaměstnance).
  const { data: formData } = await supabase.from("paper_forms").select("*").eq("share_token", params.token).maybeSingle();
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

  if (form.status === "zneplatneny") {
    return (
      <AppShell {...shellProps}>
        <div className="mx-auto max-w-md text-center">
          <PaperFormStatusBadge status={form.status} />
          <p className="mt-3 text-white/70">Tento formulář byl zneplatněn a nelze jej dále používat.</p>
        </div>
      </AppShell>
    );
  }

  // ---- Formulář zatím NENÍ přiřazen - první naskenování (bod 8) ----
  if (!form.employee_id) {
    const canRegister = isMajitel || (isAdministrator && grantedKeys.has(ZAMESTNANCI_KEY));

    // Zaznamenej naskenování nepřiřazeného formuláře.
    await supabase.from("paper_form_history").insert({
      form_id: form.id,
      change_type: "prvni_naskenovani",
      changed_by: profile.id,
      changed_by_name: profile.full_name || profile.email,
    } as never);

    if (!canRegister) {
      return (
        <AppShell {...shellProps}>
          <p className="mx-auto max-w-md rounded-xl bg-red-500/10 px-4 py-3 text-center text-red-300">
            {NO_PERMISSION_MESSAGE}
          </p>
        </AppShell>
      );
    }

    const { data: typesData } = await supabase
      .from("employment_types")
      .select("*")
      .eq("company_id", company!.id)
      .order("name", { ascending: true });
    const employmentTypes = (typesData ?? []) as unknown as EmploymentType[];

    return (
      <AppShell {...shellProps}>
        <div className="mb-6">
          <h1 className="font-display text-xl font-semibold text-white">Registrace zaměstnance</h1>
          <p className="mt-1 text-sm text-white/50">
            Formulář {form.form_number} zatím není přiřazen. Po uložení registrace bude formulář trvale
            přiřazen tomuto zaměstnanci.
          </p>
        </div>
        <ScanRegistrationForm
          formId={form.id}
          companyId={company!.id}
          employmentTypes={employmentTypes}
          changedByProfileId={profile.id}
          changedByName={profile.full_name || profile.email}
        />
      </AppShell>
    );
  }

  // ---- Formulář JE přiřazen - další naskenování otevře Kartu dělníka (bod 9) ----
  const { data: employeeData } = await supabase.from("employees").select("*").eq("id", form.employee_id).maybeSingle();
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

  const [{ data: typeData }, { data: historyData }] = await Promise.all([
    supabase.from("employment_types").select("*").eq("id", employee.employment_type_id).maybeSingle(),
    supabase.from("employee_history").select("*").eq("employee_id", employee.id).order("changed_at", { ascending: false }),
  ]);

  const employmentType = typeData as unknown as EmploymentType | null;
  const historyEntries = (historyData ?? []) as unknown as EmployeeHistoryEntry[];

  const hasZamestnanciPerm = grantedKeys.has(ZAMESTNANCI_KEY);
  const canEdit = isMajitel || (isAdministrator && hasZamestnanciPerm);
  const isOwnCard = employee.profile_id === profile.id;

  const hasCenikPerm = grantedKeys.has(CENIK_KEY);
  const canEditPricing = isMajitel || (isAdministrator && hasCenikPerm);
  const canViewPricing = canEditPricing || isOwnCard || (isUcetni && hasCenikPerm);

  return (
    <AppShell {...shellProps}>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-white/50">Formulář {form.form_number}</p>
        <PaperFormStatusBadge status={form.status} />
      </div>
      <WorkerCard
        employee={employee}
        employmentTypeName={employmentType?.name ?? "—"}
        historyEntries={historyEntries}
        canEdit={canEdit}
        canEditPricing={canEditPricing}
        canViewPricing={canViewPricing}
      />
    </AppShell>
  );
}
