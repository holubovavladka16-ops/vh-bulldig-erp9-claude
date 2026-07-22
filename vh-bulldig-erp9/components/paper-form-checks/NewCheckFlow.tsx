"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QrCode, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import QrScanner from "./QrScanner";
import PhotoCaptureStep, { type CapturedFile } from "./PhotoCaptureStep";
import RecognizedDataForm from "./RecognizedDataForm";
import DayComparisonCard from "./DayComparisonCard";
import CheckResultBadge from "./CheckResultBadge";
import { uploadCheckFile } from "@/lib/checkPhotoStorage";
import { daysInMonth, MONTH_NAMES } from "@/lib/paperForm";
import { buildErpDays, compareForm, type ComparisonResult, type RecognizedData } from "@/lib/paperFormComparison";
import { categorizeWorkItems } from "@/lib/reports";
import type { AttendanceRecord, AttendanceWorkItem, Employee, Order, PaperForm } from "@/types/database.types";

interface Props {
  companyId: string;
  reviewerProfileId: string;
  reviewerName: string;
  canWrite: boolean;
}

type Step = "find" | "blocked" | "photos" | "recognize" | "compare" | "done";

function emptyRecognizedData(form: PaperForm, employeeName: string): RecognizedData {
  const total = daysInMonth(form.month, form.year);
  return {
    formNumber: form.form_number,
    employeeName,
    month: form.month,
    year: form.year,
    days: Array.from({ length: total }, (_, i) => ({
      day: i + 1,
      nelzePrecist: false,
      zakazka: "",
      od: "",
      do: "",
      hodin: "",
      vykop: "",
      pruraz: "",
      zaloha: "",
      podpis: false,
    })),
    summary: { dny: "", hodin: "", vykop: "", pruraz: "", zaloha: "" },
    signatures: { zamestnanec: "nelze_rozpoznat", vedouci: "nelze_rozpoznat" },
  };
}

