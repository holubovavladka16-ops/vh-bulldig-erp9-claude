"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toCzechAuthError } from "@/lib/authErrors";

export default function ForgottenPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/obnoveni-hesla`,
    });

    setSubmitting(false);

    if (resetError) {
      setError(toCzechAuthError(resetError.message));
      return;
    }

    setSent(true);
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-base-950 px-4 py-10">
      <div className="w-full max-w-sm rounded-3xl border border-glass-border bg-glass-fill p-8 shadow-2xl backdrop-blur-xs">
        <h1 className="mb-6 text-center font-display text-lg font-semibold text-white">
          Zapomenuté heslo
        </h1>

        {sent ? (
          <p className="rounded-lg bg-turquoise/10 px-3 py-3 text-center text-sm text-turquoise-light">
            Odkaz pro obnovení hesla byl odeslán na váš e-mail.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm text-white/70">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl border border-glass-border bg-white/5 px-4 py-3 text-base text-white outline-none focus:border-turquoise focus:ring-1 focus:ring-turquoise"
                placeholder="vas@email.cz"
              />
            </div>

            {error && (
              <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-gradient-to-r from-gold to-gold-light px-4 py-3 font-semibold text-base-950 transition hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Odesílám…" : "Odeslat odkaz pro obnovení hesla"}
            </button>
          </form>
        )}

        <Link
          href="/prihlaseni"
          className="mt-6 block text-center text-sm text-turquoise-light hover:underline"
        >
          Zpět na přihlášení
        </Link>
      </div>
    </main>
  );
}
