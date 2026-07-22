import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import NewCheckFlow from "@/components/paper-form-checks/NewCheckFlow";
import { NO_PERMISSION_MESSAGE } from "@/lib/authErrors";
import { loadAppContext } from "@/lib/appContext";

export const metadata = {
  title: "Nová kontrola formuláře | VH Bulldig ERP 9",
};

const MODULE_KEY = "kontrola-papiroveho-formulare";

export default async function NewCheckPage() {
  const ctx = await loadAppContext();
  if (!ctx) redirect("/prihlaseni");

  const { profile, company, grantedKeys, isMajitel, isAdministrator, isUcetni, visibleModules } = ctx!;
  const canWrite = isMajitel || ((isAdministrator || isUcetni) && grantedKeys.has(MODULE_KEY));

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
      <h1 className="mb-6 font-display text-xl font-semibold text-white">Nová kontrola formuláře</h1>
      <NewCheckFlow
        companyId={company.id}
        reviewerProfileId={profile.id}
        reviewerName={profile.full_name || profile.email}
        canWrite={canWrite}
      />
    </AppShell>
  );
}
