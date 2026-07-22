import { createClient } from "@/lib/supabase/server";
import type { CompanyBranding } from "@/types/database.types";

/**
 * Načte veřejné firemní branding údaje (název, logo) z pohledu
 * `company_branding`, který je čitelný i bez přihlášení (viz Modul 3,
 * migrace 0002). Používá se na přihlašovací a uvítací obrazovce.
 */
export async function getPublicBranding(): Promise<CompanyBranding | null> {
  const supabase = createClient();
  const { data } = await supabase.from("company_branding").select("*").maybeSingle();
  return (data as unknown as CompanyBranding | null) ?? null;
}
