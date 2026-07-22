"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toCzechAuthError } from "@/lib/authErrors";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Zadaná hesla se neshodují.");
      return;
    }
    if (password.length < 8) {
      setError("Heslo musí mít alespoň 8 znaků.");
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (updateError) {
      setError(toCzechAuthError(updateError.message));
      return;
    }

    setDone(true);
    setTimeout(() => router.replace("/prihlaseni"), 2000);
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-base-950 px-4 py-10">
      <div className="w-full max-w-sm rounded-3xl border border-glass-border bg-glass-fill p-8 shadow-2xl backdrop-blur-xs">
        <h1 className="mb-6 text-center font-display text-lg font-semibold text-white">
          Nastavení nového hesla
        </h1>

        {done ? (
          <p className="rounded-lg bg-turquoise/10 px-3 py-3 text-center text-sm text-turquoise-light">
            Heslo bylo úspěšně změněno. Přesměrovávám na přihlášení…
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm text-white/70">
                Nové heslo
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl border border-glass-border bg-white/5 px-4 py-3 text-base text-white outline-none focus:border-turquoise focus:ring-1 focus:ring-turquoise"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirmPassword" className="text-sm text-white/70">
                Potvrzení hesla
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="rounded-xl border border-glass-border bg-white/5 px-4 py-3 text-base text-white outline-none focus:border-turquoise focus:ring-1 focus:ring-turquoise"
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
              {submitting ? "Ukládám…" : "Uložit nové heslo"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
