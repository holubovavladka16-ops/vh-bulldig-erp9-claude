"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import CompanyLogo from "@/components/CompanyLogo";

const DISPLAY_MS = 10_000;
const DEV_AUTO_LOGIN =
  process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN === "true" ||
  process.env.NODE_ENV === "development";

function WelcomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("company_branding")
      .select("logo_url")
      .maybeSingle()
      .then(({ data }) => setLogoUrl((data as { logo_url: string | null } | null)?.logo_url ?? null));
  }, []);

  useEffect(() => {
    // Jemný nástup animace při vykreslení.
    const raf = requestAnimationFrame(() => setVisible(true));

    const next = searchParams.get("next") || "/dashboard";

    if (DEV_AUTO_LOGIN) {
      router.replace(next);
      return;
    }

    const timer = setTimeout(() => {
      router.replace(next);
    }, DISPLAY_MS);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [router, searchParams]);

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-base-950 px-6">
      {/* Jemný vodoznak na pozadí */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center font-display text-[18vw] font-bold text-white/[0.03]"
      >
        VH
      </div>

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-turquoise/10 blur-3xl" />
      </div>

      <div
        className={`relative z-10 flex flex-col items-center gap-6 text-center transition-all duration-700 ease-out ${
          visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
        <div className="shadow-lg">
          <CompanyLogo logoUrl={logoUrl} size={80} />
        </div>

        <p className="max-w-md font-body text-lg leading-relaxed text-white">
          Dobrý den, vítejte. Přeji Vám krásný, úspěšný a bezpečný pracovní den.
        </p>

        <div className="h-1 w-40 overflow-hidden rounded-full bg-white/10">
          <div className="h-full animate-[welcomeBar_10s_linear_forwards] bg-gradient-to-r from-gold to-turquoise" />
        </div>
      </div>

      <style>{`
        @keyframes welcomeBar {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </main>
  );
}

export default function WelcomePage() {
  return (
    <Suspense fallback={null}>
      <WelcomeContent />
    </Suspense>
  );
}
