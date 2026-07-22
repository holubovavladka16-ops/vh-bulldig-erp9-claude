import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Zpracuje návrat z Google OAuth flow a přesměruje na uvítací obrazovku.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}/uvitani?next=${encodeURIComponent(next)}`);
    }
  }

  // Při chybě se uživatel vrátí na přihlašovací stránku s českou chybovou zprávou.
  return NextResponse.redirect(
    `${origin}/prihlaseni?error=${encodeURIComponent("Přihlášení přes Google se nepodařilo.")}`
  );
}
