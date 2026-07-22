import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import InvoicingListClient from "@/components/invoicing/InvoicingListClient";
import { calculateProfit } from "@/lib/profit";
import { NO_PERMISSION_MESSAGE } from "@/lib/authErrors";
import { loadAppContext } from "@/lib/appContext";
import { createClient } from "@/lib/supabase/server";
import type { AttendanceRecord, Cost, InvoicingRecord, Order } from "@/types/database.types";

export const metadata = {
  title: "Fakturace a přehled zisku | VH Bulldig ERP 9",
};

const MODULE_KEY = "fakturace-a-prehled-zisku";

interface Props {
  searchParams: { zakazka?: string; od?: string; do?: string };
}

export default async function InvoicingListPage({ searchParams }: Props) {
  const ctx = await loadAppContext();
  if (!ctx) redirect("/prihlaseni");

  const { profile, company, grantedKeys, isMajitel, isAdministrator, isUcetni, visibleModules } = ctx!;
  const canEdit = isMajitel || ((isAdministrator || isUcetni) && grantedKeys.has(MODULE_KEY));

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
  const orderNameById = Object.fromEntries(orders.map((o) => [o.id, o.name]));

  const orderIdFilter = searchParams.zakazka ?? "";
  const dateFromFilter = searchParams.od ?? "";
  const dateToFilter = searchParams.do ?? "";

  let recordsQuery = supabase.from("invoicing_records").select("*").eq("company_id", company.id);
  if (orderIdFilter) recordsQuery = recordsQuery.eq("order_id", orderIdFilter);
  if (dateFromFilter) recordsQuery = recordsQuery.gte("period_from", dateFromFilter);
  if (dateToFilter) recordsQuery = recordsQuery.lte("period_to", dateToFilter);
  const { data: recordsData } = await recordsQuery.order("period_from", { ascending: false });
  const records = (recordsData ?? []) as unknown as InvoicingRecord[];

  // Načtení všech schválených docházkových záznamů a nákladů firmy,
  // aby šlo pro každý záznam fakturace dopočítat náklady jeho
  // konkrétní zakázky a období (bod 9, 15).
  const [{ data: attendanceData }, { data: costsData }] = await Promise.all([
    supabase.from("attendance_records").select("*").eq("company_id", company.id).eq("status", "schvaleny"),
    supabase.from("costs").select("*").eq("company_id", company.id),
  ]);

  const attendance = (attendanceData ?? []) as unknown as AttendanceRecord[];
  const costs = (costsData ?? []) as unknown as Cost[];

  function costsForRecord(r: InvoicingRecord) {
    const laborCost = attendance
      .filter((a) => a.order_id === r.order_id && a.record_date >= r.period_from && a.record_date <= r.period_to)
      .reduce((s, a) => s + Number(a.total_earnings), 0);
    const otherCosts = costs
      .filter((c) => c.order_id === r.order_id && c.cost_date >= r.period_from && c.cost_date <= r.period_to)
      .reduce((s, c) => s + Number(c.amount), 0);
    return { laborCost, otherCosts };
  }

  const aggregate = records.reduce(
    (acc, r) => {
      const { laborCost, otherCosts } = costsForRecord(r);
      return {
        invoicedAmount: acc.invoicedAmount + Number(r.invoiced_amount),
        laborCost: acc.laborCost + laborCost,
        otherCosts: acc.otherCosts + otherCosts,
      };
    },
    { invoicedAmount: 0, laborCost: 0, otherCosts: 0 }
  );

  const aggregateCalc = calculateProfit(aggregate.invoicedAmount, aggregate.laborCost, aggregate.otherCosts);

  return (
    <AppShell {...shellProps}>
      <InvoicingListClient
        records={records}
        orders={orders.filter((o) => o.status === "aktivni")}
        orderNameById={orderNameById}
        aggregate={aggregateCalc}
        canEdit={canEdit}
      />
    </AppShell>
  );
}
