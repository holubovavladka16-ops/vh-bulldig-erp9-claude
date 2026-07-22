import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import BackupModuleClient from "@/components/backup/BackupModuleClient";
import { NO_PERMISSION_MESSAGE } from "@/lib/authErrors";
import { loadAppContext } from "@/lib/appContext";
import { createClient } from "@/lib/supabase/server";
import type { DatabaseBackup } from "@/types/database.types";

export const metadata = {
  title: "Záloha a obnova databáze | VH Bulldig ERP 9",
};

const MODULE_KEY = "zaloha-obnova";

export default async function BackupPage() {
  const ctx = await loadAppContext();
  if (!ctx) redirect("/prihlaseni");

  const { profile, company, grantedKeys, isMajitel, isAdministrator, visibleModules } = ctx!;

  const hasPermission = grantedKeys.has(MODULE_KEY);
  const canCreateBackup = isMajitel || (isAdministrator && hasPermission);
  const canRestore = isMajitel;
  const canView = canCreateBackup;

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
  const { data: backupsData } = await supabase
    .from("database_backups")
    .select("*")
    .eq("company_id", company.id)
    .order("created_at", { ascending: false });

  const backups = (backupsData ?? []) as unknown as DatabaseBackup[];

  return (
    <AppShell {...shellProps}>
      <h1 className="mb-6 font-display text-xl font-semibold text-white">Záloha a obnova databáze</h1>
      <BackupModuleClient backups={backups} canCreateBackup={canCreateBackup} canRestore={canRestore} />
    </AppShell>
  );
}
