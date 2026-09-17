import { NextResponse } from "next/server";
import { AccessError, authenticatedUser, accessFailure } from "@/lib/access-control";
import { db } from "@/lib/db";
import type { DriverStatus } from "@/generated/prisma";

const driverStatuses = new Set([
  "ACTIVE",
  "INACTIVE",
  "ON_LEAVE",
  "SUSPENDED",
  "TERMINATED",
]);

async function driverManager() {
  const user = await authenticatedUser({ module: "DRIVERS", action: "MANAGE" });
  if (user.role !== "ADMIN")
    throw new AccessError("Only Super Admins can manage drivers.", 403);
  return user;
}

export async function GET() {
  try {
    const user = await authenticatedUser({ module: "DRIVERS" });
    const drivers = await db.driver.findMany({
      where: { companyId: user.companyId! },
      include: {
        currentVehicles: { select: { vehicleName: true, vehicleCode: true } },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(drivers);
  } catch (error) {
    return accessFailure(error, "Unable to load drivers.");
  }
}

export async function POST(request: Request) {
  try {
    const user = await driverManager();
    const input = (await request.json()) as {
      name?: string;
      phone?: string;
      email?: string;
      licenseNumber?: string;
      licenseExpiry?: string;
      status?: string;
    };

    const name = input.name?.trim();
    const phone = input.phone?.trim();
    const licenseNumber = input.licenseNumber?.trim();
    const licenseExpiry = input.licenseExpiry
      ? new Date(input.licenseExpiry)
      : null;
    const status = input.status || "ACTIVE";

    if (
      !name ||
      !phone ||
      !licenseNumber ||
      !licenseExpiry ||
      !driverStatuses.has(status)
    ) {
      return NextResponse.json(
        {
          message:
            "Driver name, phone, license number, expiry date, and status are required.",
        },
        { status: 400 },
      );
    }

    const driver = await db.driver.create({
      data: {
        companyId: user.companyId!,
        name,
        phone,
        email: input.email?.trim() || null,
        licenseNumber,
        licenseExpiry,
        status: status as DriverStatus,
      },
    });

    return NextResponse.json(driver, { status: 201 });
  } catch (error) {
    if (process.env.NODE_ENV !== "production")
      console.error("Driver creation failed", error);
    const prismaError = error as { code?: string; meta?: { target?: unknown } };
    if (prismaError.code === "P2002") {
      const target = String(prismaError.meta?.target ?? "");
      const message = target.includes("license_number")
        ? "A driver with this license number already exists."
        : "A driver with these details already exists.";
      return NextResponse.json({ message }, { status: 409 });
    }
    return accessFailure(error, "Unable to add driver.");
  }
}
