"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import CheckResultBadge from "./CheckResultBadge";
import DayComparisonCard from "./DayComparisonCard";
import ConnectionPdfShareButtons from "@/components/connections/ConnectionPdfShareButtons";
import CheckProtocolPdf from "./pdf/CheckProtocolPdf";
import { getSignedCheckFileUrl } from "@/lib/checkPhotoStorage";
import { MONTH_NAMES } from "@/lib/paperForm";
import type { ComparisonResult } from "@/lib/paperFormComparison";
import type {
  Company,
  Employee,
  PaperForm,
  PaperFormCheck,
  PaperFormCheckHistoryEntry,
  PaperFormCheckPhoto,
} from "@/types/database.types";

const HISTORY_LABELS: Record<string, string> = {
  naskenovani_qr: "Naskenování QR kódu",
  nahrani_fotografie: "Nahrání fotografie / souboru",
  kontrola_kvality: "Kontrola kvality obrazu",
  rozpoznani_udaju: "Rozpoznání údajů",
  rucni_oprava: "Ruční oprava rozpoznaných údajů",
  spusteni_porovnani: "Spuštění porovnání",
  potvrzeni: "Potvrzení kontroly",
  vraceni_k_doreseni: "Vrácení k dořešení",
  uzavreni: "Uzavření formuláře",
};

interface Props {
  check: PaperFormCheck;
  form: PaperForm;
  employee: Employee;
  photos: PaperFormCheckPhoto[];
  history: PaperFormCheckHistoryEntry[];
  company: Company | null;
  reviewerName: string;
  canClose: boolean;
  changedByProfileId: string;
  changedByName: string;
}

export default function CheckDetail({
  check: initialCheck,
  form,
  employee,
  photos,
  history,
  company,
  reviewerName,
  canClose,
  changedByProfileId,
  changedByName,
}: Props) {
  const supabase = createClient();
  const [check, setCheck] = useState(initialCheck);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    async function loadUrls() {
      const entries = await Promise.all(
        photos.map(async (p) => [p.id, await getSignedCheckFileUrl(supabase, p.file_path)] as const)
      );
      setSignedUrls(Object.fromEntries(entries.filter(([, url]) => url) as [string, string][]));
    }
    loadUrls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos]);

  async function handleClose() {
    setClosing(true);
    try {
      const now = new Date().toISOString();
      await supabase
        .from("paper_form_checks")
        .update({ status: "uzavreno", closed_at: now, closed_by: changedByProfileId, closed_by_name: changedByName } as never)
        .eq("id", check.id);

      await supabase.from("paper_forms").update({ status: "uzavreny" } as never).eq("id", form.id);

      await supabase.from("paper_form_check_history").insert({
        check_id: check.id,
        change_type: "uzavreni",
        changed_by: changedByProfileId,
        changed_by_name: changedByName,
      } as never);

      setCheck((c) => ({ ...c, status: "uzavreno", closed_at: now, closed_by_name: changedByName }));
    } finally {
      setClosing(false);
    }
  }

  const comparison = check.comparison_result as unknown as ComparisonResult | undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-white">{form.form_number}</h1>
          <p className="text-sm text-white/50">
            {employee.first_name} {employee.last_name} · {MONTH_NAMES[check.month - 1]} {check.year}
          </p>
        </div>
        {check.overall_result && <CheckResultBadge result={check.overall_result} />}
      </div>

      {photos.length > 0 && (
        <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
            Fotografie / sken formuláře
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {photos.map((p) =>
              signedUrls[p.id] ? (
                p.file_type === "application/pdf" ? (
                  <a key={p.id} href={signedUrls[p.id]} target="_blank" rel="noopener noreferrer" className="flex h-24 items-center justify-center rounded-lg border border-glass-border text-xs text-turquoise-light underline">
                    Otevřít PDF
                  </a>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={p.id} src={signedUrls[p.id]} alt="Fotografie formuláře" className="h-24 w-full rounded-lg object-cover" />
                )
              ) : (
                <div key={p.id} className="flex h-24 items-center justify-center rounded-lg border border-glass-border text-xs text-white/30">
                  Načítám…
                </div>
              )
            )}
          </div>
          <p className="mt-2 text-xs text-white/30">
            Odkazy na fotografie jsou časově omezené (nejsou veřejné).
          </p>
        </section>
      )}

      {comparison && (
        <>
          <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
            <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-white/50">Podpisy</h2>
            <p className="text-sm text-white/70">
              Zaměstnanec:{" "}
              {comparison.signatures.zamestnanec === "uveden" ? "Podpis je uveden" : comparison.signatures.zamestnanec === "chybi" ? "Podpis chybí" : "Nelze rozpoznat"}
            </p>
            <p className="text-sm text-white/70">
              Vedoucí:{" "}
              {comparison.signatures.vedouci === "uveden" ? "Podpis je uveden" : comparison.signatures.vedouci === "chybi" ? "Podpis chybí" : "Nelze rozpoznat"}
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
              Porovnání po dnech
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {comparison.days.map((d) => (
                <DayComparisonCard key={d.day} day={d} />
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
            <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
              Protokol o kontrole
            </h2>
            <ConnectionPdfShareButtons
              document={
                <CheckProtocolPdf
                  company={company}
                  check={check}
                  formNumber={form.form_number}
                  employeeName={`${employee.first_name} ${employee.last_name}`}
                  reviewerName={reviewerName}
                  comparison={comparison}
                />
              }
              fileName={`protokol-kontroly-${form.form_number}.pdf`}
            />
          </section>
        </>
      )}

      {check.reviewer_note && (
        <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
          <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-white/50">Poznámka</h2>
          <p className="text-sm text-white/70">{check.reviewer_note}</p>
        </section>
      )}

      {check.status === "potvrzeno" && canClose && (
        <button
          type="button"
          onClick={handleClose}
          disabled={closing}
          className="self-start rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/5 disabled:opacity-50"
        >
          {closing ? "Uzavírám…" : "Uzavřít formulář"}
        </button>
      )}

      <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
          Historie kontroly
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
