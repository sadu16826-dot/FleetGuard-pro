import { forbidden } from "next/navigation";
import { authenticatedUser } from "@/lib/access-control";
import { AccessError } from "@/lib/access-control";
import { db } from "@/lib/db";
import { UserManager } from "@/components/users/user-manager";

export default async function UserManagementPage() {
  let admin;
  try {
    admin = await authenticatedUser({ module: "USERS", action: "MANAGE" });
  } catch (error) {
    if (error instanceof AccessError && error.status === 403) forbidden();
    throw error;
  }
  const users = await db.user.findMany({ where: { companyId: admin.companyId! }, select: { id: true, name: true, email: true, role: true, active: true, createdAt: true, lastLoginAt: true }, orderBy: { name: "asc" } });
  return <UserManager currentUserId={admin.id} initialUsers={users.map((user) => ({ ...user, createdAt: user.createdAt.toISOString(), lastLoginAt: user.lastLoginAt?.toISOString() ?? null }))}/>;
}
