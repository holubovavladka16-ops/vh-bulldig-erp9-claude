import type { DocumentCategoryV2, DocumentTypeV2 } from "@/types/database.types";

export interface VarField {
  key: string;
  label: string;
  type: "text" | "textarea" | "date" | "number";
}

export interface DocumentTypeDef {
  key: DocumentTypeV2;
  label: string;
  category: DocumentCategoryV2;
  numberPrefix: string;
  fields: VarField[];
}

export const DOCUMENT_TYPE_DEFS: DocumentTypeDef[] = [
  {
    key: "pracovni_smlouva", label: "Pracovní smlouva", category: "pracovnepravni", numberPrefix: "PS",
    fields: [
      { key: "workplace", label: "Místo výkonu práce", type: "text" },
      { key: "jobType", label: "Druh práce", type: "text" },
      { key: "employmentStartDate", label: "Datum vzniku pracovního poměru", type: "date" },
      { key: "employmentLength", label: "Délka pracovního poměru", type: "text" },
      { key: "probationPeriod", label: "Zkušební doba", type: "text" },
      { key: "workingHours", label: "Pracovní doba", type: "text" },
      { key: "salaryConditions", label: "Mzdové podmínky", type: "textarea" },
      { key: "payDay", label: "Výplatní termín", type: "text" },
      { key: "employeeDuties", label: "Povinnosti zaměstnance", type: "textarea" },
      { key: "employerDuties", label: "Povinnosti zaměstnavatele", type: "textarea" },
      { key: "finalProvisions", label: "Závěrečná ustanovení", type: "textarea" },
      { key: "signDate", label: "Datum podpisu", type: "date" },
      { key: "signPlace", label: "Místo podpisu", type: "text" },
    ],
  },
  {
    key: "dpp", label: "Dohoda o provedení práce – DPP", category: "pracovnepravni", numberPrefix: "DPP",
    fields: [
      { key: "startDate", label: "Datum zahájení", type: "date" },
      { key: "endDate", label: "Datum ukončení", type: "date" },
      { key: "workDescription", label: "Druh sjednané práce", type: "textarea" },
      { key: "workplace", label: "Místo výkonu práce", type: "text" },
      { key: "scope", label: "Rozsah práce", type: "text" },
      { key: "maxScope", label: "Maximální rozsah podle platných pravidel", type: "text" },
      { key: "remuneration", label: "Odměna", type: "text" },
      { key: "paymentMethod", label: "Způsob výplaty", type: "text" },
      { key: "paymentTerm", label: "Termín výplaty", type: "text" },
      { key: "terminationConditions", label: "Podmínky ukončení", type: "textarea" },
      { key: "duties", label: "Povinnosti stran", type: "textarea" },
    ],
  },
  {
    key: "dpc", label: "Dohoda o pracovní činnosti – DPČ", category: "pracovnepravni", numberPrefix: "DPC",
    fields: [
      { key: "startDate", label: "Datum zahájení", type: "date" },
      { key: "endDate", label: "Datum ukončení", type: "date" },
      { key: "jobType", label: "Druh práce", type: "text" },
      { key: "workplace", label: "Místo výkonu práce", type: "text" },
      { key: "scope", label: "Sjednaný rozsah práce", type: "text" },
      { key: "remuneration", label: "Odměna", type: "text" },
      { key: "paymentMethod", label: "Způsob výplaty", type: "text" },
      { key: "paymentTerm", label: "Termín výplaty", type: "text" },
      { key: "terminationConditions", label: "Podmínky ukončení", type: "textarea" },
      { key: "duties", label: "Povinnosti stran", type: "textarea" },
    ],
  },
  {
    key: "dodatek_pracovni_smlouvy", label: "Dodatek k pracovní smlouvě", category: "pracovnepravni", numberPrefix: "DOD-PS",
    fields: [
      { key: "originalContractNumber", label: "Číslo původní smlouvy", type: "text" },
      { key: "changeDescription", label: "Přesný popis změny", type: "textarea" },
      { key: "originalWording", label: "Původní znění", type: "textarea" },
      { key: "newWording", label: "Nové znění", type: "textarea" },
    ],
  },
  {
    key: "dohoda_o_ukonceni", label: "Dohoda o ukončení pracovního poměru", category: "pracovnepravni", numberPrefix: "UKON",
    fields: [
      { key: "originalContractNumber", label: "Číslo původní smlouvy", type: "text" },
      { key: "terminationDate", label: "Datum ukončení pracovního poměru", type: "date" },
      { key: "reason", label: "Důvod ukončení", type: "textarea" },
      { key: "settlement", label: "Vypořádání závazků", type: "textarea" },
      { key: "propertyReturn", label: "Vrácení firemního majetku", type: "textarea" },
    ],
  },
  {
    key: "vypoved", label: "Výpověď", category: "pracovnepravni", numberPrefix: "VYP",
    fields: [
      { key: "deliveryDate", label: "Datum doručení", type: "date" },
      { key: "reason", label: "Výpovědní důvod", type: "textarea" },
      { key: "noticePeriod", label: "Výpovědní doba", type: "text" },
      { key: "endDate", label: "Datum ukončení", type: "date" },
      { key: "instructions", label: "Poučení", type: "textarea" },
    ],
  },
  {
    key: "potvrzeni_o_zamestnani", label: "Potvrzení o zaměstnání", category: "pracovnepravni", numberPrefix: "POTV",
    fields: [],
  },
  {
    key: "objednavka_praci", label: "Objednávka prací", category: "obchodni", numberPrefix: "OBJ",
    fields: [
      { key: "workplace", label: "Místo realizace", type: "text" },
      { key: "subject", label: "Předmět objednávky", type: "textarea" },
      { key: "scope", label: "Rozsah prací", type: "textarea" },
      { key: "startDate", label: "Termín zahájení", type: "date" },
      { key: "endDate", label: "Termín dokončení", type: "date" },
      { key: "price", label: "Cena", type: "number" },
      { key: "vat", label: "DPH", type: "number" },
      { key: "totalPrice", label: "Cena celkem", type: "number" },
      { key: "paymentTerms", label: "Platební podmínky", type: "textarea" },
      { key: "dueDate", label: "Splatnost", type: "text" },
      { key: "invoicingMethod", label: "Způsob fakturace", type: "text" },
      { key: "specialConditions", label: "Zvláštní podmínky", type: "textarea" },
    ],
  },
  {
    key: "smlouva_o_dilo", label: "Smlouva o dílo", category: "obchodni", numberPrefix: "SOD",
    fields: [
      { key: "subject", label: "Předmět díla", type: "textarea" },
      { key: "workplace", label: "Místo realizace", type: "text" },
      { key: "scope", label: "Rozsah prací", type: "textarea" },
      { key: "startDate", label: "Termín zahájení", type: "date" },
      { key: "endDate", label: "Termín dokončení", type: "date" },
      { key: "price", label: "Cena díla", type: "number" },
      { key: "vat", label: "DPH", type: "number" },
      { key: "totalPrice", label: "Cena celkem", type: "number" },
      { key: "paymentTerms", label: "Platební podmínky", type: "textarea" },
      { key: "advances", label: "Zálohy", type: "text" },
      { key: "invoicing", label: "Fakturace", type: "text" },
      { key: "handover", label: "Předání díla", type: "textarea" },
      { key: "defectLiability", label: "Odpovědnost za vady", type: "textarea" },
      { key: "warrantyPeriod", label: "Záruční doba", type: "text" },
      { key: "penalties", label: "Smluvní pokuty", type: "textarea" },
      { key: "clientDuties", label: "Povinnosti objednatele", type: "textarea" },
      { key: "contractorDuties", label: "Povinnosti zhotovitele", type: "textarea" },
      { key: "changeConditions", label: "Podmínky změn", type: "textarea" },
      { key: "terminationConditions", label: "Podmínky ukončení", type: "textarea" },
      { key: "finalProvisions", label: "Závěrečná ustanovení", type: "textarea" },
    ],
  },
  {
    key: "dodatek_smlouvy_o_dilo", label: "Dodatek ke smlouvě o dílo", category: "obchodni", numberPrefix: "DOD-SOD",
    fields: [
      { key: "originalContractNumber", label: "Číslo původní smlouvy", type: "text" },
      { key: "changeReason", label: "Důvod změny", type: "textarea" },
      { key: "originalWording", label: "Původní znění", type: "textarea" },
      { key: "newWording", label: "Nové znění", type: "textarea" },
      { key: "priceChange", label: "Změna ceny", type: "text" },
      { key: "termChange", label: "Změna termínu", type: "text" },
    ],
  },
  {
    key: "predavaci_protokol", label: "Předávací protokol", category: "obchodni", numberPrefix: "PP",
    fields: [
      { key: "handoverDate", label: "Datum předání", type: "date" },
      { key: "handoverPlace", label: "Místo předání", type: "text" },
      { key: "workDescription", label: "Popis předávaných prací", type: "textarea" },
      { key: "completedScope", label: "Rozsah dokončených prací", type: "textarea" },
      { key: "unfinishedWork", label: "Nedokončené práce", type: "textarea" },
      { key: "defects", label: "Zjištěné vady", type: "textarea" },
      { key: "defectDeadline", label: "Termín odstranění vad", type: "date" },
      { key: "handedDocuments", label: "Předané dokumenty", type: "text" },
      { key: "handedProperty", label: "Předané klíče nebo majetek", type: "text" },
      { key: "clientStatement", label: "Vyjádření objednatele", type: "textarea" },
      { key: "result", label: "Výsledek předání", type: "text" },
    ],
  },
  {
    key: "predavaci_protokol_zakazky", label: "Předávací protokol zakázky", category: "obchodni", numberPrefix: "PPZ",
    fields: [
      { key: "handoverDate", label: "Datum předání", type: "date" },
      { key: "handoverPlace", label: "Místo předání", type: "text" },
      { key: "workDescription", label: "Popis předávaných prací", type: "textarea" },
      { key: "completedScope", label: "Rozsah dokončených prací", type: "textarea" },
      { key: "defects", label: "Zjištěné vady", type: "textarea" },
      { key: "result", label: "Výsledek předání", type: "text" },
    ],
  },
  {
    key: "protokol_o_prevzeti_praci", label: "Protokol o převzetí prací", category: "obchodni", numberPrefix: "PPP",
    fields: [
      { key: "inspectionDate", label: "Datum kontroly", type: "date" },
      { key: "inspectedPart", label: "Kontrolovaná část prací", type: "text" },
      { key: "description", label: "Popis provedení", type: "textarea" },
      { key: "result", label: "Výsledek kontroly", type: "text" },
      { key: "defects", label: "Zjištěné vady", type: "textarea" },
      { key: "requiredFixes", label: "Požadované opravy", type: "textarea" },
      { key: "fixDeadline", label: "Termín opravy", type: "date" },
    ],
  },
  { key: "cestne_prohlaseni", label: "Čestné prohlášení", category: "ostatni", numberPrefix: "CP", fields: [] },
  { key: "plna_moc", label: "Plná moc", category: "ostatni", numberPrefix: "PM", fields: [] },
  { key: "mlcenlivost", label: "Mlčenlivost", category: "ostatni", numberPrefix: "MLC", fields: [] },
  { key: "souhlas_gdpr", label: "Souhlas se zpracováním osobních údajů", category: "ostatni", numberPrefix: "GDPR", fields: [] },
  { key: "interni_dokument", label: "Interní firemní dokument", category: "ostatni", numberPrefix: "INT", fields: [] },
  { key: "jiny_dokument", label: "Jiný dokument", category: "ostatni", numberPrefix: "JINY", fields: [] },
];

