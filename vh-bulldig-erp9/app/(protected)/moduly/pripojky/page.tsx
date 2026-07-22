import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import ConnectionsListClient from "@/components/connections/ConnectionsListClient";
import { NO_PERMISSION_MESSAGE } from "@/lib/authErrors";
import { loadAppContext } from "@/lib/appContext";
import { createClient } from "@/lib/supabase/server";
import type { Connection, ConnectionPoint, Order } from "@/types/database.types";

export const metadata = {
  title: "Přípojky | VH Bulldig ERP 9",
};

const MODULE_KEY = "pripojky";

interface Props {
  searchParams: { zakazka?: string; od?: string; do?: string };
}

export default async function ConnectionsListPage({ searchParams }: Props) {
  const ctx = await loadAppContext();
  if (!ctx) redirect("/prihlaseni");

  const { profile, company, grantedKeys, isMajitel, isAdministrator, isUcetni, visibleModules } = ctx!;

  const hasPermission = grantedKeys.has(MODULE_KEY);
  const canManage = isMajitel || (isAdministrator && hasPermission);
  const canView = canManage || (isUcetni && hasPermission);

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

  let query = supabase.from("connections").select("*").eq("company_id", company.id);
  if (orderId) query = query.eq("order_id", orderId);
  if (dateFrom) query = query.gte("connection_date", dateFrom);
  if (dateTo) query = query.lte("connection_date", dateTo);
  const { data: connectionsData } = await query.order("connection_date", { ascending: false });
  const connections = (connectionsData ?? []) as unknown as Connection[];

  const connectionIds = connections.map((c) => c.id);
  let pointsByConnectionId: Record<string, ConnectionPoint[]> = {};
  let photoCountByConnectionId: Record<string, number> = {};

  if (connectionIds.length > 0) {
    const [{ data: pointsData }, { data: photosData }] = await Promise.all([
      supabase.from("connection_points").select("*").in("connection_id", connectionIds),
      supabase.from("connection_photos").select("connection_id").in("connection_id", connectionIds),
    ]);

    pointsByConnectionId = ((pointsData ?? []) as unknown as ConnectionPoint[]).reduce(
      (acc: Record<string, ConnectionPoint[]>, p) => {
        (acc[p.connection_id] ??= []).push(p);
        return acc;
      },
      {}
    );

    photoCountByConnectionId = ((photosData ?? []) as unknown as { connection_id: string }[]).reduce(
      (acc: Record<string, number>, p) => {
        acc[p.connection_id] = (acc[p.connection_id] ?? 0) + 1;
        return acc;
      },
      {}
    );
  }

  return (
    <AppShell {...shellProps}>
      <ConnectionsListClient
        connections={connections}
        orders={orders.filter((o) => o.status === "aktivni")}
        orderNameById={orderNameById}
        pointsByConnectionId={pointsByConnectionId}
        photoCountByConnectionId={photoCountByConnectionId}
        canEdit={canManage}
      />
    </AppShell>
  );
}
