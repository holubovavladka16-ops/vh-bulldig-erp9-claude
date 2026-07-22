import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isDevAutoLoginEnabled } from "@/lib/devAutoLogin";

// Routy, které NEVYŽADUJÍ přihlášení.
const PUBLIC_ROUTES = [
  "/prihlaseni",
  "/zapomenute-heslo",
  "/obnoveni-hesla",
  "/auth/callback",
  "/sdileny",
  "/api/dev/auto-login",
];

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // Toto obnoví (refreshne) relaci uživatele, pokud je to potřeba.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Nepřihlášený uživatel nesmí otevřít chráněnou routu -> přesměrování na přihlášení.
  if (!user && !isPublicRoute(pathname)) {
    if (isDevAutoLoginEnabled()) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/api/dev/auto-login";
      redirectUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/prihlaseni";
    redirectUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Testovací režim: přihlašovací stránku přeskočit a rovnou přihlásit jako admin.
  if (!user && isDevAutoLoginEnabled() && pathname.startsWith("/prihlaseni")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/api/dev/auto-login";
    redirectUrl.searchParams.set(
      "next",
      request.nextUrl.searchParams.get("redirectedFrom") ?? "/dashboard"
    );
    return NextResponse.redirect(redirectUrl);
  }

  // Přihlášený uživatel nemá znovu vidět přihlašovací stránku.
  if (user && pathname.startsWith("/prihlaseni")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
