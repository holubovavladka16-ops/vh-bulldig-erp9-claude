import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import MapOverviewClient from "@/components/map-overview/MapOverviewClient";
import { NO_PERMISSION_MESSAGE } from "@/lib/authErrors";
import { loadAppContext } from "@/lib/appContext";
import { createClient } from "@/lib/supabase/server";
import type { Connection, ConnectionPoint, GpsPhoto, Order } from "@/types/database.types";

export const metadata = {
  title: "Mapa s body a fotografiemi | VH Bulldig ERP 9",
};

const MODULE_KEY = "mapa";

interface Props {
  searchParams: { zakazka?: string; od?: string; do?: string };
}

export default async function MapOverviewPage({ searchParams }: Props) {
  const ctx = await loadAppContext();
  if (!ctx) redirect("/prihlaseni");

  const { profile, company, grantedKeys, isMajitel, isAdministrator, isUcetni, isZamestnanec, visibleModules } = ctx!;

  const hasPermission = grantedKeys.has(MODULE_KEY);
  const canView = isMajitel || ((isAdministrator || isUcetni) && hasPermission) || isZamestnanec;

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

  // Tento modul nic nevytváří ani neduplikuje - pouze čte data z
  // existujících modulů. Row Level Security tabulek orders/gps_photos/
  // connections/connection_points už sama zajišťuje, že každá role
  // (Majitel/Administrátor/Účetní/Zaměstnanec) uvidí přesně to, na co
  // má podle svého oprávnění nárok (bod 16 zadání) - stejná pravidla
  // jako v modulech Zakázky, Fotodokumentace s GPS a Přípojky.
  const { data: ordersData } = await supabase.from("orders").select("*").eq("company_id", company.id);
  const orders = (ordersData ?? []) as unknown as Order[];

  const orderId = searchParams.zakazka ?? "";
  const dateFrom = searchParams.od ?? "";
  const dateTo = searchParams.do ?? "";

  let photosQuery = supabase.from("gps_photos").select("*").eq("company_id", company.id);
  if (orderId) photosQuery = photosQuery.eq("order_id", orderId);
  if (dateFrom) photosQuery = photosQuery.gte("taken_at", dateFrom);
  if (dateTo) photosQuery = photosQuery.lte("taken_at", dateTo);
  const { data: photosData } = await photosQuery.order("taken_at", { ascending: false });
  const photos = (photosData ?? []) as unknown as GpsPhoto[];

  let connectionsQuery = supabase.from("connections").select("*").eq("company_id", company.id);
  if (orderId) connectionsQuery = connectionsQuery.eq("order_id", orderId);
  if (dateFrom) connectionsQuery = connectionsQuery.gte("connection_date", dateFrom);
  if (dateTo) connectionsQuery = connectionsQuery.lte("connection_date", dateTo);
  const { data: connectionsData } = await connectionsQuery.order("connection_date", { ascending: false });
  const connections = (connectionsData ?? []) as unknown as Connection[];

  let pointsByConnectionId: Record<string, ConnectionPoint[]> = {};
  const connectionIds = connections.map((c) => c.id);
  if (connectionIds.length > 0) {
    const { data: pointsData } = await supabase
      .from("connection_points")
      .select("*")
      .in("connection_id", connectionIds)
      .order("point_order");

    pointsByConnectionId = ((pointsData ?? []) as unknown as ConnectionPoint[]).reduce(
      (acc: Record<string, ConnectionPoint[]>, p) => {
        (acc[p.connection_id] ??= []).push(p);
        return acc;
      },
      {}
    );
  }

  return (
    <AppShell {...shellProps}>
      <MapOverviewClient
        orders={orders}
        photos={photos}
        connections={connections}
        pointsByConnectionId={pointsByConnectionId}
      />
    </AppShell>
  );
}
