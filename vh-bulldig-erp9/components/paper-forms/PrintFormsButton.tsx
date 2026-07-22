"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/client";
import { generateQrDataUrl } from "@/lib/qr";
import PaperFormPdf from "./pdf/PaperFormPdf";
import GpsPhotoPdfPreviewModal from "@/components/gps-photos/GpsPhotoPdfPreviewModal";
import type { Company, Employee, PaperForm } from "@/types/database.types";

interface Props {
  forms: PaperForm[];
  company: Company | null;
  siteUrl: string;
  employeesById?: Record<string, Employee>;
  employmentTypeNameById?: Record<string, string>;
  changedByProfileId: string;
  changedByName: string;
  label?: string;
}

export default function PrintFormsButton({
  forms,
  company,
  siteUrl,
  employeesById,
  employmentTypeNameById,
  changedByProfileId,
  changedByName,
  label = "Vytisknout formuláře",
}: Props) {
  const supabase = createClient();
  const [busy, setBusy] = useState<"print" | "download" | "preview" | null>(null);
  const [previewDoc, setPreviewDoc] = useState<React.ReactElement | null>(null);

  async function buildDocument() {
    const withQr = await Promise.all(
      forms.map(async (f) => ({
        ...f,
        qrDataUrl: await generateQrDataUrl(`${siteUrl}/moduly/papirovy-formular/sken/${f.share_token}`),
      }))
    );

    const employeeInfoByFormId: Record<
      string,
      { firstName: string; lastName: string; position: string; employmentTypeName: string; internalNumber: string }
    > = {};

    if (employeesById) {
      for (const f of forms) {
        if (f.employee_id && employeesById[f.employee_id]) {
          const e = employeesById[f.employee_id];
          employeeInfoByFormId[f.id] = {
            firstName: e.first_name,
            lastName: e.last_name,
            position: e.position,
            employmentTypeName: employmentTypeNameById?.[e.employment_type_id] ?? "",
            internalNumber: "",
          };
        }
      }
    }

    return <PaperFormPdf company={company} forms={withQr} employeeInfoByFormId={employeeInfoByFormId} />;
  }

  async function logHistory(changeType: "tisk" | "stazeni_pdf") {
    await supabase.from("paper_form_history").insert(
      forms.map((f) => ({
        form_id: f.id,
        change_type: changeType,
        changed_by: changedByProfileId,
        changed_by_name: changedByName,
      })) as never
    );
  }

  async function handleDownload() {
    setBusy("download");
    try {
      const doc = await buildDocument();
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = forms.length === 1 ? `${forms[0].form_number}.pdf` : `mesicni-pracovni-vykazy-${forms.length}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      await logHistory("stazeni_pdf");
    } finally {
      setBusy(null);
    }
  }

  async function handlePreview() {
    setBusy("preview");
    try {
      const doc = await buildDocument();
      setPreviewDoc(doc);
    } finally {
      setBusy(null);
    }
  }

  async function handlePrint() {
    setBusy("print");
    try {
      const doc = await buildDocument();
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank");
      win?.addEventListener("load", () => win.print());
      await logHistory("tisk");

      const toAdvance = forms.filter((f) => f.status === "vytvoreny").map((f) => f.id);
      if (toAdvance.length > 0) {
        await supabase.from("paper_forms").update({ status: "vytisteny" } as never).in("id", toAdvance);
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={handlePreview}
        disabled={busy !== null || forms.length === 0}
        className="rounded-xl border border-glass-border px-4 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/5 disabled:opacity-50"
      >
        {busy === "preview" ? "Připravuji náhled…" : "Náhled"}
      </button>
      <button
        type="button"
        onClick={handlePrint}
        disabled={busy !== null || forms.length === 0}
        className="rounded-xl bg-gradient-to-r from-gold to-gold-light px-4 py-2.5 text-sm font-semibold text-base-950 transition hover:opacity-90 disabled:opacity-50"
      >
        {busy === "print" ? "Připravuji tisk…" : label}
      </button>
      <button
        type="button"
        onClick={handleDownload}
        disabled={busy !== null || forms.length === 0}
        className="rounded-xl border border-glass-border px-4 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/5 disabled:opacity-50"
      >
        {busy === "download" ? "Generuji…" : "Stáhnout PDF"}
      </button>

      {previewDoc && (
        <GpsPhotoPdfPreviewModal
          document={previewDoc}
          fileName={forms.length === 1 ? `${forms[0].form_number}.pdf` : `mesicni-pracovni-vykazy-${forms.length}.pdf`}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}
