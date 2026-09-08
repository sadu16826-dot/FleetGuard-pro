import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma";
import { db } from "@/lib/db";
import { photoLabel, readTripPhotos, TripPhotoUploadError } from "@/lib/trip-photo-upload";

const asDateTime = (date?: string, time?: string) => new Date(`${date}T${time || "00:00"}`);
const text = (form: FormData, name: string) => String(form.get(name) ?? "");
const optionalNumber = (form: FormData, name: string) => text(form, name) === "" ? undefined : Number(text(form, name));
const checked = (form: FormData, name: string) => form.get(name) === "on";
const validPercent = (value?: number) => value == null || (Number.isFinite(value) && value >= 0 && value <= 100);

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return NextResponse.json(await db.trip.findMany({ where: { vehicleId: id }, include: { driver: true, inspections: true, vehiclePhotos: { select: { id: true, photoType: true, phase: true, createdAt: true } } }, orderBy: { startTime: "desc" } }));
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("Trip list failed", error);
    return NextResponse.json({ message: "Unable to load trips." }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const form = await request.formData();
    const driverId = text(form, "driverId");
    const purpose = text(form, "purpose").trim();
    const startLocation = text(form, "startLocation").trim();
    const destination = text(form, "destination").trim();
    const tripDate = text(form, "tripDate");
    const startTime = text(form, "startTime");
    const expectedReturnTime = text(form, "expectedReturnTime");
    const startingKm = Number(text(form, "startingOdometer"));
    const fuelLevel = optionalNumber(form, "fuelLevel");
    const batteryPercentage = optionalNumber(form, "batteryPercentage");
    const vehicle = await db.vehicle.findUnique({ where: { id } });
    if (!vehicle) return NextResponse.json({ message: "Vehicle could not be found." }, { status: 404 });
    if (vehicle.status !== "AVAILABLE") return NextResponse.json({ message: `Vehicle cannot be started because it is currently marked ${vehicle.status.replaceAll("_", " ").toLowerCase()}.` }, { status: 409 });
    if (!driverId) return NextResponse.json({ message: "Select a driver." }, { status: 400 });
    if (!purpose || !destination || !startLocation || !tripDate || !startTime) return NextResponse.json({ message: "Driver, purpose, route, trip date and start time are required." }, { status: 400 });
    if (!Number.isFinite(startingKm) || startingKm < vehicle.currentKm) return NextResponse.json({ message: "Starting odometer cannot be lower than the vehicle's current KM." }, { status: 400 });
    const startAt = asDateTime(tripDate, startTime);
    if (Number.isNaN(startAt.getTime()) || !validPercent(fuelLevel) || !validPercent(batteryPercentage)) return NextResponse.json({ message: "Enter a valid trip date and fuel/battery percentage." }, { status: 400 });
    const photos = await readTripPhotos(form);
    const result = await db.$transaction(async tx => {
      const driver = await tx.driver.findFirst({ where: { id: driverId, companyId: vehicle.companyId, status: "ACTIVE", trips: { none: { status: { in: ["ACTIVE", "IN_PROGRESS"] } } } } });
      if (!driver) throw new Error("DRIVER_UNAVAILABLE");
      const uploader = await tx.user.findFirst({ where: { id: "dev-admin", companyId: vehicle.companyId } });
      if (!uploader) throw new Error("UPLOADER_UNAVAILABLE");
      const claimed = await tx.vehicle.updateMany({ where: { id, status: "AVAILABLE" }, data: { status: "IN_USE", currentDriverId: driver.id, currentLocation: startLocation, currentKm: startingKm } });
      if (claimed.count !== 1) throw new Error("VEHICLE_ALREADY_CLAIMED");
      const remarks = text(form, "remarks").trim() || null;
      const trip = await tx.trip.create({ data: {
        vehicleId: id, driverId: driver.id, purpose, startLocation, destination, tripDate: new Date(tripDate), startTime: startAt,
        expectedReturnTime: expectedReturnTime ? asDateTime(tripDate, expectedReturnTime) : null, startKm: startingKm, status: "IN_PROGRESS", fuelLevel, batteryPercentage, remarks,
        inspections: { create: { inspectionType: "PRE_TRIP", tyreStatus: checked(form, "tyresOk") && checked(form, "tyrePressureOk") ? "OK" : "ATTENTION", damageStatus: checked(form, "existingDamage") ? "EXISTING_DAMAGE" : "CLEAR", fuelLevel: fuelLevel ?? 0, notes: remarks, photos: [], tyresOk: checked(form, "tyresOk"), tyrePressureOk: checked(form, "tyrePressureOk"), lightsOk: checked(form, "lightsOk"), indicatorsOk: checked(form, "indicatorsOk"), brakeLightsOk: checked(form, "brakeLightsOk"), mirrorsOk: checked(form, "mirrorsOk"), warningLights: checked(form, "warningLights"), mechanicalProblem: checked(form, "mechanicalProblem") } },
        vehiclePhotos: { create: photos.map(photo => ({ ...photo, vehicleId: id, driverId: driver.id, uploadedById: uploader.id, phase: "PRE_TRIP" })) },
      } });
      await tx.vehicleActivity.create({ data: { vehicleId: id, userId: uploader.id, action: "TRIP_STARTED", description: `Trip started to ${destination}`, metadata: { tripId: trip.id, driverId: driver.id, preTripInspection: "COMPLETED", photoCount: photos.length } } });
      return trip;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("Start trip failed", error);
    if (error instanceof TripPhotoUploadError && error.kind === "REQUIRED") return NextResponse.json({ message: `${photoLabel(error.photoType)} photo is required.` }, { status: 400 });
    if (error instanceof TripPhotoUploadError) return NextResponse.json({ message: "Upload JPG, PNG or WEBP photos no larger than 5 MB each." }, { status: 400 });
    if (error instanceof Error && error.message === "DRIVER_UNAVAILABLE") return NextResponse.json({ message: "The selected driver is not available." }, { status: 409 });
    if (error instanceof Error && error.message === "UPLOADER_UNAVAILABLE") return NextResponse.json({ message: "The authenticated user is not associated with this company." }, { status: 403 });
    if ((error instanceof Error && error.message === "VEHICLE_ALREADY_CLAIMED") || (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034")) return NextResponse.json({ message: "This vehicle or driver is no longer available for a trip." }, { status: 409 });
    return NextResponse.json({ message: "Trip could not be started. No changes were saved." }, { status: 500 });
  }
}
