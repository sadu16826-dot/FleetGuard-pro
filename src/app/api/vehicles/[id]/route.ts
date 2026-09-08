import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma";
import { db } from "@/lib/db";
import { validateVehicle } from "@/lib/vehicle-utils";
import type { VehicleFormValues, VehicleStatus } from "@/types/vehicle";

const statuses = new Set<VehicleStatus>(["AVAILABLE","IN_USE","RESERVED","INSPECTION_REQUIRED","SERVICE_DUE","IN_SERVICE","ACCIDENT_REPAIR","NOT_ROADWORTHY","INACTIVE","SOLD","DISPOSED","TRANSFERRED"]);
const date = (value?: string) => value ? new Date(value) : null;
const optional = (value?: string) => value?.trim() || null;

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const { id } = await params; const vehicle = await db.vehicle.findUnique({ where: { id }, include: { documents: true, activities: { orderBy: { createdAt: "desc" } } } }); return vehicle ? NextResponse.json(vehicle) : NextResponse.json({ message: "Vehicle could not be found." }, { status: 404 }); }
  catch (error) { if (process.env.NODE_ENV !== "production") console.error("Vehicle read failed", error); return NextResponse.json({ message: "Unable to load vehicle." }, { status: 500 }); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const input = await request.json() as Partial<VehicleFormValues>;
    const current = await db.vehicle.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ message: "Vehicle could not be found." }, { status: 404 });

    if (input.status && !statuses.has(input.status)) return NextResponse.json({ message: "Select a valid vehicle status.", errors: { status: "Select a valid vehicle status." } }, { status: 400 });
    if (input.currentKm != null && (!Number.isFinite(input.currentKm) || input.currentKm < current.currentKm)) return NextResponse.json({ message: "Current kilometre reading cannot be lower than the previous recorded reading.", errors: { currentKm: "Current kilometre reading cannot be lower than the previous recorded reading." } }, { status: 400 });

    if (Object.keys(input).length === 1 && input.status) {
      const vehicle = await db.vehicle.update({ where: { id }, data: { status: input.status as never, activities: { create: { userId: "dev-admin", action: "STATUS_CHANGED", description: `Status changed from ${current.status} to ${input.status}` } } } });
      return NextResponse.json(vehicle);
    }

    const complete = { ...current, ...input, purchasePrice: input.purchasePrice == null ? undefined : Number(input.purchasePrice), currentEstimatedValue: input.currentEstimatedValue == null ? undefined : Number(input.currentEstimatedValue) } as unknown as VehicleFormValues;
    const errors = validateVehicle(complete, current.currentKm);
    if (Object.keys(errors).length) return NextResponse.json({ message: "Please correct the highlighted fields.", errors }, { status: 400 });

    const statusChanged = input.status && input.status !== current.status;
    const vehicle = await db.vehicle.update({ where: { id }, data: {
      vehicleCode: input.vehicleCode?.trim().toUpperCase(), vehicleName: input.vehicleName?.trim(), registrationNumber: input.registrationNumber?.replace(/\s/g, "").toUpperCase(), vehicleType: input.vehicleType as never, brand: input.brand?.trim(), model: input.model?.trim(), variant: optional(input.variant), manufacturingYear: input.manufacturingYear ?? null, colour: optional(input.colour), fuelType: input.fuelType as never, transmission: optional(input.transmission), seatingCapacity: input.seatingCapacity ?? null, chassisNumber: optional(input.chassisNumber), engineNumber: optional(input.engineNumber), vin: optional(input.vin), currentKm: input.currentKm, engineCapacity: optional(input.engineCapacity), batteryType: optional(input.batteryType), batteryCapacity: optional(input.batteryCapacity), vehicleWeight: optional(input.vehicleWeight), ownerName: optional(input.ownerName), ownershipType: (input.ownershipType || null) as never, purchaseDate: date(input.purchaseDate), purchasePrice: input.purchasePrice ?? null, currentEstimatedValue: input.currentEstimatedValue ?? null, financeStatus: optional(input.financeStatus), financeCompany: optional(input.financeCompany), registrationDate: date(input.registrationDate), registrationState: optional(input.registrationState), registrationAuthority: optional(input.registrationAuthority), rcNumber: optional(input.rcNumber), vehicleClass: optional(input.vehicleClass), lastServiceDate: date(input.lastServiceDate), lastServiceKm: input.lastServiceKm ?? null, nextServiceDate: date(input.nextServiceDate), nextServiceKm: input.nextServiceKm ?? null, serviceInterval: input.serviceInterval ?? null, status: input.status as never,
      activities: { create: { userId: "dev-admin", action: statusChanged ? "STATUS_CHANGED" : "VEHICLE_UPDATED", description: statusChanged ? `Status changed from ${current.status} to ${input.status}` : "Vehicle details updated" } }
    }});
    return NextResponse.json(vehicle);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("Vehicle update failed", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") { const target = String(error.meta?.target ?? ""); const message = target.includes("vehicle_code") ? "A vehicle with this vehicle ID already exists." : target.includes("registration_number") ? "A vehicle with this registration number already exists." : "Another vehicle already uses one of these unique identifiers."; return NextResponse.json({ message }, { status: 409 }); }
    return NextResponse.json({ message: "Vehicle could not be updated." }, { status: 500 });
  }
}
