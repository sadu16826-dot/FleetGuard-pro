import { NextResponse } from "next/server";
import { accessFailure, authenticatedUser } from "@/lib/access-control";
import { db } from "@/lib/db";
import type { DriverStatus } from "@/generated/prisma";

const driverStatuses = new Set([
  "ACTIVE",
  "INACTIVE",
  "ON_LEAVE",
  "SUSPENDED",
  "TERMINATED",
]);

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
    const user = await authenticatedUser({ module: "DRIVERS", action: "EDIT" });
    const input = (await request.json()) as Record<string, string | undefined>;

    const payload: Record<string, unknown> = {};
    if (input.name) payload.name = input.name.trim();
    if (input.phone) payload.phone = input.phone.trim();
    if (input.email !== undefined) payload.email = input.email?.trim() || null;
    if (input.licenseNumber) payload.licenseNumber = input.licenseNumber.trim();
    if (input.licenseExpiry)
      payload.licenseExpiry = new Date(input.licenseExpiry);
    if (input.status && !driverStatuses.has(input.status))
      return NextResponse.json(
        { message: "Select a valid driver status." },
        { status: 400 },
      );
    if (input.status) payload.status = input.status as DriverStatus;

    const driver = await db.driver.update({
      where: { id, companyId: user.companyId! },
      data: payload,
    });
    return NextResponse.json(driver);
  } catch (error) {
    return accessFailure(error, "Driver could not be updated.");
  }
}
