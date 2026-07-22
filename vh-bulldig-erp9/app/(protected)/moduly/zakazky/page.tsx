import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import OrdersListClient from "@/components/orders/OrdersListClient";
import { NO_PERMISSION_MESSAGE } from "@/lib/authErrors";
import { loadAppContext } from "@/lib/appContext";
import { createClient } from "@/lib/supabase/server";
import type { Order } from "@/types/database.types";

export const metadata = {
  title: "Zakázky | VH Bulldig ERP 9",
};

const MODULE_KEY = "zakazky";

export default async function OrdersListPage() {
  const ctx = await loadAppContext();
  if (!ctx) redirect("/prihlaseni");

  const { profile, company, grantedKeys, isMajitel, isAdministrator, isUcetni, isZamestnanec, visibleModules } = ctx!;

  const hasPermission = grantedKeys.has(MODULE_KEY);
  const canEdit = isMajitel || (isAdministrator && hasPermission);
  const canView = canEdit || (isUcetni && hasPermission);

  const shellProps = {
    modules: visibleModules,
    companyName: company?.name ?? "",
    logoUrl: company?.logo_url,
    fullName: profile.full_name || profile.email,
    role: profile.role,
  };

  // Zaměstnanec zatím nemá k žádné zakázce definovaný přístup (viz
  // poznámka v migraci 0005) - proto vidí prázdný seznam, ne chybu,
  // dokud nevzniknou moduly Docházka/Výkazy, které přiřazení zavedou.
  if (!canView && !isZamestnanec) {
    return (
      <AppShell {...shellProps}>
        <p className="mx-auto max-w-md rounded-xl bg-red-500/10 px-4 py-3 text-center text-red-300">
          {NO_PERMISSION_MESSAGE}
        </p>
      </AppShell>
    );
  }

  if (!company) {
    return (
      <AppShell {...shellProps}>
        <p className="mx-auto max-w-md rounded-xl bg-red-500/10 px-4 py-3 text-center text-red-300">
          {NO_PERMISSION_MESSAGE}
        </p>
      </AppShell>
    );
  }

  const supabase = createClient();
  const { data: ordersData } = await supabase
    .from("orders")
    .select("*")
    .eq("company_id", company.id)
    .order("founded_date", { ascending: false });

  const orders = (ordersData ?? []) as unknown as Order[];

  return (
    <AppShell {...shellProps}>
      <OrdersListClient orders={orders} canEdit={canEdit} />
    </AppShell>
  );
}
