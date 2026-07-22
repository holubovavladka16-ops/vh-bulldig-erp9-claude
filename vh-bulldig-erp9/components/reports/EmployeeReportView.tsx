import { UNIT_LABELS } from "@/lib/pricing";
import { formatMinutes, formatMoney } from "@/lib/attendance";
import type { EmployeeReport } from "@/lib/reports";

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-glass-border bg-glass-fill p-4 text-center shadow-lg backdrop-blur-xs">
      <p className="font-display text-lg font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-white/40">{label}</p>
    </div>
  );
}

export default function EmployeeReportView({ report }: { report: EmployeeReport }) {
  const { employee, totals } = report;

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
        <h2 className="font-display text-lg font-semibold text-white">
          {employee.first_name} {employee.last_name}
        </h2>
        <p className="text-sm text-white/50">{employee.position}</p>
        <p className="mt-2 text-xs text-white/40">
          Období: {report.dateFrom || "—"} – {report.dateTo || "—"} · Zakázky: {report.orderNames.join(", ") || "—"}
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <SummaryCard label="Pracovní dny" value={String(report.workDays)} />
        <SummaryCard label="Hodiny výkonu" value={`${totals.hoursWorked} hod`} />
        <SummaryCard label="Ruční výkop" value={`${totals.manualDigBm} bm`} />
        <SummaryCard label="Průrazy" value={`${totals.breakthroughsKs} ks`} />
        <SummaryCard label="Demontáž dlažby" value={`${totals.pavingRemovalM2} m²`} />
        <SummaryCard label="Pokládka dlažby" value={`${totals.pavingLayingM2} m²`} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard label="Celkový výdělek" value={formatMoney(report.totalEarnings)} />
        <SummaryCard label="Celkové zálohy" value={formatMoney(report.totalAdvances)} />
        <SummaryCard label="Doplatek" value={formatMoney(report.totalBalance)} />
      </div>

      {totals.otherActivities.length > 0 && (
        <section className="rounded-2xl border border-glass-border bg-glass-fill p-5 shadow-lg backdrop-blur-xs">
          <h3 className="mb-2 text-sm font-semibold text-white/60">Ostatní činnosti</h3>
          {totals.otherActivities.map((o) => (
            <div key={o.name} className="flex justify-between border-b border-white/5 py-1 text-sm last:border-0">
              <span className="text-white/60">{o.name}</span>
              <span className="text-white/85">
                {o.quantity} {UNIT_LABELS[o.unit as keyof typeof UNIT_LABELS] ?? o.unit}
              </span>
            </div>
          ))}
        </section>
      )}

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
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-white">{new Date(d.record.record_date).toLocaleDateString("cs-CZ")}</p>
                  <p className="text-xs text-white/40">{d.orderName}</p>
                </div>
                <p className="mt-1 text-xs text-white/40">
                  Přítomnost: {d.record.work_start ?? "—"}–{d.record.work_end ?? "—"} ({formatMinutes(d.record.presence_total_minutes)})
                </p>
                <ul className="mt-2 flex flex-col gap-1">
                  {d.workItems.map((item) => (
                    <li key={item.id} className="flex justify-between text-xs text-white/60">
                      <span>{item.activity_name}</span>
                      <span>
                        {item.quantity} {UNIT_LABELS[item.unit]} × {formatMoney(item.unit_price)} = {formatMoney(item.total_price)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex justify-between border-t border-white/5 pt-2 text-sm">
                  <span className="text-white/50">Denní výdělek / záloha / doplatek</span>
                  <span className="font-medium text-turquoise-light">
                    {formatMoney(d.record.total_earnings)} / {formatMoney(d.record.daily_advance)} / {formatMoney(d.record.balance_due)}
                  </span>
                </div>
                {d.record.note && <p className="mt-1 text-xs text-white/30">{d.record.note}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
