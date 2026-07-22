interface Props {
  logoUrl: string | null;
  size?: number;
}

export default function CompanyLogo({ logoUrl, size = 64 }: Props) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt="Logo společnosti"
        style={{ width: size, height: size }}
        className="rounded-2xl border border-glass-border bg-white/5 object-contain p-1"
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded-2xl border border-glass-border bg-white/5 font-display text-xl font-bold text-gold"
    >
      VH
    </div>
  );
}
