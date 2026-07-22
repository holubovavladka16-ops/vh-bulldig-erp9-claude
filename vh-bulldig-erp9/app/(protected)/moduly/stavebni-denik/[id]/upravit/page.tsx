import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import LogForm from "@/components/construction-log/LogForm";
import { NO_PERMISSION_MESSAGE } from "@/lib/authErrors";
import { loadAppContext } from "@/lib/appContext";
import { createClient } from "@/lib/supabase/server";
import type { ConstructionLogEntry, Employee, Order } from "@/types/database.types";

export const metadata = {
  title: "Upravit záznam | VH Bulldig ERP 9",
};

const MODULE_KEY = "stavebni-denik";

export default async function EditLogEntryPage({ params }: { params: { id: string } }) {
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
  const { data: entryData } = await supabase.from("construction_log_entries").select("*").eq("id", params.id).maybeSingle();
  const entry = entryData as unknown as ConstructionLogEntry | null;

  if (!entry) {
    return (
      <AppShell {...shellProps}>
        <p className="mx-auto max-w-md rounded-xl bg-red-500/10 px-4 py-3 text-center text-red-300">
          {NO_PERMISSION_MESSAGE}
        </p>
      </AppShell>
    );
  }

  const [{ data: employeesData }, { data: ordersData }] = await Promise.all([
    supabase.from("employees").select("*").eq("company_id", company.id),
    supabase.from("orders").select("*").eq("company_id", company.id),
  ]);

  const employees = ((employeesData ?? []) as unknown as Employee[]).filter(
    (e) => e.status === "aktivni" || entry.worker_ids.includes(e.id)
  );
  const orders = ((ordersData ?? []) as unknown as Order[]).filter(
    (o) => o.status === "aktivni" || o.id === entry.order_id
  );

  return (
    <AppShell {...shellProps}>
      <h1 className="mb-6 font-display text-xl font-semibold text-white">Upravit záznam</h1>
      <LogForm
        companyId={company.id}
        employees={employees}
        orders={orders}
        existingEntry={entry}
        changedByProfileId={profile.id}
        changedByName={profile.full_name || profile.email}
      />
    </AppShell>
  );
}
