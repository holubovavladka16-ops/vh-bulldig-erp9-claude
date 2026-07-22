import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import InvoicingDetail from "@/components/invoicing/InvoicingDetail";
import { calculateProfit } from "@/lib/profit";
import { NO_PERMISSION_MESSAGE } from "@/lib/authErrors";
import { loadAppContext } from "@/lib/appContext";
import { createClient } from "@/lib/supabase/server";
import type { AttendanceRecord, Cost, InvoicingHistoryEntry, InvoicingRecord, Order } from "@/types/database.types";

export const metadata = {
  title: "Detail fakturace | VH Bulldig ERP 9",
};

interface Props {
  params: { id: string };
  searchParams: { ulozeno?: string };
}

const MODULE_KEY = "fakturace-a-prehled-zisku";

export default async function InvoicingDetailPage({ params, searchParams }: Props) {
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

  const supabase = createClient();

  const { data: recordData } = await supabase.from("invoicing_records").select("*").eq("id", params.id).maybeSingle();
  const record = recordData as unknown as InvoicingRecord | null;

  if (!record) {
    return (
      <AppShell {...shellProps}>
        <p className="mx-auto max-w-md rounded-xl bg-red-500/10 px-4 py-3 text-center text-red-300">
          {NO_PERMISSION_MESSAGE}
        </p>
      </AppShell>
    );
  }

  const [{ data: orderData }, { data: historyData }, { data: attendanceData }, { data: costsData }] = await Promise.all([
    supabase.from("orders").select("*").eq("id", record.order_id).maybeSingle(),
    supabase.from("invoicing_history").select("*").eq("invoicing_record_id", record.id).order("changed_at", { ascending: false }),
    supabase
      .from("attendance_records")
      .select("*")
      .eq("order_id", record.order_id)
      .eq("status", "schvaleny")
      .gte("record_date", record.period_from)
      .lte("record_date", record.period_to),
    supabase
      .from("costs")
      .select("*")
      .eq("order_id", record.order_id)
      .gte("cost_date", record.period_from)
      .lte("cost_date", record.period_to),
  ]);

  const order = orderData as unknown as Order | null;
  const history = (historyData ?? []) as unknown as InvoicingHistoryEntry[];
  const laborCost = ((attendanceData ?? []) as unknown as AttendanceRecord[]).reduce((s, a) => s + Number(a.total_earnings), 0);
  const otherCosts = ((costsData ?? []) as unknown as Cost[]).reduce((s, c) => s + Number(c.amount), 0);

  const calc = calculateProfit(record.invoiced_amount, laborCost, otherCosts);

  return (
    <AppShell {...shellProps}>
      <InvoicingDetail
        record={record}
        orderName={order?.name ?? "—"}
        calc={calc}
        history={history}
        canEdit={canEdit}
        justSaved={searchParams.ulozeno === "1"}
      />
    </AppShell>
  );
}
