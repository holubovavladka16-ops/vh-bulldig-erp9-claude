import { Briefcase, Users, FileCheck, TrendingUp } from "lucide-react";
import StatCard from "./StatCard";

interface Props {
  canSeeFinancials: boolean;
  monthlyProfit?: { invoicedAmount: number; totalCosts: number; result: number } | null;
}

export default function StatCardsGrid({ canSeeFinancials, monthlyProfit }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Aktivní zakázky"
        icon={Briefcase}
        href="/moduly/zakazky"
        rows={[]}
        pending
        pendingNote="Zobrazí se po vytvoření modulu Zakázky."
      />
      <StatCard
        title="Zaměstnanci dnes"
        icon={Users}
        href="/moduly/dochazka"
        rows={[]}
        pending
        pendingNote="Zobrazí se po vytvoření modulů Zaměstnanci a Docházka."
      />
      <StatCard
        title="Výkazy ke kontrole"
        icon={FileCheck}
        href="/moduly/vykazy"
        rows={[]}
        pending
        pendingNote="Zobrazí se po vytvoření modulu Výkazy."
      />
      {canSeeFinancials && (
        monthlyProfit ? (
          <StatCard
            title="Měsíční zisk"
            icon={TrendingUp}
            href="/moduly/fakturace-a-prehled-zisku"
            rows={[
              { label: "Vyfakturováno", value: `${monthlyProfit.invoicedAmount.toLocaleString("cs-CZ")} Kč` },
              { label: "Náklady", value: `${monthlyProfit.totalCosts.toLocaleString("cs-CZ")} Kč` },
              {
                label: monthlyProfit.result >= 0 ? "Zisk" : "Ztráta",
                value: `${monthlyProfit.result.toLocaleString("cs-CZ")} Kč`,
                tone: monthlyProfit.result > 0 ? "positive" : monthlyProfit.result < 0 ? "negative" : "default",
              },
            ]}
          />
        ) : (
          <StatCard
            title="Měsíční zisk"
            icon={TrendingUp}
            href="/moduly/fakturace-a-prehled-zisku"
            rows={[]}
            pending
            pendingNote="Zatím nejsou evidované žádné fakturované částky za tento měsíc."
          />
        )
      )}
    </div>
  );
}
