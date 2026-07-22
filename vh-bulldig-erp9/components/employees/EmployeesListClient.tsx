"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import EmployeeCard from "./EmployeeCard";
import EmploymentTypeManager from "./EmploymentTypeManager";
import type { Employee, EmployeeStatus, EmploymentType } from "@/types/database.types";
import { STATUS_LABELS } from "./StatusBadge";

interface Props {
  employees: Employee[];
  employmentTypes: EmploymentType[];
  companyId: string;
  canEdit: boolean;
}

const STATUS_FILTERS: (EmployeeStatus | "vse")[] = [
  "vse",
  "aktivni",
  "neaktivni",
  "pozastaveny",
  "ukonceny",
];

export default function EmployeesListClient({ employees, employmentTypes, companyId, canEdit }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | "vse">("vse");

  const typeNameById = useMemo(() => {
    const map = new Map<string, string>();
    employmentTypes.forEach((t) => map.set(t.id, t.name));
    return map;
  }, [employmentTypes]);

  const filtered = employees.filter((e) => {
    const matchesSearch = `${e.first_name} ${e.last_name}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus = statusFilter === "vse" || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-white">Zaměstnanci</h1>
        {canEdit && (
          <Link
            href="/moduly/zamestnanci/novy"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-light px-4 py-2.5 text-sm font-semibold text-base-950 transition hover:opacity-90"
          >
            <Plus size={16} />
            Nový zaměstnanec
          </Link>
        )}
      </div>

      {canEdit && (
        <EmploymentTypeManager companyId={companyId} initialTypes={employmentTypes} canManage={canEdit} />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Hledat podle jména a příjmení…"
            className="w-full rounded-xl border border-glass-border bg-white/5 py-2.5 pl-9 pr-4 text-sm text-white outline-none focus:border-turquoise"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                statusFilter === s
                  ? "border-turquoise bg-turquoise/10 text-turquoise-light"
                  : "border-glass-border text-white/60 hover:bg-white/5"
              }`}
            >
              {s === "vse" ? "Vše" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-glass-border p-10 text-center text-sm text-white/40">
          Žádní zaměstnanci neodpovídají zadaným kritériím.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((e) => (
            <EmployeeCard
              key={e.id}
              employee={e}
              employmentTypeName={typeNameById.get(e.employment_type_id) ?? "—"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
