import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDevAdminCredentials, isDevAutoLoginEnabled } from "@/lib/devAutoLogin";

/**
 * Testovací endpoint – automaticky přihlásí administrátora a přesměruje na dashboard.
 * Aktivní pouze pokud je zapnutý DEV_AUTO_LOGIN (výchozí v development módu).
 */
export async function GET(request: Request) {
  if (!isDevAutoLoginEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/dashboard";
  const { email, password } = getDevAdminCredentials();

  if (!email || !password) {
    return NextResponse.redirect(
      `${origin}/prihlaseni?error=${encodeURIComponent(
        "Testovací auto-login: doplňte DEV_ADMIN_EMAIL a DEV_ADMIN_PASSWORD v .env.local."
      )}`
    );
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.redirect(
      `${origin}/prihlaseni?error=${encodeURIComponent(
        `Testovací auto-login selhal: ${error.message}`
      )}`
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
