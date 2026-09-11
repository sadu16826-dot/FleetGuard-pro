import { forbidden } from "next/navigation";
import { AccessError, requirePermission } from "@/lib/access-control";

export default async function ModuleLayout({ children }: { children: React.ReactNode }) {
  try {
    await requirePermission("USERS");
  } catch (error) {
    if (error instanceof AccessError && error.status === 403) forbidden();
    throw error;
  }
  return children;
}
