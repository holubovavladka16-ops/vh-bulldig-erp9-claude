import type { CostCategory } from "@/types/database.types";

export const COST_CATEGORIES: { key: CostCategory; label: string }[] = [
  { key: "material", label: "Materiál" },
  { key: "naradi", label: "Nářadí" },
  { key: "pujcovna", label: "Půjčovna" },
  { key: "ubytovani", label: "Ubytování" },
  { key: "phm", label: "PHM" },
  { key: "jizdenky", label: "Jízdenky" },
  { key: "jine", label: "Jiné" },
];

export const COST_CATEGORY_LABELS: Record<CostCategory, string> = Object.fromEntries(
  COST_CATEGORIES.map((c) => [c.key, c.label])
) as Record<CostCategory, string>;
