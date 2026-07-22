import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import DocumentsListClient from "@/components/documents/DocumentsListClient";
import { NO_PERMISSION_MESSAGE } from "@/lib/authErrors";
import { loadAppContext } from "@/lib/appContext";
import { createClient } from "@/lib/supabase/server";
import type { DocumentType, Employee, GeneratedDocument, Order } from "@/types/database.types";

export const metadata = {
  title: "PDF dokumenty a výplatní pásky | VH Bulldig ERP 9",
};

const MODULE_KEY = "pdf-a-vyplatni-pasky";

interface Props {
  searchParams: { typ?: string; zamestnanec?: string; zakazka?: string; od?: string; do?: string };
}

export default async function DocumentsListPage({ searchParams }: Props) {
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

  const [{ data: employeesData }, { data: ordersData }] = await Promise.all([
    supabase.from("employees").select("*").eq("company_id", company.id),
    supabase.from("orders").select("*").eq("company_id", company.id),
  ]);
  const employees = (employeesData ?? []) as unknown as Employee[];
  const orders = (ordersData ?? []) as unknown as Order[];

  const { typ, zamestnanec, zakazka, od, do: doParam } = searchParams;

  // RLS zajistí, že Zaměstnanec uvidí jen dokumenty vztahující se k jeho
  // vlastnímu záznamu zaměstnance.
  let query = supabase.from("generated_documents").select("*").eq("company_id", company.id);
  if (typ) query = query.eq("document_type", typ as DocumentType);
  if (zamestnanec) query = query.eq("employee_id", zamestnanec);
  if (zakazka) query = query.eq("order_id", zakazka);
  if (od) query = query.gte("created_at", od);
  if (doParam) query = query.lte("created_at", doParam);
  const { data: documentsData } = await query.order("created_at", { ascending: false });
  const documents = (documentsData ?? []) as unknown as GeneratedDocument[];

  return (
    <AppShell {...shellProps}>
      <DocumentsListClient documents={documents} employees={employees} orders={orders} canCreate={canCreate} />
    </AppShell>
  );
}
