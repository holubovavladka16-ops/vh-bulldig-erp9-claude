import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import AppShell from "@/components/AppShell";
import PricingList from "@/components/pricing/PricingList";
import StatusBadge from "@/components/employees/StatusBadge";
import { NO_PERMISSION_MESSAGE } from "@/lib/authErrors";
import { loadAppContext } from "@/lib/appContext";
import { createClient } from "@/lib/supabase/server";
import type { Employee, PricingItem } from "@/types/database.types";

export const metadata = {
  title: "Individuální ceník | VH Bulldig ERP 9",
};

const MODULE_KEY = "individualni-cenik";

export default async function PricingPage({ params }: { params: { employeeId: string } }) {
  const ctx = await loadAppContext();
  if (!ctx) redirect("/prihlaseni");

  const { profile, company, grantedKeys, isMajitel, isAdministrator, isUcetni, isZamestnanec, visibleModules } = ctx!;

  const shellProps = {
    modules: visibleModules,
    companyName: company?.name ?? "",
    logoUrl: company?.logo_url,
    fullName: profile.full_name || profile.email,
    role: profile.role,
  };

  const supabase = createClient();

  // employees_select_scoped RLS už zajišťuje, že Zaměstnanec dostane
  // tento záznam jen pokud je to jeho vlastní karta.
  const { data: employeeData } = await supabase
    .from("employees")
    .select("*")
    .eq("id", params.employeeId)
    .maybeSingle();

  const employee = employeeData as unknown as Employee | null;

  const hasPermission = grantedKeys.has(MODULE_KEY);
  const canEdit = isMajitel || (isAdministrator && hasPermission);
  const isOwnEmployee = employee?.profile_id === profile.id;
  const canView = canEdit || (isUcetni && hasPermission) || (isZamestnanec && isOwnEmployee);

  if (!employee || !canView || !company) {
    return (
      <AppShell {...shellProps}>
        <p className="mx-auto max-w-md rounded-xl bg-red-500/10 px-4 py-3 text-center text-red-300">
          {NO_PERMISSION_MESSAGE}
        </p>
      </AppShell>
    );
  }

  const { data: itemsData } = await supabase
    .from("pricing_items")
    .select("*")
    .eq("employee_id", employee.id)
    .order("created_at", { ascending: false });

  const items = (itemsData ?? []) as unknown as PricingItem[];

  return (
    <AppShell {...shellProps}>
      <div className="flex flex-col gap-6">
        <div>
          <Link
            href={`/moduly/zamestnanci/${employee.id}`}
            className="mb-3 inline-flex items-center gap-2 text-sm text-white/50 hover:text-white"
          >
            <ArrowLeft size={14} />
            Zpět na Kartu dělníka
          </Link>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-xl font-semibold text-white">
                Individuální ceník – {employee.first_name} {employee.last_name}
              </h1>
              <p className="mt-1 text-sm text-white/50">{employee.position}</p>
            </div>
            <StatusBadge status={employee.status} />
          </div>
        </div>

        <PricingList
          companyId={company.id}
          employeeId={employee.id}
          initialItems={items}
          canEdit={canEdit}
          changedByProfileId={profile.id}
          changedByName={profile.full_name || profile.email}
        />
      </div>
    </AppShell>
  );
}