export function findDocumentTypeDef(key: DocumentTypeV2): DocumentTypeDef {
  return DOCUMENT_TYPE_DEFS.find((d) => d.key === key)!;
}

export function documentTypeLabel(key: DocumentTypeV2): string {
  return findDocumentTypeDef(key)?.label ?? key;
}

export const SIGNER_ROLES: Record<DocumentTypeV2, string[]> = {
  pracovni_smlouva: ["Zaměstnanec", "Zaměstnavatel"],
  dpp: ["Zaměstnanec", "Zaměstnavatel"],
  dpc: ["Zaměstnanec", "Zaměstnavatel"],
  dodatek_pracovni_smlouvy: ["Zaměstnanec", "Zaměstnavatel"],
  dohoda_o_ukonceni: ["Zaměstnanec", "Zaměstnavatel"],
  vypoved: ["Oprávněná osoba"],
  potvrzeni_o_zamestnani: ["Zaměstnavatel"],
  objednavka_praci: ["Objednatel", "Dodavatel"],
  smlouva_o_dilo: ["Objednatel", "Zhotovitel"],
  dodatek_smlouvy_o_dilo: ["Objednatel", "Zhotovitel"],
  predavaci_protokol: ["Předávající", "Přebírající"],
  predavaci_protokol_zakazky: ["Předávající", "Přebírající"],
  protokol_o_prevzeti_praci: ["Kontrolující", "Odpovědná osoba"],
  cestne_prohlaseni: ["Prohlašující"],
  plna_moc: ["Zmocnitel", "Zmocněnec"],
  mlcenlivost: ["Zavazující se osoba"],
  souhlas_gdpr: ["Osoba udělující souhlas"],
  interni_dokument: ["Odpovědná osoba"],
  jiny_dokument: ["Podepisující osoba"],
};

export const CATEGORY_LABELS: Record<DocumentCategoryV2, string> = {
  pracovnepravni: "Pracovněprávní dokumenty",
  obchodni: "Obchodní smlouvy a objednávky",
  ostatni: "Ostatní firemní dokumenty",
};
