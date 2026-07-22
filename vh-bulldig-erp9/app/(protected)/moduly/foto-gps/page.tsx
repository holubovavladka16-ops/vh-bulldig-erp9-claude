import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import GpsPhotosListClient from "@/components/gps-photos/GpsPhotosListClient";
import { NO_PERMISSION_MESSAGE } from "@/lib/authErrors";
import { loadAppContext } from "@/lib/appContext";
import { createClient } from "@/lib/supabase/server";
import type { GpsPhoto, Order } from "@/types/database.types";

export const metadata = {
  title: "Fotodokumentace s GPS | VH Bulldig ERP 9",
};

const MODULE_KEY = "foto-gps";

interface Props {
  searchParams: { zakazka?: string; od?: string; do?: string };
}

export default async function GpsPhotosListPage({ searchParams }: Props) {
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
  const { data: ordersData } = await supabase.from("orders").select("*").eq("company_id", company.id);
  const orders = (ordersData ?? []) as unknown as Order[];
  const orderNameById = Object.fromEntries(orders.map((o) => [o.id, o.name]));

  const orderId = searchParams.zakazka ?? "";
  const dateFrom = searchParams.od ?? "";
  const dateTo = searchParams.do ?? "";

  // RLS zajistí, že Zaměstnanec dostane pouze své vlastní fotografie.
  let query = supabase.from("gps_photos").select("*").eq("company_id", company.id);
  if (orderId) query = query.eq("order_id", orderId);
  if (dateFrom) query = query.gte("taken_at", dateFrom);
  if (dateTo) query = query.lte("taken_at", dateTo);
  const { data: photosData } = await query.order("taken_at", { ascending: false });
  const photos = (photosData ?? []) as unknown as GpsPhoto[];

  return (
    <AppShell {...shellProps}>
      <GpsPhotosListClient
        photos={photos}
        orders={orders.filter((o) => o.status === "aktivni")}
        orderNameById={orderNameById}
        company={company}
        canCreate={canManage || isZamestnanec}
      />
    </AppShell>
  );
}
