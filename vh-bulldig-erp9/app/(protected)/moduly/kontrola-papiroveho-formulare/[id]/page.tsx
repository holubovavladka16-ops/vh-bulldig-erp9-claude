import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import CheckDetail from "@/components/paper-form-checks/CheckDetail";
import { NO_PERMISSION_MESSAGE } from "@/lib/authErrors";
import { loadAppContext } from "@/lib/appContext";
import { createClient } from "@/lib/supabase/server";
import type {
  Employee,
  PaperForm,
  PaperFormCheck,
  PaperFormCheckHistoryEntry,
  PaperFormCheckPhoto,
} from "@/types/database.types";

export const metadata = {
  title: "Detail kontroly | VH Bulldig ERP 9",
};

const MODULE_KEY = "kontrola-papiroveho-formulare";

export default async function CheckDetailPage({ params }: { params: { id: string } }) {
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

  const { data: checkData } = await supabase.from("paper_form_checks").select("*").eq("id", params.id).maybeSingle();
  const check = checkData as unknown as PaperFormCheck | null;

  if (!check) {
    return (
      <AppShell {...shellProps}>
        <p className="mx-auto max-w-md rounded-xl bg-red-500/10 px-4 py-3 text-center text-red-300">
          {NO_PERMISSION_MESSAGE}
        </p>
      </AppShell>
    );
  }

  const [{ data: formData }, { data: employeeData }, { data: photosData }, { data: historyData }] = await Promise.all([
    supabase.from("paper_forms").select("*").eq("id", check.form_id).maybeSingle(),
    supabase.from("employees").select("*").eq("id", check.employee_id).maybeSingle(),
    supabase.from("paper_form_check_photos").select("*").eq("check_id", check.id).order("created_at"),
    supabase.from("paper_form_check_history").select("*").eq("check_id", check.id).order("changed_at", { ascending: false }),
  ]);

  const form = formData as unknown as PaperForm | null;
  const employee = employeeData as unknown as Employee | null;
  const photos = (photosData ?? []) as unknown as PaperFormCheckPhoto[];
  const history = (historyData ?? []) as unknown as PaperFormCheckHistoryEntry[];

  if (!form || !employee) {
    return (
      <AppShell {...shellProps}>
        <p className="mx-auto max-w-md rounded-xl bg-red-500/10 px-4 py-3 text-center text-red-300">
          {NO_PERMISSION_MESSAGE}
        </p>
      </AppShell>
    );
  }

  const hasPermission = grantedKeys.has(MODULE_KEY);
  const canClose = isMajitel || (isAdministrator && hasPermission);

  return (
    <AppShell {...shellProps}>
      <CheckDetail
        check={check}
        form={form}
        employee={employee}
        photos={photos}
        history={history}
        company={company}
        reviewerName={check.created_by_name ?? "—"}
        canClose={canClose}
        changedByProfileId={profile.id}
        changedByName={profile.full_name || profile.email}
      />
    </AppShell>
  );
}
