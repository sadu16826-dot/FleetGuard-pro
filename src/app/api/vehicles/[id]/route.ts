import { accessibleVehicle, accessFailure } from "@/lib/access-control";
import { documentSelect } from "@/lib/document-server";
import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma";
import { db } from "@/lib/db";
import { validateVehicle } from "@/lib/vehicle-utils";
import type { VehicleFormValues, VehicleStatus } from "@/types/vehicle";

const statuses = new Set<VehicleStatus>([
  "AVAILABLE",
  "IN_USE",
  "RESERVED",
  "INSPECTION_REQUIRED",
  "SERVICE_DUE",
  "IN_SERVICE",
  "ACCIDENT_REPAIR",
  "NOT_ROADWORTHY",
  "INACTIVE",
  "SOLD",
  "DISPOSED",
  "TRANSFERRED",
]);
const date = (value?: string) => (value ? new Date(value) : null);
const optional = (value?: string) => value?.trim() || null;

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { user } = await accessibleVehicle(id);
    const vehicle = await db.vehicle.findFirst({
      where: { id, companyId: user.companyId! },
      include: {
        documents: {
          where: { serviceId: null, fuelRecordId: null },
          select: documentSelect,
        },
        activities: { orderBy: { createdAt: "desc" } },
      },
    });
    return NextResponse.json(vehicle);
  } catch (error) {
    if (process.env.NODE_ENV !== "production")
      console.error("Vehicle read failed", error);
    return accessFailure(error, "Unable to load vehicle.");
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { user, vehicle: current } = await accessibleVehicle(id, true);
    const input = (await request.json()) as Partial<VehicleFormValues>;

    if (input.status && !statuses.has(input.status))
      return NextResponse.json(
        {
          message: "Select a valid vehicle status.",
          errors: { status: "Select a valid vehicle status." },
        },
        { status: 400 },
      );
    if (
      input.currentKm != null &&
      (!Number.isFinite(input.currentKm) || input.currentKm < current.currentKm)
    )
      return NextResponse.json(
        {
          message:
            "Current kilometre reading cannot be lower than the previous recorded reading.",
          errors: {
            currentKm:
              "Current kilometre reading cannot be lower than the previous recorded reading.",
          },
        },
        { status: 400 },
      );

    if (Object.keys(input).length === 1 && input.status) {
      const vehicle = await db.vehicle.update({
        where: { id },
        data: {
          status: input.status as never,
          activities: {
            create: {
              userId: user.id,
              action: "STATUS_CHANGED",
              description: `Status changed from ${current.status} to ${input.status}`,
            },
          },
        },
      });
      return NextResponse.json(vehicle);
    }

    const complete = {
      ...current,
      ...input,
    } as unknown as VehicleFormValues;
    const errors = validateVehicle(complete, current.currentKm);
    if (Object.keys(errors).length)
      return NextResponse.json(
        { message: "Please correct the highlighted fields.", errors },
        { status: 400 },
      );

    const statusChanged = input.status && input.status !== current.status;
    const vehicle = await db.vehicle.update({
      where: { id },
      data: {
        vehicleCode: input.vehicleCode?.trim().toUpperCase(),
        vehicleName: input.vehicleName?.trim(),
        registrationNumber: input.registrationNumber
          ?.replace(/\s/g, "")
          .toUpperCase(),
        vehicleType: input.vehicleType as never,
        brand: input.brand?.trim(),
        model: input.model?.trim(),
        variant: "variant" in input ? optional(input.variant) : undefined,
        manufacturingYear: input.manufacturingYear,
        colour: "colour" in input ? optional(input.colour) : undefined,
        fuelType: input.fuelType as never,
        transmission:
          "transmission" in input ? optional(input.transmission) : undefined,
        seatingCapacity: input.seatingCapacity,
        chassisNumber:
          "chassisNumber" in input ? optional(input.chassisNumber) : undefined,
        engineNumber:
          "engineNumber" in input ? optional(input.engineNumber) : undefined,
        currentKm: input.currentKm,
        ownerName: "ownerName" in input ? optional(input.ownerName) : undefined,
        ownershipType:
          "ownershipType" in input
            ? ((input.ownershipType || null) as never)
            : undefined,
        purchaseDate:
          "purchaseDate" in input ? date(input.purchaseDate) : undefined,
        registrationDate:
          "registrationDate" in input
            ? date(input.registrationDate)
            : undefined,
        registrationState:
          "registrationState" in input
            ? optional(input.registrationState)
            : undefined,
        rcNumber: "rcNumber" in input ? optional(input.rcNumber) : undefined,
        lastServiceDate:
          "lastServiceDate" in input ? date(input.lastServiceDate) : undefined,
        lastServiceKm: input.lastServiceKm,
        nextServiceDate:
          "nextServiceDate" in input ? date(input.nextServiceDate) : undefined,
        nextServiceKm: input.nextServiceKm,
        status: input.status as never,
        activities: {
          create: {
            userId: user.id,
            action: statusChanged ? "STATUS_CHANGED" : "VEHICLE_UPDATED",
            description: statusChanged
              ? `Status changed from ${current.status} to ${input.status}`
              : "Vehicle details updated",
          },
        },
      },
    });
    return NextResponse.json(vehicle);
  } catch (error) {
    if (process.env.NODE_ENV !== "production")
      console.error("Vehicle update failed", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = String(error.meta?.target ?? "");
      const message = target.includes("vehicle_code")
        ? "A vehicle with this vehicle ID already exists."
        : target.includes("registration_number")
          ? "A vehicle with this registration number already exists."
          : "Another vehicle already uses one of these unique identifiers.";
      return NextResponse.json({ message }, { status: 409 });
    }
    return accessFailure(error, "Vehicle could not be updated.");
  }
}
