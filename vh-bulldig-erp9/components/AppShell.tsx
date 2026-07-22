import LeftNav from "@/components/dashboard/LeftNav";
import TopBar from "@/components/dashboard/TopBar";
import type { ModuleDef } from "@/lib/modules";

interface Props {
  modules: ModuleDef[];
  companyName: string;
  logoUrl?: string | null;
  fullName: string;
  role: string;
  alertsCount?: number;
  children: React.ReactNode;
}

export default function AppShell({
  modules,
  companyName,
  logoUrl = null,
  fullName,
  role,
  alertsCount = 0,
  children,
}: Props) {
  return (
    <div className="flex min-h-dvh bg-base-950">
      <LeftNav modules={modules} companyName={companyName} logoUrl={logoUrl} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar fullName={fullName} role={role} alertsCount={alertsCount} logoUrl={logoUrl} />
        <main className="flex-1 space-y-6 px-4 py-6 md:px-6">{children}</main>
      </div>
    </div>
  );
}
