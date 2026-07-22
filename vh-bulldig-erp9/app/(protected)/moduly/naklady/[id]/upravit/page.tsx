import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import CostForm from "@/components/costs/CostForm";
import { NO_PERMISSION_MESSAGE } from "@/lib/authErrors";
import { loadAppContext } from "@/lib/appContext";
import { createClient } from "@/lib/supabase/server";
import type { Cost, Order } from "@/types/database.types";

export const metadata = {
  title: "Upravit náklad | VH Bulldig ERP 9",
};

const MODULE_KEY = "naklady";

export default async function EditCostPage({ params }: { params: { id: string } }) {
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

  const { data: ordersData } = await supabase
    .from("orders")
    .select("*")
    .eq("company_id", company.id)
    .or(`status.eq.aktivni,id.eq.${cost.order_id}`);

  const orders = (ordersData ?? []) as unknown as Order[];

  return (
    <AppShell {...shellProps}>
      <h1 className="mb-6 font-display text-xl font-semibold text-white">Upravit náklad</h1>
      <CostForm
        companyId={company.id}
        orders={orders}
        existingCost={cost}
        changedByProfileId={profile.id}
        changedByName={profile.full_name || profile.email}
      />
    </AppShell>
  );
}
