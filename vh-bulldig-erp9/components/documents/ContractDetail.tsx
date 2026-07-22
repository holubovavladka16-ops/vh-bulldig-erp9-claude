"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import RichTextEditor from "./RichTextEditor";
import SignaturePad from "./SignaturePad";
import DocumentStatusBadge from "./DocumentStatusBadge";
import ConnectionPdfShareButtons from "@/components/connections/ConnectionPdfShareButtons";
import DocumentPdf from "./pdf/DocumentPdf";
import { findUnfilledMarkers } from "@/lib/documentContentBuilder";
import { SIGNER_ROLES, documentTypeLabel } from "@/lib/documentTemplates";
import {
  uploadDocumentAttachment,
  uploadSignatureFile,
  getSignedAttachmentUrl,
  getSignedSignatureUrl,
} from "@/lib/documentStorage2";
import type {
  Company,
  DocumentAttachment,
  DocumentHistoryEntry,
  DocumentSignature,
  DocumentV2,
  DocumentVersion,
  Employee,
  Order,
  SignatureMethod,
} from "@/types/database.types";

const HISTORY_LABELS: Record<string, string> = {
  vytvoreni: "Vytvoření dokumentu", zmena_typu: "Změna typu", zmena_nazvu: "Změna názvu",
  zmena_smluvni_strany: "Změna smluvní strany", zmena_zamestnance: "Změna zaměstnance",
  zmena_zakazky: "Změna zakázky", zmena_textu: "Změna textu", zmena_ceny: "Změna ceny",
  zmena_terminu: "Změna termínu", zmena_stavu: "Změna stavu", nova_verze: "Nová verze",
  schvaleni: "Schválení", odeslani: "Odeslání k podpisu", podpis: "Podpis",
  ukonceni: "Ukončení", zruseni: "Zrušení", archivace: "Archivace",
};

interface Props {
  doc: DocumentV2;
  employee: Employee | null;
  order: Order | null;
  company: Company | null;
  attachments: DocumentAttachment[];
  signatures: DocumentSignature[];
  versions: DocumentVersion[];
  history: DocumentHistoryEntry[];
  canManage: boolean;
  isOwnDocument: boolean;
  changedByProfileId: string;
  changedByName: string;
  justCreated?: boolean;
}

