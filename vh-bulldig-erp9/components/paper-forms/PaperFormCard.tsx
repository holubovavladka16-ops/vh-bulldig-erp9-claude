import Link from "next/link";
import PaperFormStatusBadge from "./PaperFormStatusBadge";
import PrintFormsButton from "./PrintFormsButton";
import { MONTH_NAMES } from "@/lib/paperForm";
import type { Company, Employee, PaperForm } from "@/types/database.types";

interface Props {
  form: PaperForm;
  employeeName: string | null;
  company: Company | null;
  siteUrl: string;
  employeesById: Record<string, Employee>;
  employmentTypeNameById: Record<string, string>;
  changedByProfileId: string;
  changedByName: string;
}

export default function PaperFormCard({
  form,
  employeeName,
  company,
  siteUrl,
  employeesById,
  employmentTypeNameById,
  changedByProfileId,
  changedByName,
}: Props) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
      <div className="flex items-start justify-between gap-3">
        <p className="font-display text-sm font-semibold text-white">{form.form_number}</p>
        <PaperFormStatusBadge status={form.status} />
      </div>
      <p className="text-xs text-white/40">{MONTH_NAMES[form.month - 1]} {form.year}</p>
      <p className="text-xs text-white/40">{new Date(form.created_at).toLocaleDateString("cs-CZ")}</p>
      <p className="text-sm text-white/70">{employeeName ?? "Nepřiřazeno"}</p>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <PrintFormsButton
          forms={[form]}
          company={company}
          siteUrl={siteUrl}
          employeesById={employeesById}
          employmentTypeNameById={employmentTypeNameById}
          changedByProfileId={changedByProfileId}
          changedByName={changedByName}
          label="Vytisknout"
        />
        <Link
          href={`/moduly/papirovy-formular/${form.id}`}
          className="rounded-xl border border-glass-border px-3 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/5"
        >
          Otevřít detail
        </Link>
      </div>
    </div>
  );
}