export default function NewCheckFlow({ companyId, reviewerProfileId, reviewerName, canWrite }: Props) {
  const supabase = createClient();
  const router = useRouter();

  const [step, setStep] = useState<Step>("find");
  const [searchId, setSearchId] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [findError, setFindError] = useState<string | null>(null);

  const [form, setForm] = useState<PaperForm | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [files, setFiles] = useState<CapturedFile[]>([]);
  const [recognized, setRecognized] = useState<RecognizedData | null>(null);
  const [previousRecognized, setPreviousRecognized] = useState<RecognizedData | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [checkId, setCheckId] = useState<string | null>(null);

  const [reviewerNote, setReviewerNote] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [showReturnBox, setShowReturnBox] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);

  async function loadFormByToken(token: string) {
    setFindError(null);
    const { data } = await supabase.from("paper_forms").select("*").eq("share_token", token).maybeSingle();
    const f = data as unknown as PaperForm | null;

    if (!f) {
      setFindError("QR kód formuláře není platný.");
      return;
    }
    await proceedWithForm(f);
  }

  async function loadFormById() {
    setFindError(null);
    const { data } = await supabase
      .from("paper_forms")
      .select("*")
      .eq("company_id", companyId)
      .eq("form_number", searchId.trim())
      .maybeSingle();
    const f = data as unknown as PaperForm | null;

    if (!f) {
      setFindError("Formulář s tímto ID nebyl nalezen.");
      return;
    }
    await proceedWithForm(f);
  }

  async function proceedWithForm(f: PaperForm) {
    if (f.status === "zneplatneny") {
      setForm(f);
      setStep("blocked");
      return;
    }
    if (!f.employee_id) {
      setFindError("Formulář zatím není přiřazen zaměstnanci.");
      return;
    }
    if (!["prirazeny", "odevzdany"].includes(f.status)) {
      setForm(f);
      setStep("blocked");
      return;
    }

    const { data: empData } = await supabase.from("employees").select("*").eq("id", f.employee_id).maybeSingle();
    const emp = empData as unknown as Employee | null;

    setForm(f);
    setEmployee(emp);
    setRecognized(emptyRecognizedData(f, emp ? `${emp.first_name} ${emp.last_name}` : ""));
    setStep("photos");
  }

  async function handleContinueToRecognize() {
    if (!form) return;
    setSaving(true);
    try {
      // Vytvoř záznam kontroly hned na začátku, aby fotky/historie
      // měly kam se ukládat postupně.
      const { data, error: insertError } = await supabase
        .from("paper_form_checks")
        .insert({
          company_id: companyId,
          form_id: form.id,
          employee_id: form.employee_id,
          month: form.month,
          year: form.year,
          created_by: reviewerProfileId,
          created_by_name: reviewerName,
        } as never)
        .select()
        .single();

      if (insertError || !data) {
        setError("Vytvoření kontroly se nezdařilo. Zkuste to prosím znovu.");
        return;
      }

      const newCheckId = (data as unknown as { id: string }).id;
      setCheckId(newCheckId);

      await supabase.from("paper_form_check_history").insert({
        check_id: newCheckId,
        change_type: "naskenovani_qr",
        changed_by: reviewerProfileId,
        changed_by_name: reviewerName,
      } as never);

      for (const f of files) {
        const uploaded = await uploadCheckFile(supabase, companyId, newCheckId, f.file);
        await supabase.from("paper_form_check_photos").insert({
          check_id: newCheckId,
          file_path: uploaded.path,
          file_type: uploaded.fileType,
        } as never);
      }

      await supabase.from("paper_form_check_history").insert({
        check_id: newCheckId,
        change_type: "nahrani_fotografie",
        changed_by: reviewerProfileId,
        changed_by_name: reviewerName,
        details: { pocet_souboru: files.length },
      } as never);

      const anyLowQuality = files.some((f) => f.quality && !f.quality.ok);
      await supabase
        .from("paper_form_checks")
        .update({ image_quality_ok: !anyLowQuality } as never)
        .eq("id", newCheckId);

      await supabase.from("paper_form_check_history").insert({
        check_id: newCheckId,
        change_type: "kontrola_kvality",
        changed_by: reviewerProfileId,
        changed_by_name: reviewerName,
        details: { ok: !anyLowQuality },
      } as never);

      setStep("recognize");
    } finally {
      setSaving(false);
    }
  }

  async function handleRunComparison() {
    if (!form || !employee || !recognized || !checkId) return;
    setSaving(true);
    setError(null);
    try {
      // Audit ručních oprav - porovnání s předchozím stavem (bod10).
      if (previousRecognized) {
        const corrections: { field: string; from: unknown; to: unknown }[] = [];
        recognized.days.forEach((d, i) => {
          const prev = previousRecognized.days[i];
          (Object.keys(d) as (keyof typeof d)[]).forEach((k) => {
            if (prev && d[k] !== prev[k]) {
              corrections.push({ field: `den_${d.day}_${k}`, from: prev[k], to: d[k] });
            }
          });
        });
        if (corrections.length > 0) {
          await supabase.from("paper_form_check_history").insert({
            check_id: checkId,
            change_type: "rucni_oprava",
            changed_by: reviewerProfileId,
            changed_by_name: reviewerName,
            details: { corrections },
          } as never);
        }
      } else {
        await supabase.from("paper_form_check_history").insert({
          check_id: checkId,
          change_type: "rozpoznani_udaju",
          changed_by: reviewerProfileId,
          changed_by_name: reviewerName,
        } as never);
      }

      const total = daysInMonth(form.month, form.year);
      const monthStr = String(form.month).padStart(2, "0");
      const from = `${form.year}-${monthStr}-01`;
      const to = `${form.year}-${monthStr}-${String(total).padStart(2, "0")}`;

      const [{ data: recordsData }, { data: ordersData }] = await Promise.all([
        supabase.from("attendance_records").select("*").eq("employee_id", employee.id).gte("record_date", from).lte("record_date", to),
        supabase.from("orders").select("*").eq("company_id", companyId),
      ]);

      const records = (recordsData ?? []) as unknown as AttendanceRecord[];
      const orders = (ordersData ?? []) as unknown as Order[];
      const orderNameById = Object.fromEntries(orders.map((o) => [o.id, o.name]));

      const approvedIds = records.filter((r) => r.status === "schvaleny").map((r) => r.id);
      const { data: itemsData } = await supabase
        .from("attendance_work_items")
        .select("*")
        .in("attendance_record_id", approvedIds.length ? approvedIds : ["-"]);
      const items = (itemsData ?? []) as unknown as AttendanceWorkItem[];
      const itemsByRecordId = items.reduce((acc: Record<string, AttendanceWorkItem[]>, i) => {
        (acc[i.attendance_record_id] ??= []).push(i);
        return acc;
      }, {});

      const erpDays = buildErpDays(records, itemsByRecordId, total);
      const orderNameByDay: Record<number, string> = {};
      records.filter((r) => r.status === "schvaleny").forEach((r) => {
        const day = Number(r.record_date.slice(8, 10));
        orderNameByDay[day] = orderNameById[r.order_id] ?? "";
      });

      const approvedRecords = records.filter((r) => r.status === "schvaleny");
      const allItems = approvedRecords.flatMap((r) => itemsByRecordId[r.id] ?? []);
      const totals = categorizeWorkItems(allItems);
      const erpSummary = {
        dny: approvedRecords.length,
        hodin: totals.hoursWorked,
        vykop: totals.manualDigBm,
        pruraz: totals.breakthroughsKs,
        zaloha: approvedRecords.reduce((s, r) => s + Number(r.daily_advance), 0),
      };

      const result = compareForm(recognized, erpDays, orderNameByDay, erpSummary);
      setComparison(result);
      setPreviousRecognized(recognized);

      await supabase
        .from("paper_form_checks")
        .update({
          recognized_data: recognized as never,
          comparison_result: result as never,
          overall_result: result.overallResult,
        } as never)
        .eq("id", checkId);

      await supabase.from("paper_form_check_history").insert({
        check_id: checkId,
        change_type: "spusteni_porovnani",
        changed_by: reviewerProfileId,
        changed_by_name: reviewerName,
        details: { vysledek: result.overallResult },
      } as never);

      setStep("compare");
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirm() {
    if (!checkId || !form) return;
    setSaving(true);
    try {
      await supabase
        .from("paper_form_checks")
        .update({ status: "potvrzeno", reviewer_note: reviewerNote.trim() || null } as never)
        .eq("id", checkId);

      await supabase.from("paper_forms").update({ status: "zkontrolovany" } as never).eq("id", form.id);

      await supabase.from("paper_form_check_history").insert({
        check_id: checkId,
        change_type: "potvrzeni",
        changed_by: reviewerProfileId,
        changed_by_name: reviewerName,
      } as never);

      setDoneMessage("Kontrola papírového formuláře byla uložena.");
      setStep("done");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleReturn() {
    if (!checkId || !returnReason.trim()) {
      setError("Zadejte důvod vrácení.");
      return;
    }
    setSaving(true);
    try {
      const now = new Date().toISOString();
      await supabase
        .from("paper_form_checks")
        .update({
          status: "vraceno_k_doreseni",
          return_reason: returnReason.trim(),
          returned_at: now,
          returned_by: reviewerProfileId,
          returned_by_name: reviewerName,
        } as never)
        .eq("id", checkId);

      await supabase.from("paper_form_check_history").insert({
        check_id: checkId,
        change_type: "vraceni_k_doreseni",
        changed_by: reviewerProfileId,
        changed_by_name: reviewerName,
        details: { duvod: returnReason.trim() },
      } as never);

      setDoneMessage("Formulář byl vrácen k dořešení.");
      setStep("done");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkIllegible() {
    if (!checkId) return;
    setSaving(true);
    try {
      await supabase.from("paper_form_checks").update({ status: "potvrzeno", overall_result: "nelze_precist" } as never).eq("id", checkId);

      await supabase.from("paper_form_check_history").insert({
        check_id: checkId,
        change_type: "potvrzeni",
        changed_by: reviewerProfileId,
        changed_by_name: reviewerName,
        details: { vysledek: "nelze_precist" },
      } as never);

      setDoneMessage("Formulář byl označen jako nečitelný.");
      setStep("done");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (!canWrite) {
    return (
      <p className="rounded-xl bg-red-500/10 px-4 py-3 text-center text-sm text-red-300">
        Nemáte oprávnění provádět kontrolu papírového formuláře.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {step === "find" && (
        <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
          <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
            Načtení formuláře
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-gold-light px-4 py-2.5 text-sm font-semibold text-base-950 transition hover:opacity-90"
            >
              <QrCode size={16} />
              Naskenovat QR kód
            </button>
          </div>

          <div className="mt-4 flex gap-2">
            <input
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="nebo zadejte ID formuláře…"
              className="flex-1 rounded-xl border border-glass-border bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-turquoise"
            />
            <button
              type="button"
              onClick={loadFormById}
              className="flex items-center gap-2 rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/5"
            >
              <Search size={14} />
              Najít
            </button>
          </div>

          {findError && <p className="mt-3 text-sm text-red-300">{findError}</p>}
        </section>
      )}

      {showScanner && (
        <QrScanner
          onDetected={(token) => {
            setShowScanner(false);
            loadFormByToken(token);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

      {step === "blocked" && form && (
        <p className="rounded-xl bg-red-500/10 px-4 py-3 text-center text-sm text-red-300">
          {form.status === "zneplatneny"
            ? "Tento formulář byl zneplatněn a nelze jej zkontrolovat."
            : "Tento formulář nelze v tomto stavu zkontrolovat."}
        </p>
      )}

      {form && employee && step !== "find" && step !== "blocked" && (
        <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
          <p className="text-sm text-white/70">
            {form.form_number} · {employee.first_name} {employee.last_name} · {MONTH_NAMES[form.month - 1]} {form.year}
          </p>
        </section>
      )}

      {step === "photos" && (
        <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
          <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
            Fotografie nebo sken formuláře
          </h2>
          <PhotoCaptureStep files={files} onChange={setFiles} />
          <button
            type="button"
            onClick={handleContinueToRecognize}
            disabled={saving || files.length === 0}
            className="mt-4 rounded-xl bg-gradient-to-r from-gold to-gold-light px-6 py-2.5 text-sm font-semibold text-base-950 transition hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Ukládám…" : "Pokračovat k rozpoznaným údajům"}
          </button>
        </section>
      )}

      {step === "recognize" && recognized && (
        <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
          <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
            Rozpoznané údaje z formuláře
          </h2>
          <p className="mb-4 text-xs text-white/40">
            Přepište prosím údaje z fotografie formuláře. Tyto hodnoty se poté porovnají s ERP.
          </p>
          <RecognizedDataForm data={recognized} onChange={setRecognized} />
          {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
          <button
            type="button"
            onClick={handleRunComparison}
            disabled={saving}
            className="mt-4 rounded-xl bg-gradient-to-r from-gold to-gold-light px-6 py-2.5 text-sm font-semibold text-base-950 transition hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Porovnávám…" : "Spustit porovnání"}
          </button>
        </section>
      )}

      {step === "compare" && comparison && (
        <>
          <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-white/50">
                Celkový výsledek
              </h2>
              <CheckResultBadge result={comparison.overallResult} />
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <p className="text-xs text-white/60">
                Podpis zaměstnance:{" "}
                {comparison.signatures.zamestnanec === "uveden" ? "Podpis je uveden" : comparison.signatures.zamestnanec === "chybi" ? "Podpis chybí" : "Nelze rozpoznat"}
              </p>
              <p className="text-xs text-white/60">
                Podpis vedoucího:{" "}
                {comparison.signatures.vedouci === "uveden" ? "Podpis je uveden" : comparison.signatures.vedouci === "chybi" ? "Podpis chybí" : "Nelze rozpoznat"}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
            <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
              Měsíční souhrny
            </h2>
            {comparison.summary.map((f) => (
              <div key={f.field} className="flex items-center justify-between border-b border-white/5 py-1.5 last:border-0 text-xs">
                <span className="text-white/60">{f.field}</span>
                <span className="text-white/40">Papír: {f.paperValue} · ERP: {f.erpValue}</span>
              </div>
            ))}
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
              Potvrzení kontroly
            </h2>

            <button
              type="button"
              onClick={() => setStep("recognize")}
              className="mb-3 rounded-xl border border-glass-border px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/5"
            >
              Upravit rozpoznané údaje
            </button>

            <textarea
              value={reviewerNote}
              onChange={(e) => setReviewerNote(e.target.value)}
              placeholder="Poznámka kontrolujícího (nepovinné)"
              rows={2}
              className="mb-3 w-full rounded-xl border border-glass-border bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-turquoise"
            />

            {error && <p className="mb-3 text-sm text-red-300">{error}</p>}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={saving}
                className="rounded-xl bg-gradient-to-r from-gold to-gold-light px-4 py-2 text-sm font-semibold text-base-950 transition hover:opacity-90 disabled:opacity-50"
              >
                Potvrdit kontrolu
              </button>
              <button
                type="button"
                onClick={() => setShowReturnBox((v) => !v)}
                disabled={saving}
                className="rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/70 transition hover:bg-white/5"
              >
                Vrátit k dořešení
              </button>
              <button
                type="button"
                onClick={handleMarkIllegible}
                disabled={saving}
                className="rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/70 transition hover:bg-white/5"
              >
                Označit jako nečitelný formulář
              </button>
            </div>

            {showReturnBox && (
              <div className="mt-3 flex flex-col gap-2">
                <textarea
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="Důvod vrácení (povinné)"
                  rows={2}
                  className="rounded-xl border border-glass-border bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-turquoise"
                />
                <button
                  type="button"
                  onClick={handleReturn}
                  disabled={saving}
                  className="self-start rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/70 transition hover:bg-white/5"
                >
                  Potvrdit vrácení
                </button>
              </div>
            )}
          </section>
        </>
      )}

      {step === "done" && doneMessage && (
        <p className="rounded-xl bg-turquoise/10 px-4 py-3 text-center text-sm text-turquoise-light">{doneMessage}</p>
      )}
    </div>
  );
}
