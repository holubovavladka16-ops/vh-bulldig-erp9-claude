import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import OrderDetail from "@/components/orders/OrderDetail";
import { NO_PERMISSION_MESSAGE } from "@/lib/authErrors";
import { loadAppContext } from "@/lib/appContext";
import { createClient } from "@/lib/supabase/server";
import type { Order, OrderHistoryEntry, DocumentV2 } from "@/types/database.types";

export const metadata = {
  title: "Detail zakázky | VH Bulldig ERP 9",
};

const MODULE_KEY = "zakazky";

interface Props {
  params: { id: string };
  searchParams: { vytvoreno?: string };
}

export default async function OrderDetailPage({ params, searchParams }: Props) {
  const ctx = await loadAppContext();
  if (!ctx) redirect("/prihlaseni");

  const { profile, company, grantedKeys, isMajitel, isAdministrator, visibleModules } = ctx!;

  const shellProps = {
    modules: visibleModules,
    companyName: company?.name ?? "",
    logoUrl: company?.logo_url,
    fullName: profile.full_name || profile.email,
    role: profile.role,
  };

  const supabase = createClient();

  // orders_select_scoped RLS už zajišťuje, kdo tuto zakázku smí vidět.
  const { data: orderData } = await supabase
    .from("orders")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  const order = orderData as unknown as Order | null;

  if (!order) {
    return (
      <AppShell {...shellProps}>
        <p className="mx-auto max-w-md rounded-xl bg-red-500/10 px-4 py-3 text-center text-red-300">
          {NO_PERMISSION_MESSAGE}
        </p>
      </AppShell>
    );
  }

  const [{ data: historyData }, { data: documentsData }] = await Promise.all([
    supabase.from("order_history").select("*").eq("order_id", order.id).order("changed_at", { ascending: false }),
    supabase.from("documents").select("*").eq("order_id", order.id).order("created_at", { ascending: false }),
  ]);

  const history = (historyData ?? []) as unknown as OrderHistoryEntry[];
  const documents = (documentsData ?? []) as unknown as DocumentV2[];
  const canEdit = isMajitel || (isAdministrator && grantedKeys.has(MODULE_KEY));

  return (
    <AppShell {...shellProps}>
      <OrderDetail
        order={order}
        history={history}
        documents={documents}
        canEdit={canEdit}
        justCreated={searchParams.vytvoreno === "1"}
      />
    </AppShell>
  );
}
