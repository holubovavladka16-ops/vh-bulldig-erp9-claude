"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import EmployeeForm from "@/components/employees/EmployeeForm";
import type { Employee, EmploymentType } from "@/types/database.types";

interface Props {
  formId: string;
  companyId: string;
  employmentTypes: EmploymentType[];
  changedByProfileId: string;
  changedByName: string;
}

export default function ScanRegistrationForm({
  formId,
  companyId,
  employmentTypes,
  changedByProfileId,
  changedByName,
}: Props) {
  const supabase = createClient();
  const router = useRouter();

  async function handleEmployeeCreated(employee: Employee) {
    const now = new Date().toISOString();

    await supabase
      .from("paper_forms")
      .update({
        employee_id: employee.id,
        status: "prirazeny",
        assigned_at: now,
        assigned_by: changedByProfileId,
        assigned_by_name: changedByName,
      } as never)
      .eq("id", formId);

    await supabase.from("paper_form_history").insert({
      form_id: formId,
      change_type: "prirazeni",
      changed_by: changedByProfileId,
      changed_by_name: changedByName,
      details: { employee_id: employee.id },
    } as never);

    router.push(`/moduly/papirovy-formular/${formId}?prirazeno=1`);
    router.refresh();
  }

  return (
    <EmployeeForm
      companyId={companyId}
      employmentTypes={employmentTypes}
      changedByProfileId={changedByProfileId}
      changedByName={changedByName}
      onEmployeeCreated={handleEmployeeCreated}
    />
  );
}
