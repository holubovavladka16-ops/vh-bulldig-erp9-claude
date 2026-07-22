"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toCzechAuthError } from "@/lib/authErrors";

export default function LoginForm() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(searchParams.get("error"));
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setSubmitting(false);

    if (signInError) {
      setError(toCzechAuthError(signInError.message));
      return;
    }

    const redirectedFrom = searchParams.get("redirectedFrom");
    router.replace(`/uvitani?next=${encodeURIComponent(redirectedFrom || "/dashboard")}`);
  }

  async function handleGoogleLogin() {
    setError(null);
    setGoogleSubmitting(true);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (oauthError) {
      setGoogleSubmitting(false);
      setError(toCzechAuthError(oauthError.message));
    }
    // Při úspěchu prohlížeč přesměruje pryč ze stránky, není třeba resetovat stav.
  }

  return (
    <form onSubmit={handleEmailLogin} className="flex w-full flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="font-body text-sm text-white/70">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border border-glass-border bg-white/5 px-4 py-3 text-base text-white outline-none transition focus:border-turquoise focus:ring-1 focus:ring-turquoise"
          placeholder="vas@email.cz"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="font-body text-sm text-white/70">
          Heslo
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-glass-border bg-white/5 px-4 py-3 pr-12 text-base text-white outline-none transition focus:border-turquoise focus:ring-1 focus:ring-turquoise"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-white/60 hover:text-turquoise"
            aria-label={showPassword ? "Skrýt heslo" : "Zobrazit heslo"}
          >
            {showPassword ? "Skrýt" : "Zobrazit"}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 rounded-xl bg-gradient-to-r from-gold to-gold-light px-4 py-3 text-base font-semibold text-base-950 transition hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "Přihlašuji…" : "Přihlásit se"}
      </button>

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={googleSubmitting}
        className="flex items-center justify-center gap-2 rounded-xl border border-glass-border bg-white/5 px-4 py-3 text-base font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
      >
        <GoogleIcon />
        {googleSubmitting ? "Přesměrovávám…" : "Přihlásit se přes Google"}
      </button>

      <Link
        href="/zapomenute-heslo"
        className="mt-1 text-center text-sm text-turquoise-light hover:underline"
      >
        Zapomenuté heslo
      </Link>
    </form>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.9 32.5 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.5 0-14 4.2-17.7 10.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.4 0 10.3-2.1 14-5.5l-6.5-5.4C29.4 34.7 26.8 36 24 36c-5.3 0-9.8-3.4-11.4-8.1l-6.6 5.1C9.9 39.7 16.4 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.9 2.7-2.7 4.9-5 6.4l6.5 5.4C39.8 37 44 31 44 24c0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  );
}
