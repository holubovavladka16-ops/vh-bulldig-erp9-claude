import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import LogListClient from "@/components/construction-log/LogListClient";
import { NO_PERMISSION_MESSAGE } from "@/lib/authErrors";
import { loadAppContext } from "@/lib/appContext";
import { createClient } from "@/lib/supabase/server";
import type { ConstructionLogEntry, Employee, Order } from "@/types/database.types";

export const metadata = {
  title: "Stavební deník | VH Bulldig ERP 9",
};

const MODULE_KEY = "stavebni-denik";

interface Props {
  searchParams: { zakazka?: string; od?: string; do?: string };
}

export default async function ConstructionLogListPage({ searchParams }: Props) {
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

  const [{ data: ordersData }, { data: employeesData }] = await Promise.all([
    supabase.from("orders").select("*").eq("company_id", company.id),
    supabase.from("employees").select("*").eq("company_id", company.id),
  ]);
  const orders = (ordersData ?? []) as unknown as Order[];
  const employees = (employeesData ?? []) as unknown as Employee[];
  const orderNameById = Object.fromEntries(orders.map((o) => [o.id, o.name]));

  const orderId = searchParams.zakazka ?? "";
  const dateFrom = searchParams.od ?? "";
  const dateTo = searchParams.do ?? "";

  // RLS omezí, co Zaměstnanec skutečně dostane (jen záznamy, kde je
  // uveden jako dělník).
  let entriesQuery = supabase.from("construction_log_entries").select("*").eq("company_id", company.id);
  if (orderId) entriesQuery = entriesQuery.eq("order_id", orderId);
  if (dateFrom) entriesQuery = entriesQuery.gte("log_date", dateFrom);
  if (dateTo) entriesQuery = entriesQuery.lte("log_date", dateTo);
  const { data: entriesData } = await entriesQuery.order("log_date", { ascending: false });
  const entries = (entriesData ?? []) as unknown as ConstructionLogEntry[];

  return (
    <AppShell {...shellProps}>
      <LogListClient
        entries={entries}
        orders={orders.filter((o) => o.status === "aktivni")}
        orderNameById={orderNameById}
        employees={employees}
        company={company}
        canEdit={canManage}
      />
    </AppShell>
  );
}
