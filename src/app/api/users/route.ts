import { NextResponse } from "next/server";
import { UserRole } from "@/generated/prisma";
import { db } from "@/lib/db";
import { accessFailure, requirePermission } from "@/lib/access-control";
import { hashPassword } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requirePermission("USERS", "VIEW");
    return NextResponse.json(await db.user.findMany({
      where: { companyId: user.companyId! },
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true, lastLoginAt: true },
      orderBy: { name: "asc" },
    }));
  } catch (error) {
    return accessFailure(error, "Unable to load users.");
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requirePermission("USERS", "MANAGE");
    const body = await request.json() as { name?: string; email?: string; password?: string; role?: string };
    const name = body.name?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 10 || !Object.values(UserRole).includes(body.role as UserRole))
      return NextResponse.json({ message: "Name, valid email, role, and a password of at least 10 characters are required." }, { status: 400 });
    const created = await db.user.create({ data: { companyId: admin.companyId!, name, email, passwordHash: hashPassword(password), role: body.role as UserRole } });
    return NextResponse.json({ id: created.id, name: created.name, email: created.email, role: created.role, active: created.active }, { status: 201 });
  } catch (error) {
    return accessFailure(error, "Unable to create user.");
  }
}
