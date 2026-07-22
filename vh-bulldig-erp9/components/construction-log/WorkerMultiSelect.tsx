"use client";

import type { Employee } from "@/types/database.types";

interface Props {
  employees: Employee[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  readOnly?: boolean;
}

export default function WorkerMultiSelect({ employees, selectedIds, onChange, readOnly }: Props) {
  function toggle(id: string) {
    if (readOnly) return;
    onChange(selectedIds.includes(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id]);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {employees.map((e) => {
        const selected = selectedIds.includes(e.id);
        return (
          <button
            key={e.id}
            type="button"
            disabled={readOnly}
            onClick={() => toggle(e.id)}
            className={`rounded-xl border px-3 py-2 text-xs font-medium transition disabled:opacity-60 ${
              selected
                ? "border-turquoise bg-turquoise/10 text-turquoise-light"
                : "border-glass-border text-white/60 hover:bg-white/5"
            }`}
          >
            {e.first_name} {e.last_name}
          </button>
        );
      })}
      {employees.length === 0 && <p className="text-sm text-white/35">Žádní aktivní zaměstnanci.</p>}
    </div>
  );
}
