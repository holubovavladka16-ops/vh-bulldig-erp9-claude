import FieldComparisonRow from "./FieldComparisonRow";
import type { DayComparison } from "@/lib/paperFormComparison";

export default function DayComparisonCard({ day }: { day: DayComparison }) {
  return (
    <div className="rounded-xl border border-glass-border bg-white/5 p-4">
      <p className="mb-2 text-sm font-semibold text-white">Den {day.day}</p>
      {day.nelzePrecist ? (
        <p className="text-xs text-white/40">Tento den nebylo možné z fotografie přečíst.</p>
      ) : (
        <div>
          {day.fields.map((f) => (
            <FieldComparisonRow key={f.field} field={f} />
          ))}
        </div>
      )}
    </div>
  );
}
