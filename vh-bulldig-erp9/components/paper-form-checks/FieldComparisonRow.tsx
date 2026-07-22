import type { FieldComparison } from "@/lib/paperFormComparison";

const FIELD_LABELS: Record<string, string> = {
  zakazka: "Zakázka",
  od: "Od",
  do: "Do",
  hodin: "Celkem hodin",
  vykop: "Ruční výkop bm",
  pruraz: "Průrazy ks",
  zaloha: "Záloha Kč",
  dny: "Celkem pracovních dnů",
};

const DOT_CLASSES: Record<string, string> = {
  shoda: "bg-emerald-400",
  neshoda: "bg-red-400",
  chybi: "bg-amber-400",
  nelze_precist: "bg-white/30",
};

const TEXT: Record<string, string> = {
  shoda: "Data se shodují",
  neshoda: "Data se neshodují",
  chybi: "Údaj chybí",
  nelze_precist: "Nelze přečíst",
};

export default function FieldComparisonRow({ field }: { field: FieldComparison }) {
  return (
    <div className="flex flex-col gap-1 border-b border-white/5 py-2 last:border-0">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${DOT_CLASSES[field.result]}`} />
        <span className="text-xs font-medium text-white/70">{FIELD_LABELS[field.field] ?? field.field}</span>
        <span className="ml-auto text-xs text-white/50">{TEXT[field.result]}</span>
      </div>
      {field.result !== "shoda" && (
        <div className="ml-4 grid grid-cols-3 gap-2 text-[11px] text-white/40">
          <span>Papír: {field.paperValue}</span>
          <span>ERP: {field.erpValue}</span>
          <span>{field.difference ? `Rozdíl: ${field.difference}` : ""}</span>
        </div>
      )}
    </div>
  );
}
