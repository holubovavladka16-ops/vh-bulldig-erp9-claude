import { redirect } from "next/navigation";

// Dočasná stránka /prehled z Modulu 1 byla nahrazena skutečným
// Dashboardem (Modul 2). Zachováno jako přesměrování, aby staré odkazy
// nespadly do chyby 404.
export default function LegacyPrehledRedirect() {
  redirect("/dashboard");
}
