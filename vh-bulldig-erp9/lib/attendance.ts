import type { AttendanceStatus, PaymentMethod } from "@/types/database.types";

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  rozepsany: "Rozepsaný",
  odeslany: "Odeslaný",
  schvaleny: "Schválený",
  vraceny_k_oprave: "Vrácený k opravě",
};

export const ATTENDANCE_STATUS_CLASSES: Record<AttendanceStatus, string> = {
  rozepsany: "bg-white/10 text-white/50",
  odeslany: "bg-amber-500/10 text-amber-300",
  schvaleny: "bg-emerald-500/10 text-emerald-300",
  vraceny_k_oprave: "bg-red-500/10 text-red-300",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  hotove: "Hotově",
  bankovni_ucet: "Bankovní účet",
};

/** Vrací počet minut přítomnosti = (konec - začátek) - přestávka. Pouze evidence, nikdy základ mzdy. */
export function computePresenceMinutes(
  start: string | null,
  end: string | null,
  breakMinutes: number
): number | null {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startMinutes = sh * 60 + sm;
  let endMinutes = eh * 60 + em;
  if (endMinutes < startMinutes) endMinutes += 24 * 60; // přes půlnoc
  const total = endMinutes - startMinutes - (breakMinutes || 0);
  return total > 0 ? total : 0;
}

export function formatMinutes(minutes: number | null): string {
  if (minutes === null) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h} h ${m} min`;
}

export function formatMoney(value: number): string {
  return `${value.toLocaleString("cs-CZ")} Kč`;
}
