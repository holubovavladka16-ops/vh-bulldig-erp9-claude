"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PaperFormCard from "./PaperFormCard";
import CreateFormsDialog from "./CreateFormsDialog";
import PrintFormsButton from "./PrintFormsButton";
import { PAPER_FORM_STATUS_LABELS } from "@/lib/paperForm";
import type { Company, Employee, EmploymentType, PaperForm, PaperFormStatus } from "@/types/database.types";

interface Props {
  forms: PaperForm[];
  employeesById: Record<string, Employee>;
  employmentTypes: EmploymentType[];
  company: Company | null;
  siteUrl: string;
  companyId: string;
  canCreate: boolean;
  changedByProfileId: string;
  changedByName: string;
}

const selectClass =
  "rounded-xl border border-glass-border bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-turquoise";

export default function PaperFormsListClient({
  forms,
  employeesById,
  employmentTypes,
  company,
  siteUrl,
  companyId,
  canCreate,
  changedByProfileId,
  changedByName,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState(searchParams.get("stav") ?? "");
  const [formSearch, setFormSearch] = useState(searchParams.get("id") ?? "");
  const [employeeSearch, setEmployeeSearch] = useState(searchParams.get("zamestnanec") ?? "");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const employmentTypeNameById = Object.fromEntries(employmentTypes.map((t) => [t.id, t.name]));

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (status) params.set("stav", status);
    if (formSearch) params.set("id", formSearch);
    if (employeeSearch) params.set("zamestnanec", employeeSearch);
    router.push(`/moduly/papirovy-formular?${params.toString()}`);
  }

  const filtered = forms.filter((f) => {
    if (status && f.status !== status) return false;
    if (formSearch && !f.form_number.toLowerCase().includes(formSearch.toLowerCase())) return false;
    if (employeeSearch) {
      const emp = f.employee_id ? employeesById[f.employee_id] : null;
      const name = emp ? `${emp.first_name} ${emp.last_name}`.toLowerCase() : "";
      if (!name.includes(employeeSearch.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-white">Papírový formulář</h1>
        {canCreate && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowCreateDialog(true)}
              className="rounded-xl bg-gradient-to-r from-gold to-gold-light px-4 py-2.5 text-sm font-semibold text-base-950 transition hover:opacity-90"
            >
              Vytvořit formuláře
            </button>
            <PrintFormsButton
              forms={filtered}
              company={company}
              siteUrl={siteUrl}
              employeesById={employeesById}
              employmentTypeNameById={employmentTypeNameById}
              changedByProfileId={changedByProfileId}
              changedByName={changedByName}
              label={`Vytisknout formuláře (${filtered.length})`}
            />
          </div>
        )}
      </div>

      <form onSubmit={applyFilters} className="flex flex-wrap gap-3">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
          <option value="" className="bg-base-900">Všechny stavy</option>
          {Object.entries(PAPER_FORM_STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key} className="bg-base-900">{label}</option>
          ))}
        </select>
        <input
          value={formSearch}
          onChange={(e) => setFormSearch(e.target.value)}
          placeholder="Hledat podle ID formuláře…"
          className={selectClass}
        />
        <input
          value={employeeSearch}
          onChange={(e) => setEmployeeSearch(e.target.value)}
          placeholder="Hledat podle zaměstnance…"
          className={selectClass}
        />
        <button type="submit" className="rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/5">
          Použít filtr
        </button>
      </form>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-glass-border p-10 text-center text-sm text-white/40">
          Žádné formuláře neodpovídají zadaným kritériím.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((f) => {
            const emp = f.employee_id ? employeesById[f.employee_id] : null;
            return (
              <PaperFormCard
                key={f.id}
                form={f}
                employeeName={emp ? `${emp.first_name} ${emp.last_name}` : null}
                company={company}
                siteUrl={siteUrl}
                employeesById={employeesById}
                employmentTypeNameById={employmentTypeNameById}
                changedByProfileId={changedByProfileId}
                changedByName={changedByName}
              />
            );
          })}
        </div>
      )}

      {showCreateDialog && (
        <CreateFormsDialog
          companyId={companyId}
          existingCount={forms.length}
          changedByProfileId={changedByProfileId}
          changedByName={changedByName}
          onClose={() => setShowCreateDialog(false)}
        />
      )}
    </div>
  );
}
