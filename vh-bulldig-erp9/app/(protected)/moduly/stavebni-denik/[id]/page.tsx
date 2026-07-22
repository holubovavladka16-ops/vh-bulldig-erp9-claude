import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import LogDetail from "@/components/construction-log/LogDetail";
import { NO_PERMISSION_MESSAGE } from "@/lib/authErrors";
import { loadAppContext } from "@/lib/appContext";
import { createClient } from "@/lib/supabase/server";
import type { ConstructionLogEntry, ConstructionLogHistoryEntry, Employee, Order } from "@/types/database.types";

export const metadata = {
  title: "Detail záznamu | VH Bulldig ERP 9",
};

const MODULE_KEY = "stavebni-denik";

interface Props {
  params: { id: string };
  searchParams: { ulozeno?: string };
}

export default async function LogEntryDetailPage({ params, searchParams }: Props) {
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

  const [{ data: orderData }, { data: historyData }, { data: employeesData }] = await Promise.all([
    supabase.from("orders").select("*").eq("id", entry.order_id).maybeSingle(),
    supabase.from("construction_log_history").select("*").eq("entry_id", entry.id).order("changed_at", { ascending: false }),
    supabase.from("employees").select("*").in("id", entry.worker_ids.length ? entry.worker_ids : ["-"]),
  ]);

  const order = orderData as unknown as Order | null;
  const history = (historyData ?? []) as unknown as ConstructionLogHistoryEntry[];
  const employees = (employeesData ?? []) as unknown as Employee[];
  const workerNames = employees.map((e) => `${e.first_name} ${e.last_name}`).join(", ");

  const hasPermission = grantedKeys.has(MODULE_KEY);
  const canEdit = isMajitel || (isAdministrator && hasPermission);

  return (
    <AppShell {...shellProps}>
      <LogDetail
        entry={entry}
        orderName={order?.name ?? "—"}
        workerNames={workerNames}
        history={history}
        canEdit={canEdit}
        justSaved={searchParams.ulozeno === "1"}
      />
    </AppShell>
  );
}
