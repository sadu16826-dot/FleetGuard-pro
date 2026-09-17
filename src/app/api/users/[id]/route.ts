import { NextResponse } from "next/server";
import { Prisma, UserRole } from "@/generated/prisma";
import { db } from "@/lib/db";
import { accessFailure, requirePermission } from "@/lib/access-control";
import { hashPassword } from "@/lib/auth";

type Context = { params: Promise<{ id: string }> };

const userResponse = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  createdAt: true,
  lastLoginAt: true,
} as const;

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
    const name = body.name?.trim();
    if (body.name !== undefined && !name)
      return NextResponse.json({ message: "Full name is required." }, { status: 400 });

    const updated = await db.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({ where: { id }, data: {
        name,
        email,
        role: body.role as UserRole | undefined,
        active: body.active,
        passwordHash: body.password ? hashPassword(body.password) : undefined,
      }, select: userResponse });

      // Driver records have no User foreign key. Keep the one unambiguous existing
      // driver profile in sync so its id, assignments, and trip history remain intact.
      if (existing.role === "DRIVER" && (name !== undefined || email !== undefined)) {
        const drivers = await tx.driver.findMany({
          where: {
            companyId: admin.companyId!,
            OR: [
              { email: { equals: existing.email, mode: "insensitive" } },
              { name: { equals: existing.name, mode: "insensitive" } },
            ],
          },
          select: { id: true },
          take: 2,
        });
        if (drivers.length === 1) {
          await tx.driver.update({
            where: { id: drivers[0].id },
            data: { name: updatedUser.name, email: updatedUser.email },
          });
        }
      }
      return updatedUser;
    });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
      return NextResponse.json({ message: "A user with this email already exists." }, { status: 409 });
    return accessFailure(error, "Unable to update user.");
  }
}

export async function DELETE(_: Request, { params }: Context) {
  try {
    const admin = await requirePermission("USERS", "MANAGE");
    const { id } = await params;
    if (id === admin.id)
      return NextResponse.json({ message: "You cannot delete your current account." }, { status: 400 });

    const user = await db.user.findFirst({
      where: { id, companyId: admin.companyId! },
      select: {
        id: true,
        _count: {
          select: {
            driverDocuments: true,
            driverLicenceDocuments: true,
            inspectionEvidence: true,
            inspections: true,
            notifications: true,
            tripVehiclePhotos: true,
            uploadedDocuments: true,
            vehicleActivities: true,
          },
        },
      },
    });
    if (!user)
      return NextResponse.json({ message: "User not found." }, { status: 404 });

    if (Object.values(user._count).some(Boolean)) {
      await db.user.update({ where: { id: user.id }, data: { active: false } });
      return NextResponse.json({
        action: "deactivated",
        message: "This user has existing operational records and has been deactivated to preserve them.",
      });
    }

    await db.user.delete({ where: { id: user.id } });
    return NextResponse.json({ action: "deleted" });
  } catch (error) {
    return accessFailure(error, "Unable to delete user.");
  }
}
