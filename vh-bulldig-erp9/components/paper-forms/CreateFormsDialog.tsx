"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MONTH_NAMES } from "@/lib/paperForm";

interface Props {
  companyId: string;
  existingCount: number;
  changedByProfileId: string;
  changedByName: string;
  onClose: () => void;
}

const inputClass =
  "w-full rounded-xl border border-glass-border bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-turquoise";

export default function CreateFormsDialog({ companyId, existingCount, changedByProfileId, changedByName, onClose }: Props) {
  const supabase = createClient();
  const router = useRouter();

  const now = new Date();
  const [count, setCount] = useState(1);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    setError(null);
    if (!Number.isInteger(count) || count <= 0) {
      setError("Počet formulářů musí být kladné celé číslo.");
      return;
    }

    setSaving(true);
    try {
      const yearShort = String(year);
      const rows = Array.from({ length: count }).map((_, i) => {
        const seq = existingCount + i + 1;
        return {
          company_id: companyId,
          form_number: `MPV-${yearShort}-${String(seq).padStart(4, "0")}`,
          month,
          year,
          status: "vytvoreny",
          created_by: changedByProfileId,
          created_by_name: changedByName,
        };
      });

      const { data, error: insertError } = await supabase.from("paper_forms").insert(rows as never).select();

      if (insertError || !data) {
        setError("Vytvoření formulářů se nezdařilo. Zkuste to prosím znovu.");
        return;
      }

      const created = data as unknown as { id: string }[];
      await supabase.from("paper_form_history").insert(
        created.map((f) => ({
          form_id: f.id,
          change_type: "vytvoreni",
          changed_by: changedByProfileId,
          changed_by_name: changedByName,
        })) as never
      );

      router.refresh();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-glass-border bg-base-900 p-6 shadow-2xl">
        <h2 className="mb-4 font-display text-lg font-semibold text-white">Vytvořit formuláře</h2>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-white/60">Počet formulářů</span>
            <input
              type="number"
              min={1}
              step={1}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-white/60">Měsíc</span>
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className={inputClass}>
              {MONTH_NAMES.map((m, i) => (
                <option key={m} value={i + 1} className="bg-base-900">{m}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-white/60">Rok</span>
            <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className={inputClass} />
          </label>
        </div>

        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={handleCreate}
            disabled={saving}
            className="rounded-xl bg-gradient-to-r from-gold to-gold-light px-4 py-2 text-sm font-semibold text-base-950 transition hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Vytvářím…" : "Vytvořit"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/70 transition hover:bg-white/5"
          >
            Zrušit
          </button>
        </div>
      </div>
    </div>
  );
}
