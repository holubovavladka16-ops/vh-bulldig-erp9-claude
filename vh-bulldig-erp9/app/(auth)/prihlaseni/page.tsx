import { Suspense } from "react";
import LoginForm from "./LoginForm";
import CompanyLogo from "@/components/CompanyLogo";
import { getPublicBranding } from "@/lib/supabase/publicBranding";

export const metadata = {
  title: "Přihlášení | VH Bulldig ERP 9",
};

export default async function LoginPage() {
  const branding = await getPublicBranding();

  return (
    <main className="flex min-h-dvh items-center justify-center bg-base-950 px-4 py-10">
      {/* Jemné ambientní pozadí Design 2 - zlatý a tyrkysový akcent */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-turquoise/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm rounded-3xl border border-glass-border bg-glass-fill p-8 shadow-2xl backdrop-blur-xs">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <CompanyLogo logoUrl={branding?.logo_url ?? null} />
          <h1 className="font-display text-xl font-semibold tracking-tight text-white">
            VH Bulldig ERP 9
          </h1>
        </div>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
