import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import AppSettingsClient from "@/components/app-settings/AppSettingsClient";
import { NO_PERMISSION_MESSAGE } from "@/lib/authErrors";
import { loadAppContext } from "@/lib/appContext";

export const metadata = {
  title: "Nastavení aplikace | VH Bulldig ERP 9",
};

export default async function AppSettingsPage() {
  const ctx = await loadAppContext();
  if (!ctx) redirect("/prihlaseni");

  const { profile, company, isMajitel, visibleModules } = ctx!;

  const shellProps = {
    modules: visibleModules,
    companyName: company?.name ?? "",
    logoUrl: company?.logo_url,
    fullName: profile.full_name || profile.email,
    role: profile.role,
  };

  if (!company) {
    return (
      <AppShell {...shellProps}>
        <p className="mx-auto max-w-md rounded-xl bg-red-500/10 px-4 py-3 text-center text-red-300">
          {NO_PERMISSION_MESSAGE}
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell {...shellProps}>
      <h1 className="mb-6 font-display text-xl font-semibold text-white">Nastavení aplikace</h1>
      <AppSettingsClient isMajitel={isMajitel} companyId={company.id} initialCompanyDefaultDesign={company.default_user_design} />
    </AppShell>
  );
}
