import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import NewContractForm from "@/components/documents/NewContractForm";
import { NO_PERMISSION_MESSAGE } from "@/lib/authErrors";
import { loadAppContext } from "@/lib/appContext";
import { createClient } from "@/lib/supabase/server";
import type { Employee, EmploymentType, Order } from "@/types/database.types";

export const metadata = {
  title: "Nový dokument | VH Bulldig ERP 9",
};

const MODULE_KEY = "smlouvy-a-dokumenty";

export default async function NewContractPage() {
  const ctx = await loadAppContext();
  if (!ctx) redirect("/prihlaseni");

  const { profile, company, grantedKeys, isMajitel, isAdministrator, isUcetni, visibleModules } = ctx!;
  const canCreate = isMajitel || ((isAdministrator || isUcetni) && grantedKeys.has(MODULE_KEY));

  const shellProps = {
    modules: visibleModules,
    companyName: company?.name ?? "",
    logoUrl: company?.logo_url,
    fullName: profile.full_name || profile.email,
    role: profile.role,
  };

  if (!canCreate || !company) {
    return (
      <AppShell {...shellProps}>
        <p className="mx-auto max-w-md rounded-xl bg-red-500/10 px-4 py-3 text-center text-red-300">
          {NO_PERMISSION_MESSAGE}
        </p>
      </AppShell>
    );
  }

  const supabase = createClient();
  const [{ data: employeesData }, { data: typesData }, { data: ordersData }, { count }] = await Promise.all([
    supabase.from("employees").select("*").eq("company_id", company.id).eq("status", "aktivni"),
    supabase.from("employment_types").select("*").eq("company_id", company.id),
    supabase.from("orders").select("*").eq("company_id", company.id).eq("status", "aktivni"),
    supabase.from("documents").select("id", { count: "exact", head: true }).eq("company_id", company.id),
  ]);

  const employees = (employeesData ?? []) as unknown as Employee[];
  const employmentTypes = (typesData ?? []) as unknown as EmploymentType[];
  const orders = (ordersData ?? []) as unknown as Order[];

  return (
    <AppShell {...shellProps}>
      <h1 className="mb-6 font-display text-xl font-semibold text-white">Nový dokument</h1>
      <NewContractForm
        companyId={company.id}
        company={company}
        employees={employees}
        employmentTypes={employmentTypes}
        orders={orders}
        existingDocumentCount={count ?? 0}
        changedByProfileId={profile.id}
        changedByName={profile.full_name || profile.email}
      />
    </AppShell>
  );
}
