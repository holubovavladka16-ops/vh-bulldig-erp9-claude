import type { PricingActivityKey, PricingUnit } from "@/types/database.types";

export const ACTIVITY_PRESETS: { key: PricingActivityKey; label: string; defaultUnit: PricingUnit }[] = [
  { key: "hodinova_sazba", label: "Hodinová sazba", defaultUnit: "hod" },
  { key: "rucni_vykop", label: "Ruční výkop", defaultUnit: "bm" },
  { key: "pruraz", label: "Průraz", defaultUnit: "ks" },
  { key: "demontaz_dlazby", label: "Demontáž zámkové dlažby", defaultUnit: "m2" },
  { key: "pokladka_dlazby", label: "Pokládka zámkové dlažby", defaultUnit: "m2" },
  { key: "denni_sazba_ukol", label: "Denní sazba – úkol", defaultUnit: "den" },
  { key: "jine", label: "Jiné", defaultUnit: "hod" },
];

export const UNIT_LABELS: Record<PricingUnit, string> = {
  hod: "hod",
  bm: "bm",
  ks: "ks",
  m2: "m²",
  den: "den",
};

export const UNITS: PricingUnit[] = ["hod", "bm", "ks", "m2", "den"];

export function activityLabel(key: PricingActivityKey): string {
  return ACTIVITY_PRESETS.find((a) => a.key === key)?.label ?? key;
}
