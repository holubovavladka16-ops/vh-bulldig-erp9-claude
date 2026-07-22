"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { EmploymentType } from "@/types/database.types";

interface Props {
  companyId: string;
  initialTypes: EmploymentType[];
  canManage: boolean;
}

export default function EmploymentTypeManager({ companyId, initialTypes, canManage }: Props) {
  const supabase = createClient();
  const [types, setTypes] = useState(initialTypes);
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  async function addType(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("employment_types")
      .insert({ company_id: companyId, name: newName.trim() } as never)
      .select()
      .single();
    setSaving(false);
    if (!error && data) {
      setTypes((t) => [...t, data as unknown as EmploymentType]);
      setNewName("");
    }
  }

  async function toggleActive(type: EmploymentType) {
    const { error } = await supabase
      .from("employment_types")
      .update({ is_active: !type.is_active } as never)
      .eq("id", type.id);
    if (!error) {
      setTypes((ts) => ts.map((t) => (t.id === type.id ? { ...t, is_active: !t.is_active } : t)));
    }
  }

  if (!canManage) return null;

  return (
    <div className="rounded-2xl border border-glass-border bg-glass-fill p-4 shadow-lg backdrop-blur-xs">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-sm font-medium text-turquoise-light hover:underline"
      >
        {open ? "Skrýt správu typů pracovního poměru" : "Spravovat typy pracovního poměru"}
      </button>

      {open && (
        <div className="mt-4 flex flex-col gap-3">
          <ul className="flex flex-wrap gap-2">
            {types.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => toggleActive(t)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    t.is_active
                      ? "bg-turquoise/10 text-turquoise-light"
                      : "bg-white/5 text-white/30 line-through"
                  }`}
                  title={t.is_active ? "Kliknutím deaktivovat" : "Kliknutím aktivovat"}
                >
                  {t.name}
                </button>
              </li>
            ))}
          </ul>

          <form onSubmit={addType} className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nový typ pracovního poměru"
              className="flex-1 rounded-xl border border-glass-border bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-turquoise"
            />
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1 rounded-xl border border-glass-border px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/5 disabled:opacity-50"
            >
              <Plus size={14} />
              Přidat
            </button>
          </form>
          <p className="text-xs text-white/35">
            Deaktivované typy zůstávají u starých zaměstnanců, ale nenabízí se
            při registraci nového zaměstnance.
          </p>
        </div>
      )}
    </div>
  );
}
