import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import Greeting from "@/components/dashboard/Greeting";
import StatCardsGrid from "@/components/dashboard/StatCardsGrid";
import QuickActions from "@/components/dashboard/QuickActions";
import ActiveOrdersOverview from "@/components/dashboard/ActiveOrdersOverview";
import ProfitChart from "@/components/dashboard/ProfitChart";
import DayOverview from "@/components/dashboard/DayOverview";
import Alerts from "@/components/dashboard/Alerts";
import { NO_PERMISSION_MESSAGE } from "@/lib/authErrors";
import { loadAppContext } from "@/lib/appContext";
import { createClient } from "@/lib/supabase/server";
import { calculateProfit } from "@/lib/profit";
import type { AttendanceRecord, Cost, InvoicingRecord } from "@/types/database.types";

export const metadata = {
  title: "Dashboard | VH Bulldig ERP 9",
};

const FINANCIAL_MODULE_KEY = "fakturace-a-prehled-zisku";

export default async function DashboardPage() {
  const ctx = await loadAppContext();

  if (!ctx) {
    redirect("/prihlaseni");
  }

  const { profile, company, grantedKeys, isMajitel, isUcetni, visibleModules } = ctx!;

  if (!profile.is_active) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-base-950 px-4">
        <p className="rounded-lg bg-red-500/10 px-4 py-3 text-red-300">
          {NO_PERMISSION_MESSAGE}
        </p>
      </main>
    );
  }

  const canSeeFinancials = isMajitel || isUcetni || grantedKeys.has(FINANCIAL_MODULE_KEY);
  const firstName = (profile.full_name || profile.email).split(" ")[0];

  let monthlyProfit: { invoicedAmount: number; totalCosts: number; result: number } | null = null;

  if (canSeeFinancials && company) {
    const supabase = createClient();
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const monthEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const monthEnd = monthEndDate.toISOString().slice(0, 10);

    const [{ data: invoicingData }, { data: attendanceData }, { data: costsData }] = await Promise.all([
      supabase
        .from("invoicing_records")
        .select("*")
        .eq("company_id", company.id)
        .lte("period_from", monthEnd)
        .gte("period_to", monthStart),
      supabase
        .from("attendance_records")
        .select("*")
        .eq("company_id", company.id)
        .eq("status", "schvaleny")
        .gte("record_date", monthStart)
        .lte("record_date", monthEnd),
      supabase.from("costs").select("*").eq("company_id", company.id).gte("cost_date", monthStart).lte("cost_date", monthEnd),
    ]);

    const invoicing = (invoicingData ?? []) as unknown as InvoicingRecord[];
    if (invoicing.length > 0) {
      const invoicedAmount = invoicing.reduce((s, r) => s + Number(r.invoiced_amount), 0);
      const laborCost = ((attendanceData ?? []) as unknown as AttendanceRecord[]).reduce((s, a) => s + Number(a.total_earnings), 0);
      const otherCosts = ((costsData ?? []) as unknown as Cost[]).reduce((s, c) => s + Number(c.amount), 0);
      const calc = calculateProfit(invoicedAmount, laborCost, otherCosts);
      monthlyProfit = { invoicedAmount: calc.invoicedAmount, totalCosts: calc.totalCosts, result: calc.result };
    }
  }

  return (
    <AppShell
      modules={visibleModules}
      companyName={company?.name ?? ""}
      logoUrl={company?.logo_url}
      fullName={profile.full_name || profile.email}
      role={profile.role}
    >
      <Greeting firstName={firstName} companyName={company?.name ?? "vaší firmy"} />

      <StatCardsGrid canSeeFinancials={canSeeFinancials} monthlyProfit={monthlyProfit} />

      <QuickActions />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ActiveOrdersOverview />
        {canSeeFinancials && <ProfitChart />}
      </div>

      <Alerts />

      <DayOverview />
    </AppShell>
  );
}
