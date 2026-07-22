import { AlertTriangle } from "lucide-react";

export default function Alerts() {
  return (
    <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
      <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
        Upozornění
      </h2>

      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-glass-border py-8 text-center">
        <AlertTriangle size={20} className="text-white/25" />
        <p className="text-sm text-white/40">Zatím nejsou žádná upozornění.</p>
        <p className="text-xs text-white/25">
          Upozornění se začnou zobrazovat po vytvoření souvisejících modulů
          (Docházka, Výkazy, Faktury, Fotodokumentace s GPS, Stavební deník,
          Náklady, Individuální ceník).
        </p>
      </div>
    </section>
  );
}
