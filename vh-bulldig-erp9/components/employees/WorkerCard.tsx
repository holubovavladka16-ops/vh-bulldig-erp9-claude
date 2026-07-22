"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import {
  PersonalInfoSection,
  WorkInfoSection,
  PricingSection,
  PendingSection,
  PhotoSection,
  HistorySection,
} from "./WorkerCardSections";
import ShareFormSection from "./ShareFormSection";
import EmployeeDocumentsSection from "@/components/documents/EmployeeDocumentsSection";
import type { Employee, EmployeeHistoryEntry, EmployeeStatus, DocumentV2 } from "@/types/database.types";

interface Props {
  employee: Employee;
  employmentTypeName: string;
  historyEntries: EmployeeHistoryEntry[];
  documents?: DocumentV2[];
  canEdit: boolean;
  canEditPricing: boolean;
  canViewPricing: boolean;
  justRegistered?: boolean;
}

export default function WorkerCard({
  employee: initialEmployee,
  employmentTypeName,
  historyEntries,
  documents,
  canEdit,
  canEditPricing,
  canViewPricing,
  justRegistered,
}: Props) {
  const [employee, setEmployee] = useState(initialEmployee);

  return (
    <div className="flex flex-col gap-6">
      {justRegistered && (
        <p className="rounded-xl bg-turquoise/10 px-4 py-3 text-center text-sm text-turquoise-light">
          Zaměstnanec byl úspěšně zaregistrován.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-white">
          {employee.first_name} {employee.last_name}
        </h1>
        {canEdit && (
          <Link
            href={`/moduly/zamestnanci/${employee.id}/upravit`}
            className="flex items-center gap-2 rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/5"
          >
            <Pencil size={14} />
            Upravit údaje
          </Link>
        )}
      </div>

      {/* 1. Osobní údaje */}
      <PersonalInfoSection employee={employee} />

      {/* 2. Pracovní údaje */}
      <WorkInfoSection
        employee={employee}
        employmentTypeName={employmentTypeName}
        canEdit={canEdit}
        onStatusChanged={(status: EmployeeStatus) => setEmployee((e) => ({ ...e, status }))}
      />

      {/* 3. Individuální ceník */}
      <PricingSection employeeId={employee.id} canEdit={canEditPricing} canView={canViewPricing} />

      {/* 4. Docházka */}
      <PendingSection
        title="Docházka"
        note="Docházka se automaticky zobrazí po vytvoření modulu Docházka."
      />

      {/* 5. Pracovní výkazy */}
      <PendingSection
        title="Pracovní výkazy"
        note="Výkazy se automaticky zobrazí po vytvoření modulu Výkazy."
      />

      {/* 6. Zakázky */}
      <PendingSection
        title="Zakázky"
        note="Přiřazené zakázky se automaticky zobrazí po vytvoření modulu Zakázky."
      />

      {/* 7. Výdělek */}
      <PendingSection
        title="Výdělek"
        note="Celkový výdělek se automaticky vypočítá z Docházky, Výkazů a individuálního ceníku."
      />

      {/* 8. Zálohy */}
      <PendingSection
        title="Zálohy"
        note="Zálohy se automaticky zobrazí po vytvoření souvisejících modulů."
      />

      {/* 9. Doplatek */}
      <PendingSection
        title="Doplatek"
        note="Doplatek se automaticky vypočítá po vytvoření souvisejících modulů."
      />

      {/* 10. Výplatní pásky */}
      <PendingSection
        title="Výplatní pásky"
        note="Výplatní pásky se zobrazí po vytvoření modulu PDF dokumenty a výplatní pásky."
      />

      {/* 11. Dokumenty */}
      <EmployeeDocumentsSection documents={documents ?? []} />

      {/* 12. Fotografie */}
      <PhotoSection photoUrl={employee.photo_url} />

      {/* 13. Historie změn */}
      <HistorySection entries={historyEntries} />

      {/* 14. Sdílený formulář zaměstnance */}
      <ShareFormSection shareToken={employee.share_token} employeeName={`${employee.first_name} ${employee.last_name}`} />
    </div>
  );
}
