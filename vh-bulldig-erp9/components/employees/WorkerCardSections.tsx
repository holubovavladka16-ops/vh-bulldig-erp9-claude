"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import StatusBadge from "./StatusBadge";
import type { Employee, EmployeeStatus, PaymentMethod } from "@/types/database.types";

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  hotove: "Hotově",
  bankovni_ucet: "Bankovní účet",
};

const STATUS_OPTIONS: { value: EmployeeStatus; label: string }[] = [
  { value: "aktivni", label: "Aktivní" },
  { value: "neaktivni", label: "Neaktivní" },
  { value: "ukonceny", label: "Ukončený pracovní poměr" },
  { value: "pozastaveny", label: "Dočasně pozastavený" },
];

function fmt(date: string | null) {
  return date ? new Date(date).toLocaleDateString("cs-CZ") : "—";
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-white/5 py-2 last:border-0">
      <span className="text-xs text-white/40">{label}</span>
      <span className="text-right text-sm text-white/85">{value || "—"}</span>
    </div>
  );
}

function CardSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
      <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function PersonalInfoSection({ employee }: { employee: Employee }) {
  return (
    <CardSection title="Osobní údaje">
      <Row label="Jméno a příjmení" value={`${employee.first_name} ${employee.last_name}`} />
      <Row label="Datum narození" value={fmt(employee.birth_date)} />
      <Row label="Rodné číslo" value={employee.birth_number} />
      <Row label="Adresa" value={employee.address} />
      <Row label="Číslo občanského průkazu" value={employee.id_card_number} />
      <Row label="Telefon" value={employee.phone} />
      <Row label="E-mail" value={employee.email} />
      <Row label="Bankovní účet" value={employee.bank_account} />
      <Row label="Poznámka" value={employee.note} />
    </CardSection>
  );
}

export function WorkInfoSection({
  employee,
  employmentTypeName,
  canEdit,
  onStatusChanged,
}: {
  employee: Employee;
  employmentTypeName: string;
  canEdit: boolean;
  onStatusChanged: (status: EmployeeStatus) => void;
}) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);

  async function changeStatus(status: EmployeeStatus) {
    if (status === employee.status) return;
    setSaving(true);
    const { error } = await supabase
      .from("employees")
      .update({ status } as never)
      .eq("id", employee.id);

    if (!error) {
      await supabase.from("employee_history").insert({
        employee_id: employee.id,
        change_type: "zmena_stavu",
        details: { from: employee.status, to: status },
      } as never);
      onStatusChanged(status);
    }
    setSaving(false);
  }

  return (
    <CardSection title="Pracovní údaje">
      <Row label="Pracovní pozice" value={employee.position} />
      <Row label="Datum nástupu" value={fmt(employee.start_date)} />
      <Row label="Pracovní poměr" value={employmentTypeName} />
      <Row label="Způsob platby" value={PAYMENT_LABELS[employee.payment_method]} />
      <Row label="Datum ukončení pracovního poměru" value={fmt(employee.end_date)} />

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs text-white/40">Stav zaměstnance</span>
        <StatusBadge status={employee.status} />
      </div>

      {canEdit && (
        <div className="mt-3 flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={saving || opt.value === employee.status}
              onClick={() => changeStatus(opt.value)}
              className="rounded-xl border border-glass-border px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/5 disabled:opacity-30"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </CardSection>
  );
}

export function PhotoSection({ photoUrl }: { photoUrl: string | null }) {
  return (
    <CardSection title="Fotografie">
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="Fotografie zaměstnance" className="h-40 w-40 rounded-xl object-cover" />
      ) : (
        <p className="text-sm text-white/35">Zaměstnanec nemá nahranou fotografii.</p>
      )}
      <p className="mt-3 text-xs text-white/30">
        Další fotografie ze stavby budou dostupné po vytvoření modulu
        Fotodokumentace s GPS.
      </p>
    </CardSection>
  );
}

export function PricingSection({
  employeeId,
  canEdit,
  canView,
}: {
  employeeId: string;
  canEdit: boolean;
  canView: boolean;
}) {
  return (
    <CardSection title="Individuální ceník">
      {canView ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-white/40">
            {canEdit
              ? "Zde můžete spravovat ceníkové položky tohoto zaměstnance."
              : "Zobrazení ceníku (bez možnosti úpravy)."}
          </p>
          <a
            href={`/moduly/individualni-cenik/${employeeId}`}
            className="inline-block self-start rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/5"
          >
            Otevřít ceník
          </a>
        </div>
      ) : (
        <p className="text-sm text-white/35">Nemáte oprávnění zobrazit tuto sekci.</p>
      )}
    </CardSection>
  );
}

export function PendingSection({ title, note }: { title: string; note: string }) {
  return (
    <CardSection title={title}>
      <p className="text-sm text-white/40">{note}</p>
    </CardSection>
  );
}

export function HistorySection({
  entries,
}: {
  entries: { id: string; change_type: string; changed_by_name: string | null; changed_at: string }[];
}) {
  const LABELS: Record<string, string> = {
    vytvoreni: "Vytvoření zaměstnance",
    osobni_udaje: "Změna osobních údajů",
    pracovni_udaje: "Změna pracovních údajů",
    zmena_stavu: "Změna stavu",
  };

  return (
    <CardSection title="Historie změn">
      {entries.length === 0 ? (
        <p className="text-sm text-white/35">Zatím nejsou žádné záznamy.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {entries.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 border-b border-white/5 py-2 last:border-0">
              <span className="text-sm text-white/70">{LABELS[e.change_type] ?? e.change_type}</span>
              <span className="text-xs text-white/35">
                {new Date(e.changed_at).toLocaleString("cs-CZ")}
                {e.changed_by_name ? ` · ${e.changed_by_name}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </CardSection>
  );
}
