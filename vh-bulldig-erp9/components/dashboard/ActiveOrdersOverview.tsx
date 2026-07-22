import Link from "next/link";

export default function ActiveOrdersOverview() {
  return (
    <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-white/50">
          Aktivní zakázky
        </h2>
      </div>

      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-glass-border py-10 text-center">
        <p className="text-sm text-white/40">
          Zatím nejsou k dispozici žádné zakázky.
        </p>
        <p className="text-xs text-white/25">
          Přehled se automaticky naplní po vytvoření modulu Zakázky.
        </p>
      </div>

      <div className="mt-4 text-center">
        <Link
          href="/moduly/zakazky"
          className="inline-block rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
        >
          Zobrazit všechny zakázky
        </Link>
      </div>
    </section>
  );
}
