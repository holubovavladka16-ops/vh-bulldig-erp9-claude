import type { DocumentType } from "@/types/database.types";

export interface DocumentTypeDef {
  key: DocumentType;
  label: string;
  needsEmployee: boolean;
  needsOrder: boolean;
  needsPeriod: boolean;
  needsConnection?: boolean;
}

export const DOCUMENT_TYPES: DocumentTypeDef[] = [
  { key: "firemni_udaje", label: "Firemní údaje", needsEmployee: false, needsOrder: false, needsPeriod: false },
  { key: "karta_zamestnance", label: "Karta zaměstnance", needsEmployee: true, needsOrder: false, needsPeriod: false },
  { key: "seznam_zamestnancu", label: "Seznam zaměstnanců", needsEmployee: false, needsOrder: false, needsPeriod: false },
  { key: "dochazka_zamestnance", label: "Docházka zaměstnance", needsEmployee: true, needsOrder: false, needsPeriod: true },
  { key: "dochazka_za_obdobi", label: "Docházka za období", needsEmployee: false, needsOrder: false, needsPeriod: true },
  { key: "vykaz_zamestnance", label: "Výkaz zaměstnance", needsEmployee: true, needsOrder: false, needsPeriod: true },
  { key: "vykaz_zakazky", label: "Výkaz zakázky", needsEmployee: false, needsOrder: true, needsPeriod: true },
  { key: "prehled_nakladu", label: "Přehled nákladů", needsEmployee: false, needsOrder: true, needsPeriod: true },
  { key: "stavebni_denik", label: "Stavební deník", needsEmployee: false, needsOrder: true, needsPeriod: true },
  { key: "fakturace_a_prehled_zisku", label: "Fakturace a přehled zisku", needsEmployee: false, needsOrder: true, needsPeriod: true },
  { key: "kompletni_mzdovy_prehled", label: "Kompletní mzdový přehled", needsEmployee: false, needsOrder: false, needsPeriod: true },
  { key: "vyplatni_paska", label: "Výplatní páska", needsEmployee: true, needsOrder: false, needsPeriod: true },
  { key: "dokumentace_pripojky", label: "Dokumentace přípojky", needsEmployee: false, needsOrder: false, needsPeriod: false, needsConnection: true },
  { key: "gps_fotodokumentace", label: "GPS fotodokumentace", needsEmployee: false, needsOrder: false, needsPeriod: true },
];

export function documentTypeLabel(key: DocumentType): string {
  return DOCUMENT_TYPES.find((d) => d.key === key)?.label ?? key;
}
