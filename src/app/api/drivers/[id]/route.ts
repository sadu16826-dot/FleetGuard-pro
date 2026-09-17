import { NextResponse } from "next/server";
import { AccessError, accessFailure, authenticatedUser } from "@/lib/access-control";
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

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await authenticatedUser({ module: "DRIVERS" });
    const driver = await db.driver.findFirst({
      where: { id, companyId: user.companyId! },
      include: {
        currentVehicles: {
          select: { id: true, vehicleCode: true, vehicleName: true },
        },
        primaryVehicles: {
          select: { id: true, vehicleCode: true, vehicleName: true },
        },
        trips: {
          select: {
            id: true,
            vehicleId: true,
            destination: true,
            startTime: true,
            endTime: true,
            status: true,
          },
          orderBy: { startTime: "desc" },
        },
      },
    });
    if (!driver)
      return NextResponse.json(
        { message: "Driver not found." },
        { status: 404 },
      );
    return NextResponse.json(driver);
  } catch (error) {
    return accessFailure(error, "Unable to load driver.");
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await driverManager();
    const input = (await request.json()) as Record<string, string | undefined>;

    const payload: Record<string, unknown> = {};
    if (input.name !== undefined) {
      const name = input.name.trim();
      if (!name)
        return NextResponse.json({ message: "Driver name is required." }, { status: 400 });
      payload.name = name;
    }
    if (input.phone !== undefined) {
      const phone = input.phone.trim();
      if (!phone)
        return NextResponse.json({ message: "Phone is required." }, { status: 400 });
      payload.phone = phone;
    }
    if (input.email !== undefined) payload.email = input.email?.trim() || null;
    if (input.licenseNumber !== undefined) {
      const licenseNumber = input.licenseNumber.trim();
      if (!licenseNumber)
        return NextResponse.json({ message: "License number is required." }, { status: 400 });
      payload.licenseNumber = licenseNumber;
    }
    if (input.licenseExpiry !== undefined) {
      const licenseExpiry = new Date(input.licenseExpiry);
      if (Number.isNaN(licenseExpiry.getTime()))
        return NextResponse.json({ message: "Enter a valid license expiry date." }, { status: 400 });
      payload.licenseExpiry = licenseExpiry;
    }
    if (input.status && !driverStatuses.has(input.status))
      return NextResponse.json(
        { message: "Select a valid driver status." },
        { status: 400 },
      );
    if (input.status) payload.status = input.status as DriverStatus;

    const existingDriver = await db.driver.findFirst({
      where: { id, companyId: user.companyId! },
      select: { id: true },
    });
    if (!existingDriver)
      return NextResponse.json({ message: "Driver not found." }, { status: 404 });

    const driver = await db.driver.update({
      where: { id: existingDriver.id },
      data: payload,
    });
    return NextResponse.json(driver);
  } catch (error) {
    const prismaError = error as { code?: string; meta?: { target?: unknown } };
    if (prismaError.code === "P2002") {
      const target = String(prismaError.meta?.target ?? "");
      return NextResponse.json(
        { message: target.includes("license_number") ? "A driver with this license number already exists." : "A driver with these details already exists." },
        { status: 409 },
      );
    }
    return accessFailure(error, "Driver could not be updated.");
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await driverManager();
    const driver = await db.driver.findFirst({
      where: { id, companyId: user.companyId! },
      select: {
        id: true,
        _count: {
          select: {
            accidents: true,
            assignments: true,
            currentVehicles: true,
            documents: true,
            fuelRecords: true,
            inspections: true,
            licenceDocuments: true,
            licences: true,
            primaryVehicles: true,
            tripVehiclePhotos: true,
            trips: true,
          },
        },
        passport: { select: { id: true } },
      },
    });
    if (!driver)
      return NextResponse.json({ message: "Driver not found." }, { status: 404 });

    const hasRelatedRecords = driver.passport !== null || Object.values(driver._count).some(Boolean);
    if (hasRelatedRecords) {
      await db.driver.update({
        where: { id: driver.id },
        data: { status: "INACTIVE" },
      });
      return NextResponse.json({
        action: "deactivated",
        message: "This driver has operational history and has been marked inactive to preserve it.",
      });
    }

    await db.driver.delete({ where: { id: driver.id } });
    return NextResponse.json({ action: "deleted" });
  } catch (error) {
    return accessFailure(error, "Driver could not be deleted.");
  }
}
