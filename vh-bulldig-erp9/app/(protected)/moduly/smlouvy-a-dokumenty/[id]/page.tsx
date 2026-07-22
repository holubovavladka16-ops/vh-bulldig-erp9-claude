import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import ContractDetail from "@/components/documents/ContractDetail";
import { NO_PERMISSION_MESSAGE } from "@/lib/authErrors";
import { loadAppContext } from "@/lib/appContext";
import { createClient } from "@/lib/supabase/server";
import type {
  DocumentAttachment,
  DocumentHistoryEntry,
  DocumentSignature,
  DocumentV2,
  DocumentVersion,
  Employee,
  Order,
} from "@/types/database.types";

export const metadata = {
  title: "Detail dokumentu | VH Bulldig ERP 9",
};

const MODULE_KEY = "smlouvy-a-dokumenty";

interface Props {
  params: { id: string };
  searchParams: { vytvoreno?: string };
}

export default async function ContractDetailPage({ params, searchParams }: Props) {
  const ctx = await loadAppContext();
  if (!ctx) redirect("/prihlaseni");

  const { profile, company, grantedKeys, isMajitel, isAdministrator, isUcetni, visibleModules } = ctx!;

  const shellProps = {
    modules: visibleModules,
    companyName: company?.name ?? "",
    logoUrl: company?.logo_url,
    fullName: profile.full_name || profile.email,
    role: profile.role,
  };

  const supabase = createClient();

  const { data: docData } = await supabase.from("documents").select("*").eq("id", params.id).maybeSingle();
  const doc = docData as unknown as DocumentV2 | null;

  if (!doc) {
    return (
      <AppShell {...shellProps}>
        <p className="mx-auto max-w-md rounded-xl bg-red-500/10 px-4 py-3 text-center text-red-300">
          {NO_PERMISSION_MESSAGE}
        </p>
      </AppShell>
    );
  }

  const [
    { data: employeeData },
    { data: orderData },
    { data: attachmentsData },
    { data: signaturesData },
    { data: versionsData },
    { data: historyData },
  ] = await Promise.all([
    doc.employee_id ? supabase.from("employees").select("*").eq("id", doc.employee_id).maybeSingle() : Promise.resolve({ data: null }),
    doc.order_id ? supabase.from("orders").select("*").eq("id", doc.order_id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("document_attachments").select("*").eq("document_id", doc.id).order("created_at"),
    supabase.from("document_signatures").select("*").eq("document_id", doc.id).order("created_at"),
    supabase.from("document_versions").select("*").eq("document_id", doc.id).order("version_number", { ascending: false }),
    supabase.from("document_history").select("*").eq("document_id", doc.id).order("changed_at", { ascending: false }),
  ]);

  const employee = employeeData as unknown as Employee | null;
  const order = orderData as unknown as Order | null;
  const attachments = (attachmentsData ?? []) as unknown as DocumentAttachment[];
  const signatures = (signaturesData ?? []) as unknown as DocumentSignature[];
  const versions = (versionsData ?? []) as unknown as DocumentVersion[];
  const history = (historyData ?? []) as unknown as DocumentHistoryEntry[];

  const hasPermission = grantedKeys.has(MODULE_KEY);
  const canManage = isMajitel || ((isAdministrator || isUcetni) && hasPermission);
  const isOwnDocument = employee?.profile_id === profile.id;

  return (
    <AppShell {...shellProps}>
      <ContractDetail
        doc={doc}
        employee={employee}
        order={order}
        company={company}
        attachments={attachments}
        signatures={signatures}
        versions={versions}
        history={history}
        canManage={canManage}
        isOwnDocument={isOwnDocument}
        changedByProfileId={profile.id}
        changedByName={profile.full_name || profile.email}
        justCreated={searchParams.vytvoreno === "1"}
      />
    </AppShell>
  );
}
