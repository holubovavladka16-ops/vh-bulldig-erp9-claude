import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import ConnectionForm from "@/components/connections/ConnectionForm";
import { NO_PERMISSION_MESSAGE } from "@/lib/authErrors";
import { loadAppContext } from "@/lib/appContext";
import { createClient } from "@/lib/supabase/server";
import type { Connection, ConnectionPhoto, ConnectionPoint, Order } from "@/types/database.types";

export const metadata = {
  title: "Upravit přípojku | VH Bulldig ERP 9",
};

const MODULE_KEY = "pripojky";

export default async function EditConnectionPage({ params }: { params: { id: string } }) {
  const ctx = await loadAppContext();
  if (!ctx) redirect("/prihlaseni");

  const { profile, company, grantedKeys, isMajitel, isAdministrator, visibleModules } = ctx!;
  const canEdit = isMajitel || (isAdministrator && grantedKeys.has(MODULE_KEY));

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

  const [{ data: ordersData }, { data: pointsData }, { data: photosData }] = await Promise.all([
    supabase.from("orders").select("*").eq("company_id", company.id),
    supabase.from("connection_points").select("*").eq("connection_id", connection.id).order("point_order"),
    supabase.from("connection_photos").select("*").eq("connection_id", connection.id).order("created_at"),
  ]);

  const orders = ((ordersData ?? []) as unknown as Order[]).filter(
    (o) => o.status === "aktivni" || o.id === connection.order_id
  );
  const points = (pointsData ?? []) as unknown as ConnectionPoint[];
  const photos = (photosData ?? []) as unknown as ConnectionPhoto[];

  return (
    <AppShell {...shellProps}>
      <h1 className="mb-6 font-display text-xl font-semibold text-white">Upravit přípojku</h1>
      <ConnectionForm
        companyId={company.id}
        orders={orders}
        existingConnection={connection}
        existingPoints={points}
        existingPhotos={photos}
        changedByProfileId={profile.id}
        changedByName={profile.full_name || profile.email}
      />
    </AppShell>
  );
}
