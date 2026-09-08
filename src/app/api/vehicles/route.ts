import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateVehicle } from "@/lib/vehicle-utils";
import type { VehicleFormValues } from "@/types/vehicle";

const vehicleTypes = new Set(["CAR","SUV","VAN","BUS","TRUCK","PICKUP","OTHER"]);
const fuelTypes = new Set(["PETROL","DIESEL","ELECTRIC","HYBRID","CNG"]);
const statuses = new Set(["AVAILABLE","IN_USE","RESERVED","INSPECTION_REQUIRED","SERVICE_DUE","IN_SERVICE","ACCIDENT_REPAIR","NOT_ROADWORTHY","INACTIVE","SOLD","DISPOSED","TRANSFERRED"]);
const date = (value?: string) => value ? new Date(value) : null;
const optional = (value?: string) => value?.trim() || null;

export async function GET() {
  try { return NextResponse.json(await db.vehicle.findMany({ include: { documents: true }, orderBy: { updatedAt: "desc" } })); }
  catch (error) { if (process.env.NODE_ENV !== "production") console.error("Vehicle list failed", error); return NextResponse.json({ message: "Unable to load vehicles." }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const values = await request.json() as VehicleFormValues;
    const errors = validateVehicle(values);
    if (values.vehicleType && !vehicleTypes.has(values.vehicleType)) errors.vehicleType = "Select a valid vehicle type.";
    if (values.fuelType && !fuelTypes.has(values.fuelType)) errors.fuelType = "Select a valid fuel type.";
    const status = values.status || "AVAILABLE";
    if (!statuses.has(status)) errors.status = "Select a valid vehicle status.";
    if (Object.keys(errors).length) return NextResponse.json({ error: "Vehicle validation failed", message: "Please correct the highlighted fields.", errors }, { status: 400 });

    const company = await db.company.upsert({ where: { id: "development-company" }, update: {}, create: { id: "development-company", name: "FleetGuard Operations" } });
    const vehicle = await db.vehicle.create({ data: {
      companyId: company.id, vehicleCode: values.vehicleCode.trim().toUpperCase(), vehicleName: values.vehicleName.trim(), registrationNumber: values.registrationNumber.replace(/\s/g, "").toUpperCase(), vehicleType: values.vehicleType as never, brand: values.brand.trim(), model: values.model.trim(), variant: optional(values.variant), manufacturingYear: values.manufacturingYear ?? null, colour: optional(values.colour), fuelType: values.fuelType as never, transmission: optional(values.transmission), seatingCapacity: values.seatingCapacity ?? null, chassisNumber: optional(values.chassisNumber), engineNumber: optional(values.engineNumber), vin: optional(values.vin), currentKm: values.currentKm, engineCapacity: optional(values.engineCapacity), batteryType: optional(values.batteryType), batteryCapacity: optional(values.batteryCapacity), vehicleWeight: optional(values.vehicleWeight), ownerName: optional(values.ownerName), ownershipType: (values.ownershipType || null) as never, purchaseDate: date(values.purchaseDate), purchasePrice: values.purchasePrice ?? null, currentEstimatedValue: values.currentEstimatedValue ?? null, financeStatus: optional(values.financeStatus), financeCompany: optional(values.financeCompany), registrationDate: date(values.registrationDate), registrationState: optional(values.registrationState), registrationAuthority: optional(values.registrationAuthority), rcNumber: optional(values.rcNumber), vehicleClass: optional(values.vehicleClass), lastServiceDate: date(values.lastServiceDate), lastServiceKm: values.lastServiceKm ?? null, nextServiceDate: date(values.nextServiceDate), nextServiceKm: values.nextServiceKm ?? null, serviceInterval: values.serviceInterval ?? null, status: status as never,
      activities: { create: { userId: "dev-admin", action: "VEHICLE_CREATED", description: "Vehicle record created" } },
    }});
    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("Vehicle creation failed", error);
    const prismaError = error as { code?: string; meta?: { target?: unknown } };
    if (prismaError.code === "P2002") {
      const target = String(prismaError.meta?.target ?? "");
      const message = target.includes("vehicle_code") ? "A vehicle with this vehicle ID already exists." : target.includes("registration_number") ? "A vehicle with this registration number already exists." : target.includes("vin") ? "A vehicle with this VIN already exists." : target.includes("chassis_number") ? "A vehicle with this chassis number already exists." : "A vehicle with this engine number already exists.";
      return NextResponse.json({ error: "Vehicle creation failed", message }, { status: 409 });
    }
    return NextResponse.json({ error: "Vehicle creation failed", message: "Unable to add vehicle. Please try again." }, { status: 500 });
  }
}
