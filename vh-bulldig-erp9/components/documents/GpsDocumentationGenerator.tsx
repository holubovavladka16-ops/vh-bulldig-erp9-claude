"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { pdf } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/client";
import { uploadGeneratedDocument } from "@/lib/documentStorage";
import GpsPhotoPdfPreviewModal from "@/components/gps-photos/GpsPhotoPdfPreviewModal";
import GpsPhotoDocumentationPdf from "@/components/gps-photos/GpsPhotoDocumentationPdf";
import type { Company, GpsPhoto } from "@/types/database.types";

interface Props {
  photos: GpsPhoto[];
  orderNameById: Record<string, string>;
  company: Company | null;
  companyId: string;
  periodFrom?: string;
  periodTo?: string;
  createdByProfileId: string;
  createdByName: string;
}

export default function GpsDocumentationGenerator({
  photos,
  orderNameById,
  company,
  companyId,
  periodFrom,
  periodTo,
  createdByProfileId,
  createdByName,
}: Props) {
  const supabase = createClient();
  const router = useRouter();

  const [selectedIds, setSelectedIds] = useState<string[]>(photos.map((p) => p.id));
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [savedElement, setSavedElement] = useState<React.ReactElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  }

  const selectedPhotos = photos.filter((p) => selectedIds.includes(p.id));

  async function handleGenerate() {
    if (selectedPhotos.length === 0) {
      setError("Vyberte alespoň jednu fotografii.");
      return;
    }

    setGenerating(true);
    setError(null);
    try {
      const element = (
        <GpsPhotoDocumentationPdf company={company} orderNameById={orderNameById} photos={selectedPhotos} />
      );
      const blob = await pdf(element).toBlob();
      const fileName = `gps-fotodokumentace-${selectedPhotos.length}-fotografii.pdf`;
      const uploaded = await uploadGeneratedDocument(supabase, companyId, fileName, blob);

      const { error: insertError } = await supabase.from("generated_documents").insert({
        company_id: companyId,
        document_type: "gps_fotodokumentace",
        file_name: fileName,
        file_url: uploaded.url,
        file_path: uploaded.path,
        period_from: periodFrom ?? null,
        period_to: periodTo ?? null,
        created_by: createdByProfileId,
        created_by_name: createdByName,
      } as never);

      if (insertError) {
        setError("Vytvoření dokumentu se nezdařilo. Zkuste to prosím znovu.");
        return;
      }

      setSavedElement(element);
      setShowPreview(true);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-white/60">
        Vyberte fotografie, které mají být součástí PDF ({selectedPhotos.length} z {photos.length} vybráno).
      </p>

      {photos.length === 0 ? (
        <p className="text-sm text-white/35">V tomto období nejsou žádné fotografie s GPS.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {photos.map((p) => (
            <label key={p.id} className="relative cursor-pointer overflow-hidden rounded-xl border border-glass-border">
              <input
                type="checkbox"
                checked={selectedIds.includes(p.id)}
                onChange={() => toggle(p.id)}
                className="absolute left-2 top-2 z-10 h-5 w-5"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.photo_url} alt="Fotografie" className="h-24 w-full object-cover" />
              <p className="bg-glass-fill p-1.5 text-[10px] text-white/50">
                {new Date(p.taken_at).toLocaleDateString("cs-CZ")}
              </p>
            </label>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-300">{error}</p>}

      <button
        type="button"
        onClick={handleGenerate}
        disabled={generating || photos.length === 0}
        className="self-start rounded-xl bg-gradient-to-r from-gold to-gold-light px-6 py-3 text-sm font-semibold text-base-950 transition hover:opacity-90 disabled:opacity-50"
      >
        {generating ? "Vytvářím dokument…" : "Vytvořit dokument"}
      </button>

      {savedElement && (
        <p className="text-xs text-white/40">
          Dokument byl uložen do evidence.{" "}
          <button type="button" onClick={() => router.push("/moduly/pdf-a-vyplatni-pasky")} className="underline">
            Zobrazit v seznamu dokumentů
          </button>
        </p>
      )}

      {showPreview && savedElement && (
        <GpsPhotoPdfPreviewModal document={savedElement} fileName="gps-fotodokumentace.pdf" onClose={() => setShowPreview(false)} />
      )}
    </div>
  );
}
