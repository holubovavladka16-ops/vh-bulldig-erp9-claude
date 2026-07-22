// Přesný seznam 20 hlavních modulů dle hlavního zadání VH Bulldig ERP 9
// (sekce "2. PŘESNÝ SEZNAM 20 MODULŮ"). Nic zde není vymyšleno navíc -
// slouží pouze k vykreslení levého navigačního menu a k rozlišení,
// které moduly už existují a které teprve vzniknou na samostatný příkaz.

export interface ModuleDef {
  key: string; // slug použitý v URL /moduly/<key>
  label: string;
  status: "hotovo" | "pripravuje-se";
}

export const MODULES: ModuleDef[] = [
  { key: "prihlaseni", label: "Přihlášení uživatelů", status: "hotovo" },
  { key: "dashboard", label: "Dashboard", status: "hotovo" },
  { key: "nastaveni-spolecnosti", label: "Nastavení společnosti", status: "hotovo" },
  { key: "zamestnanci", label: "Zaměstnanci a Karta dělníka", status: "hotovo" },
  { key: "individualni-cenik", label: "Individuální ceník zaměstnance", status: "hotovo" },
  { key: "zakazky", label: "Zakázky", status: "hotovo" },
  { key: "dochazka", label: "Docházka", status: "hotovo" },
  { key: "vykazy", label: "Výkazy", status: "hotovo" },
  { key: "naklady", label: "Náklady", status: "hotovo" },
  { key: "fakturace-a-prehled-zisku", label: "Fakturace a přehled zisku", status: "hotovo" },
  { key: "stavebni-denik", label: "Stavební deník", status: "hotovo" },
  { key: "pripojky", label: "Přípojky", status: "hotovo" },
  { key: "foto-gps", label: "Fotodokumentace s GPS", status: "hotovo" },
  { key: "mapa", label: "Mapa s body a fotografiemi", status: "hotovo" },
  { key: "pdf-a-vyplatni-pasky", label: "PDF dokumenty a výplatní pásky", status: "hotovo" },
  { key: "nastaveni-aplikace", label: "Nastavení aplikace", status: "hotovo" },
  { key: "zaloha-obnova", label: "Záloha a obnova databáze", status: "hotovo" },
  { key: "faktury-qr", label: "Faktury s QR kódem", status: "pripravuje-se" },
  { key: "papirovy-formular", label: "Papírový formulář", status: "hotovo" },
  { key: "kontrola-papiroveho-formulare", label: "Kontrola papírového formuláře", status: "hotovo" },
  // Modul nad rámec původních 20 - výslovně schváleno uživatelem.
  { key: "smlouvy-a-dokumenty", label: "Smlouvy, objednávky a pracovněprávní dokumenty", status: "hotovo" },
];

export function findModule(key: string): ModuleDef | undefined {
  return MODULES.find((m) => m.key === key);
}
