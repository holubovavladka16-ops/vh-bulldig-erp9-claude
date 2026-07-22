"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { pdf } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/client";
import { uploadGeneratedDocument } from "@/lib/documentStorage";
import GpsPhotoPdfPreviewModal from "@/components/gps-photos/GpsPhotoPdfPreviewModal";
import type { DocumentType } from "@/types/database.types";

interface Props {
  documentElement: React.ReactElement;
  documentType: DocumentType;
  fileName: string;
  companyId: string;
  employeeId?: string;
  orderId?: string;
  periodFrom?: string;
  periodTo?: string;
  createdByProfileId: string;
  createdByName: string;
}

export default function GenerateDocumentClient({
  documentElement,
  documentType,
  fileName,
  companyId,
  employeeId,
  orderId,
  periodFrom,
  periodTo,
  createdByProfileId,
  createdByName,
}: Props) {
  const supabase = createClient();
  const router = useRouter();

  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  async function handleGenerate() {
    if (savedId) {
      setShowPreview(true);
      return;
    }

    setGenerating(true);
    setError(null);
    try {
      const blob = await pdf(documentElement).toBlob();
      const uploaded = await uploadGeneratedDocument(supabase, companyId, fileName, blob);

      const { data, error: insertError } = await supabase
        .from("generated_documents")
        .insert({
          company_id: companyId,
          document_type: documentType,
          file_name: fileName,
          file_url: uploaded.url,
          file_path: uploaded.path,
          employee_id: employeeId ?? null,
          order_id: orderId ?? null,
          period_from: periodFrom ?? null,
          period_to: periodTo ?? null,
          created_by: createdByProfileId,
          created_by_name: createdByName,
        } as never)
        .select()
        .single();

      if (insertError || !data) {
        setError("Vytvoření dokumentu se nezdařilo. Zkuste to prosím znovu.");
        return;
      }

      setSavedId((data as unknown as { id: string }).id);
      setShowPreview(true);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={generating}
        className="self-start rounded-xl bg-gradient-to-r from-gold to-gold-light px-6 py-3 text-sm font-semibold text-base-950 transition hover:opacity-90 disabled:opacity-50"
      >
        {generating ? "Vytvářím dokument…" : savedId ? "Zobrazit náhled" : "Vytvořit dokument"}
      </button>

      {error && <p className="text-sm text-red-300">{error}</p>}

      {savedId && (
        <p className="text-xs text-white/40">
          Dokument byl uložen do evidence.{" "}
          <button type="button" onClick={() => router.push("/moduly/pdf-a-vyplatni-pasky")} className="underline">
            Zobrazit v seznamu dokumentů
          </button>
        </p>
      )}

      {showPreview && (
        <GpsPhotoPdfPreviewModal document={documentElement} fileName={fileName} onClose={() => setShowPreview(false)} />
      )}
    </div>
  );
}
