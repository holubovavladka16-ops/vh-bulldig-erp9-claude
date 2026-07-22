const ITEMS = [
  { label: "Zaměstnanci v práci" },
  { label: "Aktivní zakázky" },
  { label: "Dnešní záznamy docházky" },
  { label: "Dnešní výkazy" },
  { label: "Dnešní fotografie s GPS" },
  { label: "Dnešní záznamy stavebního deníku" },
];

export default function DayOverview() {
  return (
    <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
      <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
        Přehled dne
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {ITEMS.map((item) => (
          <div key={item.label} className="text-center">
            <p className="font-display text-2xl font-semibold text-white/30">–</p>
            <p className="mt-1 text-xs text-white/40">{item.label}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-xs text-white/25">
        Čísla se automaticky naplní po vytvoření souvisejících modulů.
      </p>
    </section>
  );
}
