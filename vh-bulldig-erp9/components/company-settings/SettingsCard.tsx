interface Props {
  title: string;
  children: React.ReactNode;
  footnote?: string;
}

export default function SettingsCard({ title, children, footnote }: Props) {
  return (
    <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
      <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
        {title}
      </h2>
      {children}
      {footnote && <p className="mt-3 text-xs text-white/40">{footnote}</p>}
    </section>
  );
}
