"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { validateCompanyImage, uploadCompanyAsset, removeCompanyAsset } from "@/lib/companyAssets";
import type { Company, WatermarkSize } from "@/types/database.types";
import LogoCard from "./LogoCard";
import WatermarkCard from "./WatermarkCard";
import WatermarkSettingsCard from "./WatermarkSettingsCard";
import BasicInfoCard from "./BasicInfoCard";
import ContactInfoCard from "./ContactInfoCard";
import AddressCard from "./AddressCard";

interface Props {
  company: Company;
  readOnly: boolean;
}

const RECOMMENDED_OPACITY = 12;
const RECOMMENDED_SIZE: WatermarkSize = "automaticky";

export default function CompanySettingsForm({ company, readOnly }: Props) {
  const supabase = createClient();

  const [form, setForm] = useState({
    name: company.name ?? "",
    slogan: company.slogan ?? "",
    ico: company.ico ?? "",
    isVatPayer: company.is_vat_payer,
    dic: company.dic ?? "",
    phone: company.phone ?? "",
    email: company.email ?? "",
    web: company.web ?? "",
    bankAccount: company.bank_account ?? "",
    jednatel: company.jednatel ?? "",
    ucetniEmail: company.ucetni_email ?? "",
    street: company.street ?? "",
    city: company.city ?? "",
    zip: company.zip ?? "",
    country: company.country ?? "Česká republika",
  });

  const [logoUrl, setLogoUrl] = useState(company.logo_url);
  const [logoPath, setLogoPath] = useState(company.logo_path);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);

  const [watermarkUrl, setWatermarkUrl] = useState(company.watermark_url);
  const [watermarkPath, setWatermarkPath] = useState(company.watermark_path);
  const [watermarkFile, setWatermarkFile] = useState<File | null>(null);
  const [watermarkError, setWatermarkError] = useState<string | null>(null);

  const [opacity, setOpacity] = useState(company.watermark_opacity ?? RECOMMENDED_OPACITY);
  const [size, setSize] = useState<WatermarkSize>(company.watermark_size ?? RECOMMENDED_SIZE);

  const [saving, setSaving] = useState(false);
  const [savingWatermark, setSavingWatermark] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; dic?: string }>({});

  function patchForm(patch: Partial<typeof form>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  function handleSelectLogo(file: File) {
    const err = validateCompanyImage(file);
    setLogoError(err);
    if (err) return;
    setLogoFile(file);
    setLogoUrl(URL.createObjectURL(file));
  }

  function handleRemoveLogo() {
    setLogoFile(null);
    setLogoUrl(null);
  }

  function handleSelectWatermark(file: File) {
    const err = validateCompanyImage(file);
    setWatermarkError(err);
    if (err) return;
    setWatermarkFile(file);
    setWatermarkUrl(URL.createObjectURL(file));
  }

  async function persistWatermarkRemoval() {
    setSavingWatermark(true);
    try {
      await removeCompanyAsset(supabase, "company-watermarks", watermarkPath);
      await supabase
        .from("companies")
        .update({ watermark_url: null, watermark_path: null } as never)
        .eq("id", company.id);
      setWatermarkFile(null);
      setWatermarkUrl(null);
      setWatermarkPath(null);
      setMessage("Firemní údaje byly úspěšně uloženy.");
    } finally {
      setSavingWatermark(false);
    }
  }

  async function persistWatermarkSettings() {
    setSavingWatermark(true);
    try {
      let finalUrl = watermarkUrl;
      let finalPath = watermarkPath;

      if (watermarkFile) {
        const uploaded = await uploadCompanyAsset(supabase, "company-watermarks", company.id, watermarkFile);
        finalUrl = uploaded.url;
        finalPath = uploaded.path;
        setWatermarkFile(null);
        setWatermarkUrl(uploaded.url);
        setWatermarkPath(uploaded.path);
      }

      await supabase
        .from("companies")
        .update({
          watermark_url: finalUrl,
          watermark_path: finalPath,
          watermark_opacity: opacity,
          watermark_size: size,
        } as never)
        .eq("id", company.id);

      setMessage("Firemní údaje byly úspěšně uloženy.");
    } finally {
      setSavingWatermark(false);
    }
  }

  function resetRecommended() {
    setOpacity(RECOMMENDED_OPACITY);
    setSize(RECOMMENDED_SIZE);
  }

  async function handleSaveAll(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const errors: { name?: string; dic?: string } = {};
    if (!form.name.trim()) errors.name = "Název společnosti je povinný.";
    if (form.isVatPayer && !form.dic.trim()) errors.dic = "DIČ je povinné pro plátce DPH.";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      let finalLogoUrl = logoUrl;
      let finalLogoPath = logoPath;

      if (logoFile) {
        const uploaded = await uploadCompanyAsset(supabase, "company-logos", company.id, logoFile);
        finalLogoUrl = uploaded.url;
        finalLogoPath = uploaded.path;
      } else if (logoUrl === null && logoPath) {
        await removeCompanyAsset(supabase, "company-logos", logoPath);
        finalLogoPath = null;
      }

      const { error } = await supabase
        .from("companies")
        .update({
          name: form.name.trim(),
          slogan: form.slogan.trim() || null,
          ico: form.ico.trim() || null,
          is_vat_payer: form.isVatPayer,
          dic: form.dic.trim() || null,
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          web: form.web.trim() || null,
          bank_account: form.bankAccount.trim() || null,
          jednatel: form.jednatel.trim() || null,
          ucetni_email: form.ucetniEmail.trim() || null,
          street: form.street.trim() || null,
          city: form.city.trim() || null,
          zip: form.zip.trim() || null,
          country: form.country.trim() || "Česká republika",
          logo_url: finalLogoUrl,
          logo_path: finalLogoPath,
        } as never)
        .eq("id", company.id);

      if (error) {
        setMessage("Uložení se nezdařilo. Zkuste to prosím znovu.");
        return;
      }

      setLogoFile(null);
      setLogoUrl(finalLogoUrl);
      setLogoPath(finalLogoPath);
      setMessage("Firemní údaje byly úspěšně uloženy.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSaveAll} className="flex flex-col gap-6">
      <LogoCard
        previewUrl={logoUrl}
        readOnly={readOnly}
        onSelectFile={handleSelectLogo}
        onRemove={handleRemoveLogo}
        error={logoError}
      />

      <WatermarkCard
        previewUrl={watermarkUrl}
        readOnly={readOnly}
        onSelectFile={handleSelectWatermark}
        onRemove={persistWatermarkRemoval}
        error={watermarkError}
      />

      <WatermarkSettingsCard
        watermarkUrl={watermarkUrl}
        opacity={opacity}
        size={size}
        readOnly={readOnly}
        onOpacityChange={setOpacity}
        onSizeChange={setSize}
        onApply={persistWatermarkSettings}
        onResetRecommended={resetRecommended}
        onRemove={persistWatermarkRemoval}
        saving={savingWatermark}
      />

      <BasicInfoCard
        name={form.name}
        slogan={form.slogan}
        ico={form.ico}
        isVatPayer={form.isVatPayer}
        dic={form.dic}
        readOnly={readOnly}
        onChange={patchForm}
        errors={fieldErrors}
      />

      <ContactInfoCard
        phone={form.phone}
        email={form.email}
        web={form.web}
        bankAccount={form.bankAccount}
        jednatel={form.jednatel}
        ucetniEmail={form.ucetniEmail}
        readOnly={readOnly}
        onChange={patchForm}
      />

      <AddressCard
        street={form.street}
        city={form.city}
        zip={form.zip}
        country={form.country}
        readOnly={readOnly}
        onChange={patchForm}
      />

      {message && (
        <p className="rounded-xl bg-turquoise/10 px-4 py-3 text-center text-sm text-turquoise-light">
          {message}
        </p>
      )}

      {!readOnly && (
        <button
          type="submit"
          disabled={saving}
          className="self-center rounded-xl bg-gradient-to-r from-gold to-gold-light px-8 py-3 text-base font-semibold text-base-950 transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Ukládám…" : "Uložit firemní údaje"}
        </button>
      )}
    </form>
  );
}
