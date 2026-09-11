import { requirePermission } from "@/lib/access-control";

export default async function ModuleLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("TYRES");
  return children;
}
