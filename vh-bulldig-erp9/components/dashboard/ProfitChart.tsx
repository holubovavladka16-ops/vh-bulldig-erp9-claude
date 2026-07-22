"use client";

import { useState } from "react";
import Link from "next/link";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

export default function ProfitChart() {
  const [year, setYear] = useState(CURRENT_YEAR);

  return (
    <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-white/50">
          Vývoj zisku
        </h2>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="rounded-lg border border-glass-border bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-turquoise"
        >
          {YEARS.map((y) => (
            <option key={y} value={y} className="bg-base-900">
              {y}
            </option>
          ))}
        </select>
      </div>

      <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-glass-border text-center">
        <p className="text-sm text-white/40">
          Data za rok {year} zatím nejsou k dispozici.
        </p>
        <p className="text-xs text-white/25">
          Graf se automaticky naplní po vytvoření modulu Fakturace a přehled zisku.
        </p>
      </div>

      <div className="mt-4 text-center">
        <Link
          href="/moduly/fakturace-a-prehled-zisku"
          className="inline-block rounded-xl border border-glass-border px-4 py-2 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
        >
          Detailní přehled
        </Link>
      </div>
    </section>
  );
}
