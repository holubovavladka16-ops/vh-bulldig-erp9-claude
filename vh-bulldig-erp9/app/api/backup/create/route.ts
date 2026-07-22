import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCompanyBackup } from "@/lib/backup";

const MODULE_KEY = "zaloha-obnova";

export async function POST() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nejste přihlášeni." }, { status: 401 });
  }

  const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const profile = profileData as unknown as {
    id: string;
    company_id: string;
    role: string;
    full_name: string | null;
    email: string;
  } | null;

  if (!profile) {
    return NextResponse.json({ error: "Nesprávný e-mail nebo heslo." }, { status: 403 });
  }

  const isMajitel = profile.role === "majitel";
  let hasPermission = false;
  if (profile.role === "administrator") {
    const { data: perm } = await supabase
      .from("module_permissions")
      .select("can_access")
      .eq("profile_id", profile.id)
      .eq("module_key", MODULE_KEY)
      .maybeSingle();
    hasPermission = Boolean((perm as unknown as { can_access: boolean } | null)?.can_access);
  }

  if (!isMajitel && !hasPermission) {
    return NextResponse.json({ error: "Nemáte oprávnění ke vstupu do aplikace." }, { status: 403 });
  }

  const result = await createCompanyBackup(profile.company_id, profile.id, profile.full_name || profile.email);

  if (!result.success) {
    return NextResponse.json(
      { error: "Zálohu se nepodařilo dokončit. Původní data zůstala zachována." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, backupId: result.backupId });
}
