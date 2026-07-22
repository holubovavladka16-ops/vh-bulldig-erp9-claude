import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import CapturePhotoForm from "@/components/gps-photos/CapturePhotoForm";
import { NO_PERMISSION_MESSAGE } from "@/lib/authErrors";
import { loadAppContext } from "@/lib/appContext";
import { createClient } from "@/lib/supabase/server";
import type { Order } from "@/types/database.types";

export const metadata = {
  title: "Pořídit fotografii | VH Bulldig ERP 9",
};

const MODULE_KEY = "foto-gps";

export default async function NewGpsPhotoPage() {
  const ctx = await loadAppContext();
  if (!ctx) redirect("/prihlaseni");

  const { profile, company, grantedKeys, isMajitel, isAdministrator, isZamestnanec, visibleModules } = ctx!;
  const canCreate = isMajitel || (isAdministrator && grantedKeys.has(MODULE_KEY)) || isZamestnanec;

  const shellProps = {
    modules: visibleModules,
    companyName: company?.name ?? "",
    logoUrl: company?.logo_url,
    fullName: profile.full_name || profile.email,
    role: profile.role,
  };

  if (!canCreate || !company) {
    return (
      <AppShell {...shellProps}>
        <p className="mx-auto max-w-md rounded-xl bg-red-500/10 px-4 py-3 text-center text-red-300">
          {NO_PERMISSION_MESSAGE}
        </p>
      </AppShell>
    );
  }

  const supabase = createClient();
  const { data: ordersData } = await supabase.from("orders").select("*").eq("company_id", company.id).eq("status", "aktivni");
  const orders = (ordersData ?? []) as unknown as Order[];

  return (
    <AppShell {...shellProps}>
      <h1 className="mb-6 font-display text-xl font-semibold text-white">Pořídit fotografii</h1>
      <CapturePhotoForm
        companyId={company.id}
        orders={orders}
        authorId={profile.id}
        authorName={profile.full_name || profile.email}
      />
    </AppShell>
  );
}
