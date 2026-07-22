"use client";

import { useState } from "react";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import CheckCard from "./CheckCard";
import { CHECK_RESULT_LABELS } from "./CheckResultBadge";
import { MONTH_NAMES } from "@/lib/paperForm";
import type { Employee, PaperForm, PaperFormCheck } from "@/types/database.types";

interface Props {
  checks: PaperFormCheck[];
  formsById: Record<string, PaperForm>;
  employeesById: Record<string, Employee>;
  canCreate: boolean;
}

const selectClass =
  "rounded-xl border border-glass-border bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-turquoise";

export default function CheckListClient({ checks, formsById, employeesById, canCreate }: Props) {
  const [formSearch, setFormSearch] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [result, setResult] = useState("");

  const filtered = checks.filter((c) => {
    const form = formsById[c.form_id];
    const emp = employeesById[c.employee_id];
    if (formSearch && !(form?.form_number ?? "").toLowerCase().includes(formSearch.toLowerCase())) return false;
    if (employeeSearch) {
      const name = emp ? `${emp.first_name} ${emp.last_name}`.toLowerCase() : "";
      if (!name.includes(employeeSearch.toLowerCase())) return false;
    }
    if (month && c.month !== Number(month)) return false;
    if (year && c.year !== Number(year)) return false;
    if (result && c.overall_result !== result) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-white">Kontrola papírového formuláře</h1>
        {canCreate && (
          <Link
            href="/moduly/kontrola-papiroveho-formulare/novy"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-light px-4 py-2.5 text-sm font-semibold text-base-950 transition hover:opacity-90"
          >
            <PlusCircle size={16} />
            Nová kontrola
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <input value={formSearch} onChange={(e) => setFormSearch(e.target.value)} placeholder="ID formuláře…" className={selectClass} />
        <input value={employeeSearch} onChange={(e) => setEmployeeSearch(e.target.value)} placeholder="Zaměstnanec…" className={selectClass} />
        <select value={month} onChange={(e) => setMonth(e.target.value)} className={selectClass}>
          <option value="" className="bg-base-900">Všechny měsíce</option>
          {MONTH_NAMES.map((m, i) => (
            <option key={m} value={i + 1} className="bg-base-900">{m}</option>
          ))}
        </select>
        <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="Rok" className={`${selectClass} w-24`} />
        <select value={result} onChange={(e) => setResult(e.target.value)} className={selectClass}>
          <option value="" className="bg-base-900">Všechny výsledky</option>
          {Object.entries(CHECK_RESULT_LABELS).map(([key, label]) => (
            <option key={key} value={key} className="bg-base-900">{label}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-glass-border p-10 text-center text-sm text-white/40">
          Žádné kontroly neodpovídají zadaným kritériím.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => {
            const form = formsById[c.form_id];
            const emp = employeesById[c.employee_id];
            return (
              <CheckCard
                key={c.id}
                check={c}
                formNumber={form?.form_number ?? "—"}
                employeeName={emp ? `${emp.first_name} ${emp.last_name}` : "—"}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
