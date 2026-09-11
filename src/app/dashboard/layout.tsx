import { DashboardShell } from "@/components/dashboard/shell";
import { requirePermission } from "@/lib/access-control";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePermission("DASHBOARD");
  return <DashboardShell user={{ name: user.name, role: user.role }}>{children}</DashboardShell>;
}
