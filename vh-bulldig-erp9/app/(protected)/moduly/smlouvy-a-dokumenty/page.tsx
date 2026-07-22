import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import ContractsListClient from "@/components/documents/ContractsListClient";
import { NO_PERMISSION_MESSAGE } from "@/lib/authErrors";
import { loadAppContext } from "@/lib/appContext";
import { createClient } from "@/lib/supabase/server";
import type { DocumentV2, Employee, Order } from "@/types/database.types";

export const metadata = {
  title: "Smlouvy, objednávky a pracovněprávní dokumenty | VH Bulldig ERP 9",
};

const MODULE_KEY = "smlouvy-a-dokumenty";

export default async function ContractsListPage() {
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

  const { data: docsData } = await supabase
    .from("documents")
    .select("*")
    .eq("company_id", company.id)
    .order("created_at", { ascending: false });
  const documents = (docsData ?? []) as unknown as DocumentV2[];

  const [{ data: employeesData }, { data: ordersData }] = await Promise.all([
    supabase.from("employees").select("*").eq("company_id", company.id),
    supabase.from("orders").select("*").eq("company_id", company.id),
  ]);

  const employees = (employeesData ?? []) as unknown as Employee[];
  const orders = (ordersData ?? []) as unknown as Order[];
  const employeesById = Object.fromEntries(employees.map((e) => [e.id, e]));
  const ordersById = Object.fromEntries(orders.map((o) => [o.id, o]));

  return (
    <AppShell {...shellProps}>
      <ContractsListClient documents={documents} employeesById={employeesById} ordersById={ordersById} company={company} canCreate={canCreate} />
    </AppShell>
  );
}
