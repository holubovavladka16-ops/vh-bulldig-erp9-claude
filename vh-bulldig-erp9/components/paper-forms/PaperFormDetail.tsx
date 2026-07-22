"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import PaperFormStatusBadge from "./PaperFormStatusBadge";
import PrintFormsButton from "./PrintFormsButton";
import { MONTH_NAMES } from "@/lib/paperForm";
import type { Company, Employee, PaperForm, PaperFormHistoryEntry } from "@/types/database.types";

const HISTORY_LABELS: Record<string, string> = {
  vytvoreni: "Vytvoření formuláře",
  tisk: "Tisk",
  stazeni_pdf: "Stažení PDF",
  prvni_naskenovani: "První naskenování",
  prirazeni: "Přiřazení zaměstnanci",
  zmena_stavu: "Změna stavu",
  odevzdani: "Odevzdání",
  kontrola: "Kontrola",
  uzavreni: "Uzavření",
  zneplatneni: "Zneplatnění",
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-white/5 py-2 last:border-0">
      <span className="text-xs text-white/40">{label}</span>
      <span className="text-right text-sm text-white/85">{value}</span>
    </div>
  );
}

interface Props {
  form: PaperForm;
  employee: Employee | null;
  employmentTypeName: string;
  company: Company | null;
  siteUrl: string;
  history: PaperFormHistoryEntry[];
  canInvalidate: boolean;
  changedByProfileId: string;
  changedByName: string;
  justAssigned?: boolean;
}

export default function PaperFormDetail({
  form: initialForm,
  employee,
  employmentTypeName,
  company,
  siteUrl,
  history,
  canInvalidate,
  changedByProfileId,
  changedByName,
  justAssigned,
}: Props) {
  const supabase = createClient();
  const [form, setForm] = useState(initialForm);
  const [showInvalidate, setShowInvalidate] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleInvalidate() {
    if (!reason.trim()) {
      setError("Zadejte důvod zneplatnění.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("paper_forms")
        .update({
          status: "zneplatneny",
          invalidated_reason: reason.trim(),
          invalidated_at: now,
          invalidated_by: changedByProfileId,
          invalidated_by_name: changedByName,
        } as never)
        .eq("id", form.id);

      if (updateError) {
        setError("Zneplatnění se nezdařilo. Zkuste to prosím znovu.");
        return;
      }

      await supabase.from("paper_form_history").insert({
        form_id: form.id,
        change_type: "zneplatneni",
        changed_by: changedByProfileId,
        changed_by_name: changedByName,
        details: { duvod: reason.trim() },
      } as never);

      setForm((f) => ({
        ...f,
        status: "zneplatneny",
        invalidated_reason: reason.trim(),
        invalidated_at: now,
        invalidated_by_name: changedByName,
      }));
      setShowInvalidate(false);
    } finally {
      setSaving(false);
    }
  }

  const employeesById = employee ? { [employee.id]: employee } : {};
  const employmentTypeNameById = employee ? { [employee.employment_type_id]: employmentTypeName } : {};

  return (
    <div className="flex flex-col gap-6">
      {justAssigned && (
        <p className="rounded-xl bg-turquoise/10 px-4 py-3 text-center text-sm text-turquoise-light">
          Formulář byl úspěšně přiřazen zaměstnanci.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold text-white">{form.form_number}</h1>
        <PaperFormStatusBadge status={form.status} />
      </div>

      <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
        <Row label="Měsíc a rok" value={`${MONTH_NAMES[form.month - 1]} ${form.year}`} />
        <Row label="Datum vytvoření" value={new Date(form.created_at).toLocaleDateString("cs-CZ")} />
        <Row label="Autor" value={form.created_by_name ?? "—"} />
        <Row label="Přiřazený zaměstnanec" value={employee ? `${employee.first_name} ${employee.last_name}` : "Nepřiřazeno"} />
        {form.status === "zneplatneny" && (
          <>
            <Row label="Důvod zneplatnění" value={form.invalidated_reason ?? "—"} />
            <Row label="Zneplatnil" value={form.invalidated_by_name ?? "—"} />
          </>
        )}
      </section>

      <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
          Náhled a tisk
        </h2>
        <PrintFormsButton
          forms={[form]}
          company={company}
          siteUrl={siteUrl}
          employeesById={employeesById}
          employmentTypeNameById={employmentTypeNameById}
          changedByProfileId={changedByProfileId}
          changedByName={changedByName}
        />
        {employee && (
          <p className="mt-2 text-xs text-white/30">
            Formulář je přiřazen zaměstnanci, proto se výše vygeneruje již předvyplněná verze (jméno, pozice,
            pracovní poměr, měsíc, rok, ID a QR kód).
          </p>
        )}
      </section>

      {canInvalidate && form.status !== "zneplatneny" && (
        <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
            Zneplatnění formuláře
          </h2>
          {!showInvalidate ? (
            <button
              type="button"
              onClick={() => setShowInvalidate(true)}
              className="rounded-xl border border-red-400/40 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/10"
            >
              Zneplatnit formulář
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Důvod zneplatnění"
                rows={2}
                className="rounded-xl border border-glass-border bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-turquoise"
              />
              {error && <p className="text-xs text-red-300">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleInvalidate}
                  disabled={saving}
                  className="rounded-xl bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/30 disabled:opacity-50"
                >
                  {saving ? "Ukládám…" : "Potvrdit zneplatnění"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowInvalidate(false)}
                  disabled={saving}
                  className="rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/70 transition hover:bg-white/5"
                >
                  Zrušit
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
          Historie formuláře
        </h2>
        {history.length === 0 ? (
          <p className="text-sm text-white/35">Zatím nejsou žádné záznamy.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {history.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-3 border-b border-white/5 py-2 last:border-0">
                <span className="text-sm text-white/70">{HISTORY_LABELS[h.change_type] ?? h.change_type}</span>
                <span className="text-xs text-white/35">
                  {new Date(h.changed_at).toLocaleString("cs-CZ")}
                  {h.changed_by_name ? ` · ${h.changed_by_name}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
