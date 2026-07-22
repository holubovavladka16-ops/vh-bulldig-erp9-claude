import { notFound } from "next/navigation";
import Link from "next/link";
import { findModule } from "@/lib/modules";

export default function PendingModulePage({ params }: { params: { modul: string } }) {
  const mod = findModule(params.modul);

  if (!mod) {
    notFound();
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-base-950 px-4 text-center">
      <p className="rounded-2xl border border-glass-border bg-glass-fill px-6 py-8 shadow-lg backdrop-blur-xs">
        <span className="block font-display text-lg font-semibold text-white">
          {mod!.label}
        </span>
        <span className="mt-2 block text-sm text-white/50">
          Tento modul zatím nebyl vytvořen. Bude vytvořen jako samostatný
          modul na základě dalšího příkazu.
        </span>
      </p>
      <Link
        href="/dashboard"
        className="rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
      >
        Zpět na Dashboard
      </Link>
    </main>
  );
}
