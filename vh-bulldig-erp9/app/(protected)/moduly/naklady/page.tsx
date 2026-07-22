import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import CostsListClient from "@/components/costs/CostsListClient";
import { COST_CATEGORIES } from "@/lib/costs";
import { NO_PERMISSION_MESSAGE } from "@/lib/authErrors";
import { loadAppContext } from "@/lib/appContext";
import { createClient } from "@/lib/supabase/server";
import type { AttendanceRecord, Cost, CostCategory, Order } from "@/types/database.types";

export const metadata = {
  title: "Náklady | VH Bulldig ERP 9",
};

const MODULE_KEY = "naklady";

interface Props {
  searchParams: { zakazka?: string; kategorie?: string; od?: string; do?: string };
}

export default async function CostsListPage({ searchParams }: Props) {
  const ctx = await loadAppContext();
  if (!ctx) redirect("/prihlaseni");

  const { profile, company, grantedKeys, isMajitel, isAdministrator, isUcetni, visibleModules } = ctx!;

  const hasPermission = grantedKeys.has(MODULE_KEY);
  const canEdit = isMajitel || ((isAdministrator || isUcetni) && hasPermission);

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

  const { data: ordersData } = await supabase.from("orders").select("*").eq("company_id", company.id);
  const orders = (ordersData ?? []) as unknown as Order[];
  const activeOrders = orders.filter((o) => o.status === "aktivni");
  const orderNameById = Object.fromEntries(orders.map((o) => [o.id, o.name]));

  const orderId = searchParams.zakazka ?? "";
  const category = searchParams.kategorie ?? "";
  const dateFrom = searchParams.od ?? "";
  const dateTo = searchParams.do ?? "";

  let costsQuery = supabase.from("costs").select("*").eq("company_id", company.id);
  if (orderId) costsQuery = costsQuery.eq("order_id", orderId);
  if (category) costsQuery = costsQuery.eq("category", category);
  if (dateFrom) costsQuery = costsQuery.gte("cost_date", dateFrom);
  if (dateTo) costsQuery = costsQuery.lte("cost_date", dateTo);
  const { data: costsData } = await costsQuery.order("cost_date", { ascending: false });
  const costs = (costsData ?? []) as unknown as Cost[];

  const categoryTotals = Object.fromEntries(COST_CATEGORIES.map((c) => [c.key, 0])) as Record<CostCategory, number>;
  for (const c of costs) {
    categoryTotals[c.category] += Number(c.amount);
  }

  // Mzdové náklady - počítáno za běhu ze schválených záznamů Docházky,
  // NIKDY ručně zadané jako běžný náklad (bod 11 zadání).
  let attendanceQuery = supabase.from("attendance_records").select("*").eq("company_id", company.id).eq("status", "schvaleny");
  if (orderId) attendanceQuery = attendanceQuery.eq("order_id", orderId);
  if (dateFrom) attendanceQuery = attendanceQuery.gte("record_date", dateFrom);
  if (dateTo) attendanceQuery = attendanceQuery.lte("record_date", dateTo);
  const { data: attendanceData } = await attendanceQuery;
  const laborCost = ((attendanceData ?? []) as unknown as AttendanceRecord[]).reduce(
    (sum, r) => sum + Number(r.total_earnings),
    0
  );

  return (
    <AppShell {...shellProps}>
      <CostsListClient
        costs={costs}
        orders={activeOrders}
        orderNameById={orderNameById}
        categoryTotals={categoryTotals}
        laborCost={laborCost}
        canEdit={canEdit}
      />
    </AppShell>
  );
}
