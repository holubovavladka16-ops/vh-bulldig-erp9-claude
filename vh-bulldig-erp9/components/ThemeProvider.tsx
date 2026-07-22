"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { detectDeviceType, type DeviceType } from "@/lib/device";
import type { AppDesign, LandingPage, UserAppSettings } from "@/types/database.types";

interface ThemeContextValue {
  settings: UserAppSettings | null;
  deviceType: DeviceType;
  loading: boolean;
  activeDesign: AppDesign;
  updateSettings: (patch: Partial<UserAppSettings>) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue>({
  settings: null,
  deviceType: "desktop",
  loading: true,
  activeDesign: "professional",
  updateSettings: async () => {},
});

export function useThemeSettings() {
  return useContext(ThemeContext);
}

function deviceColumn(device: DeviceType): "theme_phone" | "theme_tablet" | "theme_desktop" {
  if (device === "phone") return "theme_phone";
  if (device === "tablet") return "theme_tablet";
  return "theme_desktop";
}

function applyTheme(design: AppDesign) {
  document.documentElement.setAttribute("data-theme", design);
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { profile } = useAuth();

  const [settings, setSettings] = useState<UserAppSettings | null>(null);
  const [deviceType, setDeviceType] = useState<DeviceType>("desktop");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setDeviceType(detectDeviceType());
    const onResize = () => setDeviceType(detectDeviceType());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!profile) {
      applyTheme("professional");
      setSettings(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadOrCreate() {
      const { data } = await supabase
        .from("user_app_settings")
        .select("*")
        .eq("profile_id", profile!.id)
        .maybeSingle();

      if (cancelled) return;

      if (data) {
        setSettings(data as unknown as UserAppSettings);
      } else {
        // Poprvé - založ řádek s výchozím firemním designem (bod 7).
        const { data: companyData } = await supabase
          .from("companies")
          .select("default_user_design")
          .eq("id", profile!.company_id)
          .maybeSingle();

        const defaultDesign =
          ((companyData as unknown as { default_user_design: AppDesign } | null)?.default_user_design) ??
          "professional";

        const { data: created } = await supabase
          .from("user_app_settings")
          .insert({
            profile_id: profile!.id,
            theme_synced: defaultDesign,
            theme_phone: defaultDesign,
            theme_tablet: defaultDesign,
            theme_desktop: defaultDesign,
          } as never)
          .select()
          .single();

        if (!cancelled && created) {
          setSettings(created as unknown as UserAppSettings);
        }
      }
      setLoading(false);
    }

    loadOrCreate();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const activeDesign: AppDesign = settings
    ? settings.sync_devices
      ? settings.theme_synced
      : settings[deviceColumn(deviceType)]
    : "professional";

  useEffect(() => {
    applyTheme(activeDesign);
  }, [activeDesign]);

  const updateSettings = useCallback(
    async (patch: Partial<UserAppSettings>) => {
      if (!profile || !settings) return;
      const { data, error } = await supabase
        .from("user_app_settings")
        .update(patch as never)
        .eq("profile_id", profile.id)
        .select()
        .single();

      if (!error && data) {
        setSettings(data as unknown as UserAppSettings);
      }
    },
    [profile, settings, supabase]
  );

  return (
    <ThemeContext.Provider value={{ settings, deviceType, loading, activeDesign, updateSettings }}>
      {children}
    </ThemeContext.Provider>
  );
}
