import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import CostDetail from "@/components/costs/CostDetail";
import { NO_PERMISSION_MESSAGE } from "@/lib/authErrors";
import { loadAppContext } from "@/lib/appContext";
import { createClient } from "@/lib/supabase/server";
import type { Cost, CostHistoryEntry, Order } from "@/types/database.types";

export const metadata = {
  title: "Detail nákladu | VH Bulldig ERP 9",
};

const MODULE_KEY = "naklady";

interface Props {
  params: { id: string };
  searchParams: { ulozeno?: string };
}

export default async function CostDetailPage({ params, searchParams }: Props) {
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

  const { data: costData } = await supabase.from("costs").select("*").eq("id", params.id).maybeSingle();
  const cost = costData as unknown as Cost | null;

  if (!cost) {
    return (
      <AppShell {...shellProps}>
        <p className="mx-auto max-w-md rounded-xl bg-red-500/10 px-4 py-3 text-center text-red-300">
          {NO_PERMISSION_MESSAGE}
        </p>
      </AppShell>
    );
  }

  const [{ data: orderData }, { data: historyData }] = await Promise.all([
    supabase.from("orders").select("*").eq("id", cost.order_id).maybeSingle(),
    supabase.from("cost_history").select("*").eq("cost_id", cost.id).order("changed_at", { ascending: false }),
  ]);

  const order = orderData as unknown as Order | null;
  const history = (historyData ?? []) as unknown as CostHistoryEntry[];

  return (
    <AppShell {...shellProps}>
      <CostDetail
        cost={cost}
        orderName={order?.name ?? "—"}
        history={history}
        canEdit={canEdit}
        justSaved={searchParams.ulozeno === "1"}
      />
    </AppShell>
  );
}
