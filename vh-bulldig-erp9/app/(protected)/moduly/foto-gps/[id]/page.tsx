import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import GpsPhotoDetail from "@/components/gps-photos/GpsPhotoDetail";
import { NO_PERMISSION_MESSAGE } from "@/lib/authErrors";
import { loadAppContext } from "@/lib/appContext";
import { createClient } from "@/lib/supabase/server";
import type { GpsPhoto, GpsPhotoHistoryEntry, Order } from "@/types/database.types";

export const metadata = {
  title: "Detail fotografie | VH Bulldig ERP 9",
};

const MODULE_KEY = "foto-gps";

interface Props {
  params: { id: string };
  searchParams: { ulozeno?: string };
}

export default async function GpsPhotoDetailPage({ params, searchParams }: Props) {
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

  const { data: photoData } = await supabase.from("gps_photos").select("*").eq("id", params.id).maybeSingle();
  const photo = photoData as unknown as GpsPhoto | null;

  if (!photo) {
    return (
      <AppShell {...shellProps}>
        <p className="mx-auto max-w-md rounded-xl bg-red-500/10 px-4 py-3 text-center text-red-300">
          {NO_PERMISSION_MESSAGE}
        </p>
      </AppShell>
    );
  }

  const [{ data: orderData }, { data: historyData }] = await Promise.all([
    supabase.from("orders").select("*").eq("id", photo.order_id).maybeSingle(),
    supabase.from("gps_photo_history").select("*").eq("photo_id", photo.id).order("changed_at", { ascending: false }),
  ]);

  const order = orderData as unknown as Order | null;
  const history = (historyData ?? []) as unknown as GpsPhotoHistoryEntry[];

  const hasPermission = grantedKeys.has(MODULE_KEY);
  const canEdit = isMajitel || (isAdministrator && hasPermission) || photo.author_id === profile.id;

  return (
    <AppShell {...shellProps}>
      <GpsPhotoDetail
        photo={photo}
        orderName={order?.name ?? "—"}
        history={history}
        company={company}
        canEdit={canEdit}
        changedByProfileId={profile.id}
        changedByName={profile.full_name || profile.email}
        justSaved={searchParams.ulozeno === "1"}
      />
    </AppShell>
  );
}
