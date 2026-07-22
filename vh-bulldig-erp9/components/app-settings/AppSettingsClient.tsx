"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useThemeSettings } from "@/components/ThemeProvider";
import DesignPreviewCard from "./DesignPreviewCard";
import { DESIGNS } from "@/lib/themes";
import type { AppDesign, LandingPage } from "@/types/database.types";

const DEVICE_LABELS: Record<string, string> = {
  phone: "Telefon",
  tablet: "Tablet",
  desktop: "Počítač",
};

interface Props {
  isMajitel: boolean;
  companyId: string;
  initialCompanyDefaultDesign: AppDesign;
}

export default function AppSettingsClient({ isMajitel, companyId, initialCompanyDefaultDesign }: Props) {
  const supabase = createClient();
  const { settings, deviceType, loading, updateSettings } = useThemeSettings();

  const deviceColumn = deviceType === "phone" ? "theme_phone" : deviceType === "tablet" ? "theme_tablet" : "theme_desktop";

  const [pendingDesign, setPendingDesign] = useState<AppDesign>("professional");
  const [syncDevices, setSyncDevices] = useState(false);
  const [landingPage, setLandingPage] = useState<LandingPage>("dashboard");
  const [companyDefaultDesign, setCompanyDefaultDesign] = useState<AppDesign>(initialCompanyDefaultDesign);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!settings) return;
    setPendingDesign(settings.sync_devices ? settings.theme_synced : settings[deviceColumn]);
    setSyncDevices(settings.sync_devices);
    setLandingPage(settings.default_landing_page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  function previewDesign(design: AppDesign) {
    setPendingDesign(design);
    // Okamžitá změna vzhledu bez uložení a bez odhlášení (bod 8) -
    // rozepsaná data v ostatních komponentách zůstávají nedotčena,
    // mění se pouze CSS atribut motivu.
    document.documentElement.setAttribute("data-theme", design);
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const patch = syncDevices
        ? { sync_devices: true, theme_synced: pendingDesign, default_landing_page: landingPage }
        : { sync_devices: false, [deviceColumn]: pendingDesign, default_landing_page: landingPage };

      await updateSettings(patch);

      if (isMajitel) {
        await supabase.from("companies").update({ default_user_design: companyDefaultDesign } as never).eq("id", companyId);
      }

      setMessage("Nastavení aplikace bylo úspěšně uloženo.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-white/50">Načítám nastavení…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Vzhled aplikace */}
      <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
        <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
          Vzhled aplikace
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {DESIGNS.map((d) => (
            <DesignPreviewCard key={d.key} design={d} active={pendingDesign === d.key} onApply={() => previewDesign(d.key)} />
          ))}
        </div>
      </section>

      {/* 2. Nastavení zařízení */}
      <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
        <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
          Nastavení zařízení
        </h2>
        <p className="text-sm text-white/70">
          Aktuální zařízení: <span className="font-semibold text-white">{DEVICE_LABELS[deviceType]}</span>
        </p>
        <p className="mt-1 text-xs text-white/40">
          Vybraný design se uloží pro toto zařízení, pokud není zapnuté „Používat stejný design na všech zařízeních“ níže.
        </p>
        {settings && (
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-white/50">
            <span>Telefon: {DESIGNS.find((d) => d.key === settings.theme_phone)?.label}</span>
            <span>Tablet: {DESIGNS.find((d) => d.key === settings.theme_tablet)?.label}</span>
            <span>Počítač: {DESIGNS.find((d) => d.key === settings.theme_desktop)?.label}</span>
          </div>
        )}
      </section>

      {/* 3. Uživatelské preference */}
      <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
        <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
          Uživatelské preference
        </h2>

        <label className="flex items-center gap-3 text-sm text-white/80">
          <input type="checkbox" checked={syncDevices} onChange={(e) => setSyncDevices(e.target.checked)} />
          Používat stejný design na všech zařízeních
        </label>

        <div className="mt-4">
          <p className="mb-2 text-sm text-white/60">Výchozí úvodní stránka</p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-white/80">
              <input type="radio" checked={landingPage === "dashboard"} onChange={() => setLandingPage("dashboard")} />
              Dashboard
            </label>
            <label className="flex items-center gap-2 text-sm text-white/80">
              <input type="radio" checked={landingPage === "prehled_modulu"} onChange={() => setLandingPage("prehled_modulu")} />
              Přehled modulů
            </label>
          </div>
        </div>

        {isMajitel && (
          <div className="mt-5 border-t border-white/10 pt-4">
            <p className="mb-2 text-sm text-white/60">
              Výchozí design pro nově vytvořené uživatele (pouze Majitel)
            </p>
            <select
              value={companyDefaultDesign}
              onChange={(e) => setCompanyDefaultDesign(e.target.value as AppDesign)}
              className="rounded-xl border border-glass-border bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-turquoise"
            >
              {DESIGNS.map((d) => (
                <option key={d.key} value={d.key} className="bg-base-900">{d.label}</option>
              ))}
            </select>
          </div>
        )}
      </section>

      {/* 4. Relace a bezpečnost */}
      <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
        <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
          Relace a bezpečnost
        </h2>
        <p className="text-sm text-white/70">Automatické odhlášení po 15 minutách nečinnosti.</p>
        <p className="mt-1 text-xs text-white/30">Toto bezpečnostní pravidlo nelze vypnout.</p>
      </section>

      {message && (
        <p className="rounded-xl bg-turquoise/10 px-4 py-3 text-center text-sm text-turquoise-light">{message}</p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="self-center rounded-xl bg-gradient-to-r from-gold to-gold-light px-8 py-3 text-base font-semibold text-base-950 transition hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Ukládám…" : "Uložit nastavení"}
      </button>
    </div>
  );
}
