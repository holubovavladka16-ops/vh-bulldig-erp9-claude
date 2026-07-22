import { notFound } from "next/navigation";
import CompanyLogo from "@/components/CompanyLogo";
import StatusBadge from "@/components/employees/StatusBadge";
import { createClient } from "@/lib/supabase/server";
import type { SharedEmployeeView, PaymentMethod } from "@/types/database.types";

export const metadata = {
  title: "Zaměstnanecký formulář | VH Bulldig ERP 9",
};

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  hotove: "Hotově",
  bankovni_ucet: "Bankovní účet",
};

function fmt(date: string | null) {
  return date ? new Date(date).toLocaleDateString("cs-CZ") : "—";
}

export default async function SharedEmployeeFormPage({ params }: { params: { token: string } }) {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_employee_by_share_token", {
    p_token: params.token,
  } as never);

  const employee = (Array.isArray(data) ? data[0] : data) as unknown as SharedEmployeeView | null;

  if (error || !employee) {
    notFound();
  }

  const e = employee!;

  return (
    <main className="flex min-h-dvh justify-center bg-base-950 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <CompanyLogo logoUrl={e.company_logo_url} />
          <p className="text-sm text-white/50">{e.company_name}</p>
        </div>

        <div className="flex flex-col gap-4">
          <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="font-display text-lg font-semibold text-white">
                  {e.first_name} {e.last_name}
                </h1>
                <p className="text-sm text-white/50">{e.position}</p>
              </div>
              <StatusBadge status={e.status} />
            </div>
          </section>

          <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
            <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
              Pracovní údaje
            </h2>
            <Row label="Pracovní pozice" value={e.position} />
            <Row label="Datum nástupu" value={fmt(e.start_date)} />
            <Row label="Pracovní poměr" value={e.employment_type_name} />
            <Row label="Způsob platby" value={PAYMENT_LABELS[e.payment_method]} />
            <Row label="Datum ukončení pracovního poměru" value={fmt(e.end_date)} />
          </section>

          <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
            <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
              Kontaktní údaje
            </h2>
            <Row label="Telefon" value={e.phone} />
            <Row label="E-mail" value={e.email} />
            <Row label="Poznámka" value={e.note} />
          </section>

          {["Individuální ceník", "Docházka", "Pracovní výkazy", "Výdělek", "Zálohy", "Doplatek", "Výplatní pásky"].map(
            (title) => (
              <section key={title} className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
                <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
                  {title}
                </h2>
                <p className="text-sm text-white/35">
                  Tato sekce bude dostupná po vytvoření souvisejícího modulu.
                </p>
              </section>
            )
          )}
        </div>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-white/5 py-2 last:border-0">
      <span className="text-xs text-white/40">{label}</span>
      <span className="text-right text-sm text-white/85">{value || "—"}</span>
    </div>
  );
}
