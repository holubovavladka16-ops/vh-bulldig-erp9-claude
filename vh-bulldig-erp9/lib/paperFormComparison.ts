import { categorizeWorkItems } from "@/lib/reports";
import type { AttendanceRecord, AttendanceWorkItem, PricingUnit } from "@/types/database.types";

export type FieldResult = "shoda" | "neshoda" | "chybi" | "nelze_precist";

export interface RecognizedDay {
  day: number;
  nelzePrecist: boolean;
  zakazka: string;
  od: string;
  do: string;
  hodin: string;
  vykop: string;
  pruraz: string;
  zaloha: string;
  podpis: boolean;
}

export interface RecognizedSummary {
  dny: string;
  hodin: string;
  vykop: string;
  pruraz: string;
  zaloha: string;
}

export type SignatureAnswer = "uveden" | "chybi" | "nelze_rozpoznat";

export interface RecognizedSignatures {
  zamestnanec: SignatureAnswer;
  vedouci: SignatureAnswer;
}

export interface RecognizedData {
  formNumber: string;
  employeeName: string;
  month: number;
  year: number;
  days: RecognizedDay[];
  summary: RecognizedSummary;
  signatures: RecognizedSignatures;
}

export interface ErpDay {
  day: number;
  zakazka: string;
  od: string;
  do: string;
  hodin: number;
  vykop: number;
  pruraz: number;
  zaloha: number;
  hasRecord: boolean;
}

export interface FieldComparison {
  field: string;
  paperValue: string;
  erpValue: string;
  result: FieldResult;
  difference: string | null;
}

export interface DayComparison {
  day: number;
  nelzePrecist: boolean;
  fields: FieldComparison[];
  overallDayResult: FieldResult;
}

export interface ComparisonResult {
  days: DayComparison[];
  summary: FieldComparison[];
  signatures: RecognizedSignatures;
  overallResult: "shoda" | "castecna_shoda" | "neshoda" | "nelze_precist";
}

const UNIT_LABEL: Record<PricingUnit, string> = { hod: "hod", bm: "bm", ks: "ks", m2: "m²", den: "den" };

/** Sestaví ERP pohled na docházku zaměstnance pro daný měsíc - pouze
 * schválené záznamy (bod 11). Hodiny výkonu se berou VÝHRADNĚ ze
 * samostatné aktivity "Hodinová sazba", nikdy z evidence přítomnosti
 * od-do (bod 12). */
export function buildErpDays(
  records: AttendanceRecord[],
  itemsByRecordId: Record<string, AttendanceWorkItem[]>,
  daysInMonth: number
): Record<number, ErpDay> {
  const result: Record<number, ErpDay> = {};
  const approved = records.filter((r) => r.status === "schvaleny");

  for (const r of approved) {
    const day = Number(r.record_date.slice(8, 10));
    const items = itemsByRecordId[r.id] ?? [];
    const totals = categorizeWorkItems(items);
    result[day] = {
      day,
      zakazka: "",
      od: r.work_start ?? "",
      do: r.work_end ?? "",
      hodin: totals.hoursWorked,
      vykop: totals.manualDigBm,
      pruraz: totals.breakthroughsKs,
      zaloha: Number(r.daily_advance),
      hasRecord: true,
    };
  }

  for (let d = 1; d <= daysInMonth; d++) {
    if (!result[d]) {
      result[d] = { day: d, zakazka: "", od: "", do: "", hodin: 0, vykop: 0, pruraz: 0, zaloha: 0, hasRecord: false };
    }
  }

  return result;
}

function compareNumeric(field: string, paper: string, erp: number, hasErp: boolean): FieldComparison {
  const paperTrim = paper.trim();
  if (paperTrim === "" || !hasErp) {
    return { field, paperValue: paperTrim || "—", erpValue: hasErp ? String(erp) : "—", result: "chybi", difference: null };
  }
  const paperNum = Number(paperTrim.replace(",", "."));
  if (Number.isNaN(paperNum)) {
    return { field, paperValue: paperTrim, erpValue: String(erp), result: "neshoda", difference: null };
  }
  const diff = Math.round((paperNum - erp) * 100) / 100;
  return {
    field,
    paperValue: paperTrim,
    erpValue: String(erp),
    result: Math.abs(diff) < 0.01 ? "shoda" : "neshoda",
    difference: Math.abs(diff) < 0.01 ? null : String(diff),
  };
}

