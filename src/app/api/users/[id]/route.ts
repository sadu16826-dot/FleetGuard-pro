import { NextResponse } from "next/server";
import { Prisma, UserRole } from "@/generated/prisma";
import { db } from "@/lib/db";
import { accessFailure, requirePermission } from "@/lib/access-control";
import { hashPassword } from "@/lib/auth";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  try {
    const admin = await requirePermission("USERS", "MANAGE");
    const { id } = await params;
    const existing = await db.user.findFirst({ where: { id, companyId: admin.companyId! } });
    if (!existing) return NextResponse.json({ message: "User not found." }, { status: 404 });
    const body = await request.json() as { name?: string; email?: string; role?: string; active?: boolean; password?: string };
    if (body.role !== undefined && !Object.values(UserRole).includes(body.role as UserRole))
      return NextResponse.json({ message: "Select a valid role." }, { status: 400 });
    if (id === admin.id && body.active === false)
      return NextResponse.json({ message: "You cannot deactivate your own account." }, { status: 400 });
    if (id === admin.id && body.role !== undefined && body.role !== existing.role)
      return NextResponse.json({ message: "You cannot change your own administrator role." }, { status: 400 });
    if (body.password !== undefined && body.password.length < 10)
      return NextResponse.json({ message: "The new password must contain at least 10 characters." }, { status: 400 });
    const email = body.email?.trim().toLowerCase();
    if (email !== undefined && !/^\S+@\S+\.\S+$/.test(email))
      return NextResponse.json({ message: "Enter a valid email address." }, { status: 400 });
    if (email !== undefined) {
      const duplicate = await db.user.findFirst({
        where: { email, id: { not: id } },
        select: { id: true },
      });
      if (duplicate)
        return NextResponse.json({ message: "A user with this email already exists." }, { status: 409 });
    }
    const updated = await db.user.update({ where: { id }, data: {
      name: body.name?.trim() || undefined,
      email,
      role: body.role as UserRole | undefined,
      active: body.active,
      passwordHash: body.password ? hashPassword(body.password) : undefined,
    } });
    return NextResponse.json({ id: updated.id, name: updated.name, email: updated.email, role: updated.role, active: updated.active });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
      return NextResponse.json({ message: "A user with this email already exists." }, { status: 409 });
    return accessFailure(error, "Unable to update user.");
  }
}
