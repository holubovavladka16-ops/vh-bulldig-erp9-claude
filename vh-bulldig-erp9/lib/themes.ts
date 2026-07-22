import type { AppDesign } from "@/types/database.types";

export interface DesignDef {
  key: AppDesign;
  label: string;
  base: string; // hex pro malý náhled
  accent1: string;
  accent2: string;
}

export const DESIGNS: DesignDef[] = [
  { key: "classic", label: "Classic", base: "#14100C", accent1: "#C9A24B", accent2: "#8B6F47" },
  { key: "professional", label: "Professional", base: "#070B14", accent1: "#C9A24B", accent2: "#2DD4C8" },
  { key: "industrial", label: "Industrial", base: "#121212", accent1: "#E8622C", accent2: "#6E8CA0" },
  { key: "modern", label: "Modern", base: "#10131C", accent1: "#6366F1", accent2: "#22D3EE" },
  { key: "executive", label: "Executive", base: "#0D0B14", accent1: "#B8952F", accent2: "#C7C7D1" },
  { key: "field", label: "Field", base: "#12160D", accent1: "#A3C93A", accent2: "#D97706" },
];

export function designLabel(key: AppDesign): string {
  return DESIGNS.find((d) => d.key === key)?.label ?? key;
}
