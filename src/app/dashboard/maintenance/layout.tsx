import { requirePagePermission } from "@/lib/access-control";

export default async function ModuleLayout({ children }: { children: React.ReactNode }) {
  await requirePagePermission("MAINTENANCE");
  return children;
}
