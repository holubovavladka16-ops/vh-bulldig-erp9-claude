"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validateEmployeePhoto, uploadEmployeePhoto, removeEmployeePhoto } from "@/lib/employeePhoto";
import ImageUploadField from "@/components/company-settings/ImageUploadField";
import type { Employee, EmploymentType, PaymentMethod } from "@/types/database.types";

interface Props {
  companyId: string;
  employmentTypes: EmploymentType[];
  existingEmployee?: Employee;
  changedByProfileId: string;
  changedByName: string;
  /** Volitelný hák pro jiné moduly (např. Modul 19 - Papírový formulář),
   * které po úspěšné registraci potřebují provést vlastní návaznou akci
   * namísto výchozího přesměrování na Kartu dělníka. */
  onEmployeeCreated?: (employee: Employee) => void | Promise<void>;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "hotove", label: "Hotově" },
  { value: "bankovni_ucet", label: "Bankovní účet" },
];

const inputClass =
  "w-full rounded-xl border border-glass-border bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition focus:border-turquoise focus:ring-1 focus:ring-turquoise";

export default function EmployeeForm({
  companyId,
  employmentTypes,
  existingEmployee,
  changedByProfileId,
  changedByName,
  onEmployeeCreated,
}: Props) {
  const supabase = createClient();
  const router = useRouter();
  const isEdit = Boolean(existingEmployee);

  const [form, setForm] = useState({
    firstName: existingEmployee?.first_name ?? "",
    lastName: existingEmployee?.last_name ?? "",
    birthDate: existingEmployee?.birth_date ?? "",
    position: existingEmployee?.position ?? "",
    startDate: existingEmployee?.start_date ?? "",
    employmentTypeId: existingEmployee?.employment_type_id ?? "",
    paymentMethod: (existingEmployee?.payment_method ?? "hotove") as PaymentMethod,
    endDate: existingEmployee?.end_date ?? "",
    birthNumber: existingEmployee?.birth_number ?? "",
    address: existingEmployee?.address ?? "",
    idCardNumber: existingEmployee?.id_card_number ?? "",
    phone: existingEmployee?.phone ?? "",
    email: existingEmployee?.email ?? "",
    bankAccount: existingEmployee?.bank_account ?? "",
    note: existingEmployee?.note ?? "",
  });

  const [photoUrl, setPhotoUrl] = useState<string | null>(existingEmployee?.photo_url ?? null);
  const [photoPath, setPhotoPath] = useState<string | null>(existingEmployee?.photo_path ?? null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  function patch(p: Partial<typeof form>) {
    setForm((f) => ({ ...f, ...p }));
  }

  function handleSelectPhoto(file: File) {
    const err = validateEmployeePhoto(file);
    setPhotoError(err);
    if (err) return;
    setPhotoFile(file);
    setPhotoUrl(URL.createObjectURL(file));
  }

  function handleRemovePhoto() {
    setPhotoFile(null);
    setPhotoUrl(null);
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = "Jméno je povinné.";
    if (!form.lastName.trim()) e.lastName = "Příjmení je povinné.";
    if (!form.birthDate) e.birthDate = "Datum narození je povinné.";
    if (!form.position.trim()) e.position = "Pracovní pozice je povinná.";
    if (!form.startDate) e.startDate = "Datum nástupu je povinné.";
    if (!form.employmentTypeId) e.employmentTypeId = "Pracovní poměr je povinný.";
    if (!form.paymentMethod) e.paymentMethod = "Způsob platby je povinný.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setSaving(true);
    try {
      let finalPhotoUrl = photoUrl;
      let finalPhotoPath = photoPath;

      const payload = {
        company_id: companyId,
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        birth_date: form.birthDate,
        position: form.position.trim(),
        start_date: form.startDate,
        employment_type_id: form.employmentTypeId,
        payment_method: form.paymentMethod,
        end_date: form.endDate || null,
        birth_number: form.birthNumber.trim() || null,
        address: form.address.trim() || null,
        id_card_number: form.idCardNumber.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        bank_account: form.bankAccount.trim() || null,
        note: form.note.trim() || null,
      };

      if (isEdit && existingEmployee) {
        if (photoFile) {
          const uploaded = await uploadEmployeePhoto(supabase, companyId, existingEmployee.id, photoFile);
          finalPhotoUrl = uploaded.url;
          finalPhotoPath = uploaded.path;
        } else if (photoUrl === null && photoPath) {
          await removeEmployeePhoto(supabase, photoPath);
          finalPhotoPath = null;
        }

        const { error } = await supabase
          .from("employees")
          .update({ ...payload, photo_url: finalPhotoUrl, photo_path: finalPhotoPath } as never)
          .eq("id", existingEmployee.id);

        if (error) {
          setServerError("Uložení se nezdařilo. Zkuste to prosím znovu.");
          return;
        }

        await supabase.from("employee_history").insert({
          employee_id: existingEmployee.id,
          change_type: "osobni_udaje",
          changed_by: changedByProfileId,
          changed_by_name: changedByName,
        } as never);

        router.push(`/moduly/zamestnanci/${existingEmployee.id}`);
        router.refresh();
      } else {
        const { data, error } = await supabase
          .from("employees")
          .insert(payload as never)
          .select()
          .single();

        if (error || !data) {
          setServerError("Registrace se nezdařila. Zkuste to prosím znovu.");
          return;
        }

        const newEmployee = data as unknown as Employee;

        if (photoFile) {
          const uploaded = await uploadEmployeePhoto(supabase, companyId, newEmployee.id, photoFile);
          await supabase
            .from("employees")
            .update({ photo_url: uploaded.url, photo_path: uploaded.path } as never)
            .eq("id", newEmployee.id);
        }

        await supabase.from("employee_history").insert({
          employee_id: newEmployee.id,
          change_type: "vytvoreni",
          changed_by: changedByProfileId,
          changed_by_name: changedByName,
        } as never);

        if (onEmployeeCreated) {
          await onEmployeeCreated(newEmployee);
        } else {
          router.push(`/moduly/zamestnanci/${newEmployee.id}?zaregistrovano=1`);
          router.refresh();
        }
      }
    } finally {
      setSaving(false);
    }
  }

  const activeTypes = employmentTypes.filter(
    (t) => t.is_active || t.id === form.employmentTypeId
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
        <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
          Fotografie zaměstnance
        </h2>
        <ImageUploadField
          label="Fotografie zaměstnance"
          uploadLabel="Nahrát fotografii"
          previewUrl={photoUrl}
          onSelectFile={handleSelectPhoto}
          onRemove={handleRemovePhoto}
          error={photoError}
        />
      </section>

      <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
        <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
          Povinné údaje
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Jméno" required error={errors.firstName}>
            <input value={form.firstName} onChange={(e) => patch({ firstName: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Příjmení" required error={errors.lastName}>
            <input value={form.lastName} onChange={(e) => patch({ lastName: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Datum narození" required error={errors.birthDate}>
            <input type="date" value={form.birthDate} onChange={(e) => patch({ birthDate: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Pracovní pozice" required error={errors.position}>
            <input value={form.position} onChange={(e) => patch({ position: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Datum nástupu" required error={errors.startDate}>
            <input type="date" value={form.startDate} onChange={(e) => patch({ startDate: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Pracovní poměr" required error={errors.employmentTypeId}>
            <select
              value={form.employmentTypeId}
              onChange={(e) => patch({ employmentTypeId: e.target.value })}
              className={inputClass}
            >
              <option value="" className="bg-base-900">Vyberte…</option>
              {activeTypes.map((t) => (
                <option key={t.id} value={t.id} className="bg-base-900">
                  {t.name}
                </option>
              ))}
            </select>
            {activeTypes.length === 0 && (
              <p className="mt-1 text-xs text-amber-300">
                Zatím není vytvořen žádný typ pracovního poměru. Přidejte ho
                v seznamu zaměstnanců přes „Spravovat typy pracovního poměru“.
              </p>
            )}
          </Field>
          <Field label="Způsob platby" required error={errors.paymentMethod}>
            <select
              value={form.paymentMethod}
              onChange={(e) => patch({ paymentMethod: e.target.value as PaymentMethod })}
              className={inputClass}
            >
              {PAYMENT_METHODS.map((p) => (
                <option key={p.value} value={p.value} className="bg-base-900">
                  {p.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
        <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
          Nepovinné údaje
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Rodné číslo">
            <input value={form.birthNumber} onChange={(e) => patch({ birthNumber: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Adresa">
            <input value={form.address} onChange={(e) => patch({ address: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Číslo občanského průkazu">
            <input value={form.idCardNumber} onChange={(e) => patch({ idCardNumber: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Telefon">
            <input value={form.phone} onChange={(e) => patch({ phone: e.target.value })} className={inputClass} />
          </Field>
          <Field label="E-mail">
            <input type="email" value={form.email} onChange={(e) => patch({ email: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Bankovní účet">
            <input value={form.bankAccount} onChange={(e) => patch({ bankAccount: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Datum ukončení pracovního poměru">
            <input type="date" value={form.endDate} onChange={(e) => patch({ endDate: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Poznámka">
            <textarea value={form.note} onChange={(e) => patch({ note: e.target.value })} className={inputClass} rows={2} />
          </Field>
        </div>
      </section>

      {serverError && (
        <p role="alert" className="rounded-xl bg-red-500/10 px-4 py-3 text-center text-sm text-red-300">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="self-center rounded-xl bg-gradient-to-r from-gold to-gold-light px-8 py-3 text-base font-semibold text-base-950 transition hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Ukládám…" : isEdit ? "Uložit změny" : "Uložit zaměstnance"}
      </button>
    </form>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm text-white/60">
        {label}
        {required && <span className="text-red-300"> *</span>}
      </span>
      {children}
      {error && <span className="text-xs text-red-300">{error}</span>}
    </label>
  );
}
