import { formatMoney } from "@/lib/attendance";
import type { OrderReport } from "@/lib/reports";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-glass-border bg-glass-fill p-4 text-center shadow-lg backdrop-blur-xs">
      <p className="font-display text-lg font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-white/40">{label}</p>
    </div>
  );
}

export default function OrderReportView({ report }: { report: OrderReport }) {
  const { order, totals } = report;

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-white">{order.name}</h2>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="mt-2 text-xs text-white/40">
          Období: {report.dateFrom || "—"} – {report.dateTo || "—"}
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <SummaryCard label="Zaměstnanci" value={String(report.employees.length)} />
        <SummaryCard label="Pracovní dny" value={String(report.workDays)} />
        <SummaryCard label="Hodiny výkonu" value={`${totals.hoursWorked} hod`} />
        <SummaryCard label="Ruční výkop" value={`${totals.manualDigBm} bm`} />
        <SummaryCard label="Průrazy" value={`${totals.breakthroughsKs} ks`} />
        <SummaryCard label="Mzdové náklady" value={formatMoney(report.totalLaborCost)} />
      </div>

      <section>
        <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
          Zaměstnanci na zakázce
        </h3>
        {report.employees.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-glass-border p-10 text-center text-sm text-white/40">
            Žádní zaměstnanci se schválenými záznamy v tomto období.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {report.employees.map((e) => (
              <div key={e.employee.id} className="rounded-2xl border border-glass-border bg-glass-fill p-4 shadow-lg backdrop-blur-xs">
                <p className="font-medium text-white">{e.employee.first_name} {e.employee.last_name}</p>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-white/50 sm:grid-cols-4">
                  <span>Dny: {e.workDays}</span>
                  <span>Hodiny: {e.hoursWorked}</span>
                  <span>Výdělek: {formatMoney(e.totalEarnings)}</span>
                  <span>Doplatek: {formatMoney(e.totalBalance)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-white/50">
          Detail jednotlivých dnů
        </h3>
        {report.days.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-glass-border p-10 text-center text-sm text-white/40">
            Žádné schválené záznamy v tomto období.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {report.days.map((d) => (
              <div key={d.record.id} className="rounded-2xl border border-glass-border bg-glass-fill p-4 shadow-lg backdrop-blur-xs">
                <div className="flex justify-between text-sm">
                  <span className="text-white">{new Date(d.record.record_date).toLocaleDateString("cs-CZ")}</span>
                  <span className="font-medium text-turquoise-light">{formatMoney(d.record.total_earnings)}</span>
                </div>
                <p className="mt-1 text-xs text-white/40">
                  Přítomnost: {d.record.work_start ?? "—"}–{d.record.work_end ?? "—"}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
