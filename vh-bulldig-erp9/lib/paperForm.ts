export const MONTH_NAMES = [
  "Leden", "Únor", "Březen", "Duben", "Květen", "Červen",
  "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec",
];

export interface DayRow {
  day: number;
  date: string; // DD.MM.
}

export function daysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

export function buildDayRows(month: number, year: number): DayRow[] {
  const total = daysInMonth(month, year);
  const rows: DayRow[] = [];
  for (let d = 1; d <= total; d++) {
    rows.push({ day: d, date: `${String(d).padStart(2, "0")}.${String(month).padStart(2, "0")}.` });
  }
  return rows;
}

export const PAPER_FORM_STATUS_LABELS: Record<string, string> = {
  vytvoreny: "Vytvořený",
  vytisteny: "Vytištěný",
  prirazeny: "Přiřazený",
  odevzdany: "Odevzdaný",
  zkontrolovany: "Zkontrolovaný",
  uzavreny: "Uzavřený",
  zneplatneny: "Zneplatněný",
};
