import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import CompanySettingsForm from "@/components/company-settings/CompanySettingsForm";
import { NO_PERMISSION_MESSAGE } from "@/lib/authErrors";
import { loadAppContext } from "@/lib/appContext";

export const metadata = {
  title: "Nastavení společnosti | VH Bulldig ERP 9",
};

const MODULE_KEY = "nastaveni-spolecnosti";

export default async function CompanySettingsPage() {
  const ctx = await loadAppContext();

  if (!ctx) {
    redirect("/prihlaseni");
  }

  const { profile, company, grantedKeys, isMajitel, isAdministrator, isUcetni, isZamestnanec, visibleModules } = ctx!;

  const hasPermission = grantedKeys.has(MODULE_KEY);
  const canEdit = isMajitel || (isAdministrator && hasPermission);
  const canView = canEdit || (isUcetni && hasPermission);

  const shell = (
    <AppShell
      modules={visibleModules}
      companyName={company?.name ?? ""}
      logoUrl={company?.logo_url}
      fullName={profile.full_name || profile.email}
      role={profile.role}
    >
      {isZamestnanec || !canView || !company ? (
        <p className="mx-auto max-w-md rounded-xl bg-red-500/10 px-4 py-3 text-center text-red-300">
          {NO_PERMISSION_MESSAGE}
        </p>
      ) : (
        <>
          <div>
            <h1 className="font-display text-xl font-semibold text-white">
              Nastavení společnosti
            </h1>
            <p className="mt-1 text-sm text-white/50">
              {canEdit
                ? "Tyto údaje se automaticky použijí v celé aplikaci a ve všech dokumentech."
                : "Zobrazení firemních údajů (bez možnosti úpravy)."}
            </p>
          </div>
          <CompanySettingsForm company={company} readOnly={!canEdit} />
        </>
      )}
    </AppShell>
  );

  return shell;
}