export default function ContractDetail({
  doc: initialDoc,
  employee,
  order,
  company,
  attachments,
  signatures: initialSignatures,
  versions,
  history,
  canManage,
  isOwnDocument,
  changedByProfileId,
  changedByName,
  justCreated,
}: Props) {
  const supabase = createClient();
  const router = useRouter();

  const [doc, setDoc] = useState(initialDoc);
  const [content, setContent] = useState(initialDoc.content);
  const [signatures, setSignatures] = useState(initialSignatures);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [signingRole, setSigningRole] = useState<string | null>(null);
  const [attachmentUrls, setAttachmentUrls] = useState<Record<string, string>>({});
  const [reasonForVersion, setReasonForVersion] = useState("");

  const isEditable = canManage && (doc.status === "rozepsany" || doc.status === "pripraveny_ke_kontrole");
  const requiredRoles = SIGNER_ROLES[doc.document_type];

  async function logHistory(changeType: string, details?: Record<string, unknown>) {
    await supabase.from("document_history").insert({
      document_id: doc.id,
      change_type: changeType,
      changed_by: changedByProfileId,
      changed_by_name: changedByName,
      details: details ?? null,
    } as never);
  }

  async function saveContent() {
    setSaving(true);
    setError(null);
    try {
      await supabase.from("document_versions").insert({
        document_id: doc.id,
        version_number: doc.version_number,
        content: doc.content,
        variables: doc.variables,
        reason: reasonForVersion.trim() || null,
        created_by: changedByProfileId,
        created_by_name: changedByName,
      } as never);

      const newVersion = doc.version_number + 1;
      await supabase.from("documents").update({ content, version_number: newVersion } as never).eq("id", doc.id);
      await logHistory("nova_verze", { verze: newVersion });

      setDoc((d) => ({ ...d, content, version_number: newVersion }));
      setReasonForVersion("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(newStatus: DocumentV2["status"], changeType: string, extra?: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    try {
      await supabase.from("documents").update({ status: newStatus, ...extra } as never).eq("id", doc.id);
      await logHistory(changeType, { na_stav: newStatus });
      setDoc((d) => ({ ...d, status: newStatus, ...extra } as DocumentV2));
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handlePrepareForReview() {
    await changeStatus("pripraveny_ke_kontrole", "zmena_stavu");
  }

  async function handleApprove() {
    const missing = findUnfilledMarkers(content);
    if (missing.length > 0) {
      setError(`Dokument nelze schválit - obsahuje nevyplněné údaje: ${missing.join(", ")}`);
      return;
    }
    if (doc.category === "obchodni" && (!doc.counterparty?.name || !doc.counterparty?.ico)) {
      setError("Dokument nelze schválit - chybí údaje o smluvní straně (název, IČO).");
      return;
    }
    await changeStatus("schvaleny", "schvaleni", {
      approved_at: new Date().toISOString(),
      approved_by: changedByProfileId,
      approved_by_name: changedByName,
    });
  }

  const [sendName, setSendName] = useState("");
  const [sendContact, setSendContact] = useState("");
  const [showSendBox, setShowSendBox] = useState(false);

  async function handleSendToSign() {
    if (!sendName.trim() || !sendContact.trim()) {
      setError("Zadejte jméno a kontakt osoby, které dokument odesíláte k podpisu.");
      return;
    }
    setSaving(true);
    try {
      await supabase
        .from("documents")
        .update({
          status: "odeslany_k_podpisu",
          sent_to_name: sendName.trim(),
          sent_to_contact: sendContact.trim(),
          sent_at: new Date().toISOString(),
          sent_by: changedByProfileId,
          sent_by_name: changedByName,
        } as never)
        .eq("id", doc.id);

      const rows = requiredRoles.map((role) => ({
        document_id: doc.id,
        signer_name: role === "Zaměstnanec" && employee ? `${employee.first_name} ${employee.last_name}` : sendName.trim(),
        signer_role: role,
        employee_id: role === "Zaměstnanec" ? doc.employee_id : null,
        version_number: doc.version_number,
        signed: false,
      }));
      const { data } = await supabase.from("document_signatures").insert(rows as never).select();

      await logHistory("odeslani", { komu: sendName.trim(), kontakt: sendContact.trim() });

      setDoc((d) => ({ ...d, status: "odeslany_k_podpisu", sent_to_name: sendName.trim(), sent_to_contact: sendContact.trim() }));
      setSignatures((data as unknown as DocumentSignature[]) ?? []);
      setShowSendBox(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function completeSignature(role: string, method: SignatureMethod, file?: Blob | File) {
    setSaving(true);
    setError(null);
    try {
      const sigRow = signatures.find((s) => s.signer_role === role);
      if (!sigRow) return;

      let signatureImagePath: string | null = null;
      let uploadedFilePath: string | null = null;

      if (method === "na_obrazovce" && file) {
        const uploaded = await uploadSignatureFile(supabase, doc.company_id, doc.id, file);
        signatureImagePath = uploaded.path;
      } else if (method === "nahrany_soubor" && file instanceof File) {
        const uploaded = await uploadSignatureFile(supabase, doc.company_id, doc.id, file, file.name.split(".").pop() || "pdf");
        uploadedFilePath = uploaded.path;
      }

      await supabase
        .from("document_signatures")
        .update({
          method,
          signed: true,
          signed_at: new Date().toISOString(),
          signature_image_path: signatureImagePath,
          uploaded_file_path: uploadedFilePath,
        } as never)
        .eq("id", sigRow.id);

      const updatedSignatures = signatures.map((s) =>
        s.id === sigRow.id ? { ...s, method, signed: true, signed_at: new Date().toISOString() } : s
      );
      setSignatures(updatedSignatures);

      await logHistory("podpis", { role, metoda: method });

      const allSigned = updatedSignatures.every((s) => s.signed);
      if (allSigned) {
        await supabase.from("documents").update({ status: "podepsany" } as never).eq("id", doc.id);
        await logHistory("zmena_stavu", { na_stav: "podepsany" });
        setDoc((d) => ({ ...d, status: "podepsany" }));
      }

      setSigningRole(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleTerminate() {
    await changeStatus("ukonceny", "ukonceni", { terminated_at: new Date().toISOString(), terminated_by: changedByProfileId });
  }
  async function handleCancel() {
    await changeStatus("zruseny", "zruseni", { cancelled_at: new Date().toISOString(), cancelled_by: changedByProfileId });
  }
  async function handleArchive() {
    await changeStatus("archivovany", "archivace", { archived_at: new Date().toISOString(), archived_by: changedByProfileId });
  }

  async function handleAttachmentUpload(file: File) {
    setSaving(true);
    try {
      const uploaded = await uploadDocumentAttachment(supabase, doc.company_id, doc.id, file);
      await supabase.from("document_attachments").insert({
        document_id: doc.id,
        file_path: uploaded.path,
        file_name: file.name,
        file_type: file.type || "application/octet-stream",
        created_by: changedByProfileId,
        created_by_name: changedByName,
      } as never);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function loadAttachmentUrl(a: DocumentAttachment) {
    const url = await getSignedAttachmentUrl(supabase, a.file_path);
    if (url) setAttachmentUrls((prev) => ({ ...prev, [a.id]: url }));
  }

  const isExpired = doc.expiry_date && new Date(doc.expiry_date) < new Date();

  return (
    <div className="flex flex-col gap-6">
      {justCreated && (
        <p className="rounded-xl bg-turquoise/10 px-4 py-3 text-center text-sm text-turquoise-light">
          Dokument byl úspěšně vytvořen jako rozepsaný.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-white">{doc.title}</h1>
          <p className="text-sm text-white/50">
            {doc.document_number} · {doc.custom_type_name || documentTypeLabel(doc.document_type)} · verze {doc.version_number}
          </p>
        </div>
        <DocumentStatusBadge status={doc.status} />
      </div>

      {isExpired && (
        <p className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Platnost tohoto dokumentu skončila {new Date(doc.expiry_date!).toLocaleDateString("cs-CZ")}.
        </p>
      )}

      {(employee || order || doc.counterparty) && (
        <section className="rounded-2xl border border-glass-border bg-glass-fill p-4 text-sm text-white/70">
          {employee && <p>Zaměstnanec: {employee.first_name} {employee.last_name} · {employee.position}</p>}
          {order && <p>Zakázka: {order.name}</p>}
          {doc.counterparty && <p>Smluvní strana: {doc.counterparty.name} (IČO: {doc.counterparty.ico})</p>}
        </section>
      )}

      <section>
        <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
          Text dokumentu
        </h2>
        <RichTextEditor value={content} onChange={setContent} readOnly={!isEditable} />
        {isEditable && (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              value={reasonForVersion}
              onChange={(e) => setReasonForVersion(e.target.value)}
              placeholder="Důvod změny (nepovinné)"
              className="flex-1 rounded-xl border border-glass-border bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-turquoise"
            />
            <button
              type="button"
              onClick={saveContent}
              disabled={saving}
              className="rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/5 disabled:opacity-50"
            >
              {saving ? "Ukládám…" : "Uložit jako novou verzi"}
            </button>
          </div>
        )}
      </section>

      {error && <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

      {canManage && (
        <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-white/50">Postup schvalování</h2>
          <div className="flex flex-wrap gap-2">
            {doc.status === "rozepsany" && (
              <>
                <button type="button" onClick={handlePrepareForReview} disabled={saving} className="rounded-xl bg-gradient-to-r from-gold to-gold-light px-4 py-2 text-sm font-semibold text-base-950 transition hover:opacity-90 disabled:opacity-50">
                  Připravit ke kontrole
                </button>
                <button type="button" onClick={async () => { await supabase.from("documents").delete().eq("id", doc.id); router.push("/moduly/smlouvy-a-dokumenty"); }} className="rounded-xl border border-red-400/40 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/10">
                  Odstranit rozepsaný dokument
                </button>
              </>
            )}
            {doc.status === "pripraveny_ke_kontrole" && (
              <button type="button" onClick={handleApprove} disabled={saving} className="rounded-xl bg-gradient-to-r from-gold to-gold-light px-4 py-2 text-sm font-semibold text-base-950 transition hover:opacity-90 disabled:opacity-50">
                Schválit
              </button>
            )}
            {doc.status === "schvaleny" && !showSendBox && (
              <button type="button" onClick={() => setShowSendBox(true)} className="rounded-xl bg-gradient-to-r from-gold to-gold-light px-4 py-2 text-sm font-semibold text-base-950 transition hover:opacity-90">
                Odeslat k podpisu
              </button>
            )}
            {doc.status === "podepsany" && (
              <>
                <button type="button" onClick={handleTerminate} disabled={saving} className="rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/5">
                  Ukončit
                </button>
                <button type="button" onClick={handleArchive} disabled={saving} className="rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/5">
                  Archivovat
                </button>
              </>
            )}
            {!["zruseny", "archivovany", "ukonceny"].includes(doc.status) && (
              <button type="button" onClick={handleCancel} disabled={saving} className="rounded-xl border border-red-400/40 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/10">
                Zrušit dokument
              </button>
            )}
          </div>

          {showSendBox && (
            <div className="mt-3 flex flex-col gap-2 rounded-xl border border-glass-border bg-white/5 p-4">
              <input value={sendName} onChange={(e) => setSendName(e.target.value)} placeholder="Jméno podepisující osoby" className="rounded-xl border border-glass-border bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-turquoise" />
              <input value={sendContact} onChange={(e) => setSendContact(e.target.value)} placeholder="E-mail nebo telefon" className="rounded-xl border border-glass-border bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-turquoise" />
              <button type="button" onClick={handleSendToSign} disabled={saving} className="self-start rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/5">
                Potvrdit odeslání
              </button>
            </div>
          )}
        </section>
      )}

      {doc.status === "odeslany_k_podpisu" && (
        <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-white/50">Podpisy</h2>
          <div className="flex flex-col gap-2">
            {signatures.map((s) => {
              const canSignThis = canManage || (isOwnDocument && s.signer_role === "Zaměstnanec");
              return (
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-glass-border bg-white/5 p-3">
                  <span className="text-sm text-white/70">{s.signer_role} · {s.signer_name}</span>
                  {s.signed ? (
                    <span className="text-xs text-emerald-300">Podepsáno {s.signed_at && new Date(s.signed_at).toLocaleString("cs-CZ")}</span>
                  ) : canSignThis ? (
                    <button type="button" onClick={() => setSigningRole(s.signer_role)} className="rounded-lg border border-glass-border px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/5">
                      Podepsat
                    </button>
                  ) : (
                    <span className="text-xs text-white/30">Čeká na podpis</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {signingRole && (
        <SignaturePad
          signerName={signatures.find((s) => s.signer_role === signingRole)?.signer_name ?? signingRole}
          onCancel={() => setSigningRole(null)}
          onConfirm={(blob) => completeSignature(signingRole, "na_obrazovce", blob)}
        />
      )}

      {canManage && (
        <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-white/50">Přílohy</h2>
          <input
            type="file"
            accept="application/pdf,.docx,image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleAttachmentUpload(f);
              e.target.value = "";
            }}
            className="text-xs text-white/60"
          />
          <div className="mt-3 flex flex-col gap-2">
            {attachments.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-2 rounded-xl border border-glass-border bg-white/5 p-2 text-xs text-white/60">
                <span>{a.file_name}</span>
                {attachmentUrls[a.id] ? (
                  <a href={attachmentUrls[a.id]} target="_blank" rel="noopener noreferrer" className="text-turquoise-light underline">Otevřít</a>
                ) : (
                  <button type="button" onClick={() => loadAttachmentUrl(a)} className="text-turquoise-light underline">Zobrazit odkaz</button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-white/50">Export PDF</h2>
        <ConnectionPdfShareButtons document={<DocumentPdf company={company} doc={doc} />} fileName={`${doc.document_number}.pdf`} />
      </section>

      {versions.length > 0 && (
        <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-white/50">Verze dokumentu</h2>
          <ul className="flex flex-col gap-2">
            {versions.map((v) => (
              <li key={v.id} className="flex items-center justify-between border-b border-white/5 py-2 text-xs text-white/60 last:border-0">
                <span>Verze {v.version_number}{v.reason ? ` – ${v.reason}` : ""}</span>
                <span>{new Date(v.created_at).toLocaleString("cs-CZ")} · {v.created_by_name}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-white/50">Historie změn</h2>
        {history.length === 0 ? (
          <p className="text-sm text-white/35">Zatím nejsou žádné záznamy.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {history.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-3 border-b border-white/5 py-2 last:border-0">
                <span className="text-sm text-white/70">{HISTORY_LABELS[h.change_type] ?? h.change_type}</span>
                <span className="text-xs text-white/35">
                  {new Date(h.changed_at).toLocaleString("cs-CZ")}{h.changed_by_name ? ` · ${h.changed_by_name}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
