import Link from "next/link";
import { FileText, Clock, BookOpen, MapPin, Receipt, PlusCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ACTIONS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Nový výkaz", href: "/moduly/vykazy", icon: FileText },
  { label: "Docházka", href: "/moduly/dochazka", icon: Clock },
  { label: "Stavební deník", href: "/moduly/stavebni-denik", icon: BookOpen },
  { label: "GPS trasa", href: "/moduly/foto-gps", icon: MapPin },
  { label: "Přidat náklad", href: "/moduly/naklady", icon: Receipt },
  { label: "Přidat zakázku", href: "/moduly/zakazky", icon: PlusCircle },
];

export default function QuickActions() {
  return (
    <section>
      <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
        Rychlé akce
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {ACTIONS.map(({ label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="flex flex-col items-center gap-2 rounded-2xl border border-glass-border bg-glass-fill px-3 py-4 text-center text-xs font-medium text-white/80 shadow-lg backdrop-blur-xs transition hover:border-turquoise/40 hover:bg-white/[0.06] hover:text-white"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-turquoise">
              <Icon size={18} />
            </span>
            {label}
          </Link>
        ))}
      </div>
    </section>
  );
}
