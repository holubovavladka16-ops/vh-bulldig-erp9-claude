import { createClient } from "@/lib/supabase/server";
import { MODULES } from "@/lib/modules";
import type { Company, ModulePermission, Profile } from "@/types/database.types";

export interface AppContext {
  profile: Profile;
  company: Company | null;
  grantedKeys: Set<string>;
  isMajitel: boolean;
  isAdministrator: boolean;
  isUcetni: boolean;
  isZamestnanec: boolean;
  visibleModules: ReturnType<typeof MODULES.filter>;
}

/**
 * Načte profil, firmu a oprávnění přihlášeného uživatele.
 * Vrací null, pokud uživatel není přihlášen nebo jeho profil není aktivní.
 */
export async function loadAppContext(): Promise<AppContext | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = profileData as unknown as Profile | null;

  if (!profile || !profile.is_active) return null;

  const { data: companyData } = await supabase
    .from("companies")
    .select("*")
    .eq("id", profile.company_id)
    .single();

  const company = companyData as unknown as Company | null;

  const { data: permissionsData } = await supabase
    .from("module_permissions")
    .select("module_key, can_access")
    .eq("profile_id", profile.id);

  const permissions = (permissionsData ?? []) as unknown as Pick<
    ModulePermission,
    "module_key" | "can_access"
  >[];

  const grantedKeys = new Set(permissions.filter((p) => p.can_access).map((p) => p.module_key));

  const isMajitel = profile.role === "majitel";
  const isAdministrator = profile.role === "administrator";
  const isUcetni = profile.role === "ucetni";
  const isZamestnanec = profile.role === "zamestnanec";

  const visibleModules = MODULES.filter((m) => {
    if (m.key === "dashboard") return true;
    if (m.key === "nastaveni-aplikace") return true;
    if (m.key === "prihlaseni") return false;
    if (isMajitel) return true;
    if (m.key === "dochazka" && isZamestnanec) return true;
    if (m.key === "vykazy" && isZamestnanec) return true;
    if (m.key === "stavebni-denik" && isZamestnanec) return true;
    if (m.key === "foto-gps" && isZamestnanec) return true;
    if (m.key === "mapa" && isZamestnanec) return true;
    if (m.key === "pdf-a-vyplatni-pasky" && isZamestnanec) return true;
    if (m.key === "papirovy-formular" && isZamestnanec) return true;
    if (m.key === "kontrola-papiroveho-formulare" && isZamestnanec) return true;
    if (m.key === "smlouvy-a-dokumenty" && isZamestnanec) return true;
    return grantedKeys.has(m.key);
  });

  return {
    profile,
    company,
    grantedKeys,
    isMajitel,
    isAdministrator,
    isUcetni,
    isZamestnanec,
    visibleModules,
  };
}
