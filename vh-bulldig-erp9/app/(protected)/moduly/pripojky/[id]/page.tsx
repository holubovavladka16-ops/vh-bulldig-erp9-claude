import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import ConnectionDetail from "@/components/connections/ConnectionDetail";
import { NO_PERMISSION_MESSAGE } from "@/lib/authErrors";
import { loadAppContext } from "@/lib/appContext";
import { createClient } from "@/lib/supabase/server";
import type { Connection, ConnectionHistoryEntry, ConnectionPhoto, ConnectionPoint, Order } from "@/types/database.types";

export const metadata = {
  title: "Detail přípojky | VH Bulldig ERP 9",
};

const MODULE_KEY = "pripojky";

interface Props {
  params: { id: string };
  searchParams: { ulozeno?: string };
}

export default async function ConnectionDetailPage({ params, searchParams }: Props) {
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

  const { data: connectionData } = await supabase.from("connections").select("*").eq("id", params.id).maybeSingle();
  const connection = connectionData as unknown as Connection | null;

  if (!connection) {
    return (
      <AppShell {...shellProps}>
        <p className="mx-auto max-w-md rounded-xl bg-red-500/10 px-4 py-3 text-center text-red-300">
          {NO_PERMISSION_MESSAGE}
        </p>
      </AppShell>
    );
  }

  const [{ data: orderData }, { data: pointsData }, { data: photosData }, { data: historyData }] = await Promise.all([
    supabase.from("orders").select("*").eq("id", connection.order_id).maybeSingle(),
    supabase.from("connection_points").select("*").eq("connection_id", connection.id).order("point_order"),
    supabase.from("connection_photos").select("*").eq("connection_id", connection.id).order("created_at"),
    supabase.from("connection_history").select("*").eq("connection_id", connection.id).order("changed_at", { ascending: false }),
  ]);

  const order = orderData as unknown as Order | null;
  const points = (pointsData ?? []) as unknown as ConnectionPoint[];
  const photos = (photosData ?? []) as unknown as ConnectionPhoto[];
  const history = (historyData ?? []) as unknown as ConnectionHistoryEntry[];

  const hasPermission = grantedKeys.has(MODULE_KEY);
  const canEdit = isMajitel || (isAdministrator && hasPermission);

  return (
    <AppShell {...shellProps}>
      <ConnectionDetail
        connection={connection}
        orderName={order?.name ?? "—"}
        points={points}
        photos={photos}
        history={history}
        company={company}
        canEdit={canEdit}
        justSaved={searchParams.ulozeno === "1"}
      />
    </AppShell>
  );
}
