"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DOCUMENT_TYPE_DEFS, findDocumentTypeDef } from "@/lib/documentTemplates";
import { buildInitialContent } from "@/lib/documentContentBuilder";
import { lookupByIco } from "@/lib/ares";
import type { Company, Counterparty, DocumentTypeV2, Employee, EmploymentType, Order } from "@/types/database.types";

interface Props {
  companyId: string;
  company: Company | null;
  employees: Employee[];
  employmentTypes: EmploymentType[];
  orders: Order[];
  existingDocumentCount: number;
  changedByProfileId: string;
  changedByName: string;
}

const inputClass =
  "w-full rounded-xl border border-glass-border bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-turquoise";

export default function NewContractForm({
  companyId,
  company,
  employees,
  employmentTypes,
  orders,
  existingDocumentCount,
  changedByProfileId,
  changedByName,
}: Props) {
  const supabase = createClient();
  const router = useRouter();

  const [type, setType] = useState<DocumentTypeV2 | "">("");
  const [customTypeName, setCustomTypeName] = useState("");
  const [title, setTitle] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [note, setNote] = useState("");

  const [employeeId, setEmployeeId] = useState("");
  const [orderId, setOrderId] = useState("");

  const [counterparty, setCounterparty] = useState<Counterparty>({
    name: "", ico: "", dic: "", address: "", contactPerson: "", phone: "", email: "", bankAccount: "",
  });
  const [icoLookupBusy, setIcoLookupBusy] = useState(false);
  const [icoError, setIcoError] = useState<string | null>(null);

  const [variables, setVariables] = useState<Record<string, string>>({});

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const def = type ? findDocumentTypeDef(type) : null;

  async function handleIcoLookup() {
    setIcoError(null);
    setIcoLookupBusy(true);
    try {
      const result = await lookupByIco(counterparty.ico);
      if (!result) {
        setIcoError("Firmu se nepodařilo dohledat. Zkontrolujte prosím IČO a údaje doplňte ručně.");
        return;
      }
      setCounterparty((c) => ({ ...c, name: result.name, dic: result.dic, address: result.address }));
    } catch {
      setIcoError("Vyhledání se nezdařilo. Zkontrolujte připojení k internetu.");
    } finally {
      setIcoLookupBusy(false);
    }
  }

  async function handleSave() {
    if (!type) {
      setError("Vyberte typ dokumentu.");
      return;
    }
    if (!title.trim()) {
      setError("Zadejte název dokumentu.");
      return;
    }
    if (def!.category === "pracovnepravni" && !employeeId) {
      setError("Vyberte zaměstnance.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const seq = existingDocumentCount + 1;
      const year = new Date().getFullYear();
      const documentNumber = `${def!.numberPrefix}-${year}-${String(seq).padStart(4, "0")}`;

      const employee = employeeId ? employees.find((e) => e.id === employeeId) ?? null : null;
      const employmentTypeName = employee
        ? employmentTypes.find((t) => t.id === employee.employment_type_id)?.name ?? null
        : null;
      const order = orderId ? orders.find((o) => o.id === orderId) ?? null : null;

      const content = buildInitialContent(type, company, employee, employmentTypeName, order, variables, customTypeName);

      const { data, error: insertError } = await supabase
        .from("documents")
        .insert({
          company_id: companyId,
          document_type: type,
          custom_type_name: type === "jiny_dokument" ? customTypeName.trim() || null : null,
          category: def!.category,
          document_number: documentNumber,
          title: title.trim(),
          effective_date: effectiveDate || null,
          expiry_date: expiryDate || null,
          status: "rozepsany",
          version_number: 1,
          employee_id: employeeId || null,
          order_id: orderId || null,
          counterparty: def!.category === "obchodni" ? counterparty : null,
          variables,
          content,
          note: note.trim() || null,
          created_by: changedByProfileId,
          created_by_name: changedByName,
        } as never)
        .select()
        .single();

      if (insertError || !data) {
        setError("Vytvoření dokumentu se nezdařilo. Zkuste to prosím znovu.");
        return;
      }

      const newDoc = data as unknown as { id: string };

      await supabase.from("document_history").insert({
        document_id: newDoc.id,
        change_type: "vytvoreni",
        changed_by: changedByProfileId,
        changed_by_name: changedByName,
      } as never);

      router.push(`/moduly/smlouvy-a-dokumenty/${newDoc.id}?vytvoreno=1`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-white/60">Typ dokumentu<span className="text-red-300"> *</span></span>
          <select value={type} onChange={(e) => setType(e.target.value as DocumentTypeV2)} className={inputClass}>
            <option value="" className="bg-base-900">Vyberte…</option>
            {DOCUMENT_TYPE_DEFS.map((d) => (
              <option key={d.key} value={d.key} className="bg-base-900">{d.label}</option>
            ))}
          </select>
        </label>
      </section>

      {type && (
        <>
          <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {type === "jiny_dokument" && (
                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className="text-sm text-white/60">Vlastní název typu dokumentu</span>
                  <input value={customTypeName} onChange={(e) => setCustomTypeName(e.target.value)} className={inputClass} />
                </label>
              )}
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-sm text-white/60">Název dokumentu<span className="text-red-300"> *</span></span>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm text-white/60">Datum účinnosti</span>
                <input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} className={inputClass} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm text-white/60">Datum ukončení platnosti</span>
                <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className={inputClass} />
              </label>
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-sm text-white/60">Poznámka</span>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={inputClass} />
              </label>
            </div>
          </section>

          {def?.category === "pracovnepravni" && (
            <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm text-white/60">Zaměstnanec<span className="text-red-300"> *</span></span>
                <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className={inputClass}>
                  <option value="" className="bg-base-900">Vyberte…</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id} className="bg-base-900">{e.first_name} {e.last_name}</option>
                  ))}
                </select>
              </label>
            </section>
          )}

          {def?.category === "obchodni" && (
            <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
              <label className="mb-4 flex flex-col gap-1.5">
                <span className="text-sm text-white/60">Zakázka</span>
                <select value={orderId} onChange={(e) => setOrderId(e.target.value)} className={inputClass}>
                  <option value="" className="bg-base-900">Nevázáno na zakázku</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id} className="bg-base-900">{o.name}</option>
                  ))}
                </select>
              </label>

              <h3 className="mb-2 text-sm font-semibold text-white/80">Objednatel / dodavatel</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex gap-2 sm:col-span-2">
                  <input placeholder="IČO" value={counterparty.ico} onChange={(e) => setCounterparty((c) => ({ ...c, ico: e.target.value }))} className={inputClass} />
                  <button type="button" onClick={handleIcoLookup} disabled={icoLookupBusy} className="whitespace-nowrap rounded-xl border border-glass-border px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-white/5 disabled:opacity-50">
                    {icoLookupBusy ? "Hledám…" : "Načíst dle IČO"}
                  </button>
                </div>
                {icoError && <p className="text-xs text-amber-300 sm:col-span-2">{icoError}</p>}
                <input placeholder="Název společnosti" value={counterparty.name} onChange={(e) => setCounterparty((c) => ({ ...c, name: e.target.value }))} className={`${inputClass} sm:col-span-2`} />
                <input placeholder="DIČ" value={counterparty.dic} onChange={(e) => setCounterparty((c) => ({ ...c, dic: e.target.value }))} className={inputClass} />
                <input placeholder="Sídlo" value={counterparty.address} onChange={(e) => setCounterparty((c) => ({ ...c, address: e.target.value }))} className={inputClass} />
                <input placeholder="Kontaktní osoba" value={counterparty.contactPerson} onChange={(e) => setCounterparty((c) => ({ ...c, contactPerson: e.target.value }))} className={inputClass} />
                <input placeholder="Telefon" value={counterparty.phone} onChange={(e) => setCounterparty((c) => ({ ...c, phone: e.target.value }))} className={inputClass} />
                <input placeholder="E-mail" value={counterparty.email} onChange={(e) => setCounterparty((c) => ({ ...c, email: e.target.value }))} className={inputClass} />
                <input placeholder="Bankovní účet" value={counterparty.bankAccount} onChange={(e) => setCounterparty((c) => ({ ...c, bankAccount: e.target.value }))} className={inputClass} />
              </div>
              <p className="mt-2 text-xs text-white/30">Načtené údaje si prosím před uložením zkontrolujte a případně opravte.</p>
            </section>
          )}

          {def && def.fields.length > 0 && (
            <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
              <h3 className="mb-3 text-sm font-semibold text-white/80">Údaje dokumentu</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {def.fields.map((f) => (
                  <label key={f.key} className={`flex flex-col gap-1.5 ${f.type === "textarea" ? "sm:col-span-2" : ""}`}>
                    <span className="text-xs text-white/50">{f.label}</span>
                    {f.type === "textarea" ? (
                      <textarea
                        value={variables[f.key] ?? ""}
                        onChange={(e) => setVariables((v) => ({ ...v, [f.key]: e.target.value }))}
                        rows={2}
                        className={inputClass}
                      />
                    ) : (
                      <input
                        type={f.type === "date" ? "date" : f.type === "number" ? "number" : "text"}
                        value={variables[f.key] ?? ""}
                        onChange={(e) => setVariables((v) => ({ ...v, [f.key]: e.target.value }))}
                        className={inputClass}
                      />
                    )}
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-white/30">
                Nevyplněná pole se v textu dokumentu označí jako [[DOPLNIT]] a je nutné je doplnit v editoru před schválením.
              </p>
            </section>
          )}

          {error && <p className="text-sm text-red-300">{error}</p>}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="self-center rounded-xl bg-gradient-to-r from-gold to-gold-light px-8 py-3 text-base font-semibold text-base-950 transition hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Vytvářím…" : "Vytvořit dokument"}
          </button>
        </>
      )}
    </div>
  );
}