function compareText(field: string, paper: string, erp: string, hasErp: boolean): FieldComparison {
  const paperTrim = paper.trim();
  const erpTrim = erp.trim();
  if (paperTrim === "" || (!hasErp && erpTrim === "")) {
    return { field, paperValue: paperTrim || "—", erpValue: erpTrim || "—", result: "chybi", difference: null };
  }
  const match = paperTrim.toLowerCase() === erpTrim.toLowerCase();
  return { field, paperValue: paperTrim, erpValue: erpTrim || "—", result: match ? "shoda" : "neshoda", difference: null };
}

export function compareForm(
  recognized: RecognizedData,
  erpDays: Record<number, ErpDay>,
  orderNameByDay: Record<number, string>,
  erpSummary: { dny: number; hodin: number; vykop: number; pruraz: number; zaloha: number }
): ComparisonResult {
  const days: DayComparison[] = recognized.days.map((rd) => {
    if (rd.nelzePrecist) {
      const fieldsList = ["zakazka", "od", "do", "hodin", "vykop", "pruraz", "zaloha"];
      return {
        day: rd.day,
        nelzePrecist: true,
        fields: fieldsList.map((f) => ({ field: f, paperValue: "Nelze přečíst", erpValue: "—", result: "nelze_precist" as FieldResult, difference: null })),
        overallDayResult: "nelze_precist" as FieldResult,
      };
    }

    const erp = erpDays[rd.day];
    const fields: FieldComparison[] = [
      compareText("zakazka", rd.zakazka, orderNameByDay[rd.day] ?? "", erp?.hasRecord ?? false),
      compareText("od", rd.od, erp?.od ?? "", erp?.hasRecord ?? false),
      compareText("do", rd.do, erp?.do ?? "", erp?.hasRecord ?? false),
      compareNumeric("hodin", rd.hodin, erp?.hodin ?? 0, erp?.hasRecord ?? false),
      compareNumeric("vykop", rd.vykop, erp?.vykop ?? 0, erp?.hasRecord ?? false),
      compareNumeric("pruraz", rd.pruraz, erp?.pruraz ?? 0, erp?.hasRecord ?? false),
      compareNumeric("zaloha", rd.zaloha, erp?.zaloha ?? 0, erp?.hasRecord ?? false),
    ];

    const allShoda = fields.every((f) => f.result === "shoda");

    return {
      day: rd.day,
      nelzePrecist: false,
      fields,
      overallDayResult: allShoda ? "shoda" : "neshoda",
    };
  });

  const summary: FieldComparison[] = [
    compareNumeric("dny", recognized.summary.dny, erpSummary.dny, true),
    compareNumeric("hodin", recognized.summary.hodin, erpSummary.hodin, true),
    compareNumeric("vykop", recognized.summary.vykop, erpSummary.vykop, true),
    compareNumeric("pruraz", recognized.summary.pruraz, erpSummary.pruraz, true),
    compareNumeric("zaloha", recognized.summary.zaloha, erpSummary.zaloha, true),
  ];

  const allFieldResults = [
    ...days.flatMap((d) => d.fields.map((f) => f.result)),
    ...summary.map((f) => f.result),
  ];

  const allIllegible = days.length > 0 && days.every((d) => d.nelzePrecist);
  const shodaCount = allFieldResults.filter((r) => r === "shoda").length;
  const comparableCount = allFieldResults.filter((r) => r !== "nelze_precist").length;

  let overallResult: ComparisonResult["overallResult"];
  if (allIllegible || comparableCount === 0) {
    overallResult = "nelze_precist";
  } else if (shodaCount === comparableCount) {
    overallResult = "shoda";
  } else if (shodaCount === 0) {
    overallResult = "neshoda";
  } else {
    overallResult = "castecna_shoda";
  }

  return { days, summary, signatures: recognized.signatures, overallResult };
}

export { UNIT_LABEL };
