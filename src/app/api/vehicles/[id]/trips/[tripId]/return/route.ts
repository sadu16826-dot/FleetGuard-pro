import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { photoLabel, readTripPhotos, TripPhotoUploadError } from "@/lib/trip-photo-upload";

const text = (form: FormData, name: string) => String(form.get(name) ?? "");
const number = (form: FormData, name: string) => text(form, name) === "" ? undefined : Number(text(form, name));
const checked = (form: FormData, name: string) => form.get(name) === "on";
const validPercent = (value?: number) => value == null || (Number.isFinite(value) && value >= 0 && value <= 100);

export async function POST(request: Request, { params }: { params: Promise<{ id: string; tripId: string }> }) {
  try {
    const { id, tripId } = await params;
    const form = await request.formData();
    const returnDate = text(form, "returnDate");
    const returnTime = text(form, "returnTime");
    const endingKm = Number(text(form, "endingOdometer"));
    const fuelLevel = number(form, "fuelLevel");
    const batteryPercentage = number(form, "batteryPercentage");
    const trip = await db.trip.findFirst({ where: { id: tripId, vehicleId: id, status: { in: ["ACTIVE", "IN_PROGRESS"] } }, include: { vehicle: { select: { companyId: true } } } });
    if (!trip) return NextResponse.json({ message: "Active trip could not be found." }, { status: 404 });
    if (!returnDate || !returnTime) return NextResponse.json({ message: "Return date and return time are required." }, { status: 400 });
    const returnedAt = new Date(`${returnDate}T${returnTime}`);
    if (!Number.isFinite(endingKm) || endingKm < (trip.startKm ?? 0)) return NextResponse.json({ message: "Ending odometer cannot be lower than the starting odometer." }, { status: 400 });
    if (Number.isNaN(returnedAt.getTime()) || !validPercent(fuelLevel) || !validPercent(batteryPercentage)) return NextResponse.json({ message: "Enter a valid return date and fuel/battery percentage." }, { status: 400 });
    const photos = await readTripPhotos(form);
    const newDamage = checked(form, "newDamage");
    const accident = checked(form, "accident");
    const tyreProblem = checked(form, "tyreProblem");
    const warningLight = checked(form, "warningLight");
    const mechanicalProblem = checked(form, "mechanicalProblem");
    const hasSafetyIssue = newDamage || accident || tyreProblem || warningLight || mechanicalProblem;
    const vehicleStatus = checked(form, "notRoadworthy") ? "NOT_ROADWORTHY" : hasSafetyIssue ? "INSPECTION_REQUIRED" : "AVAILABLE";
    const remarks = text(form, "remarks").trim() || null;
    const distance = endingKm - (trip.startKm ?? endingKm);
    const returned = await db.$transaction(async tx => {
      const uploader = await tx.user.findFirst({ where: { id: "dev-admin", companyId: trip.vehicle.companyId } });
      if (!uploader) throw new Error("UPLOADER_UNAVAILABLE");
      const completed = await tx.trip.updateMany({ where: { id: tripId, vehicleId: id, status: { in: ["ACTIVE", "IN_PROGRESS"] } }, data: { status: "COMPLETED", endKm: endingKm, endTime: returnedAt, returnFuelLevel: fuelLevel, returnBatteryPercentage: batteryPercentage, newDamage, accidentReported: accident, tyreProblem, warningLight, mechanicalProblem, returnRemarks: remarks } });
      if (completed.count !== 1) throw new Error("TRIP_ALREADY_RETURNED");
      await tx.tripVehiclePhoto.createMany({ data: photos.map(photo => ({ ...photo, tripId, vehicleId: id, driverId: trip.driverId, uploadedById: uploader.id, phase: "POST_TRIP" })) });
      const preTripPhotoCount = await tx.tripVehiclePhoto.count({ where: { tripId, vehicleId: id, phase: "PRE_TRIP" } });
      await tx.inspection.create({ data: { tripId, inspectionType: "POST_TRIP", tyreStatus: tyreProblem ? "ATTENTION" : "OK", damageStatus: newDamage ? "NEW_DAMAGE" : "CLEAR", fuelLevel: fuelLevel ?? 0, notes: remarks, photos: [], warningLights: warningLight, mechanicalProblem } });
      await tx.vehicle.update({ where: { id }, data: { currentKm: endingKm, status: vehicleStatus, currentDriverId: null, currentLocation: null } });
      await tx.vehicleActivity.create({ data: { vehicleId: id, userId: uploader.id, action: "TRIP_COMPLETED", description: `Trip completed — ${distance.toLocaleString()} KM`, metadata: { tripId, driverId: trip.driverId, status: vehicleStatus, returnCondition: "COMPLETED", preTripPhotoCount, postTripPhotoCount: photos.length } } });
      return tx.trip.findUniqueOrThrow({ where: { id: tripId } });
    });
    return NextResponse.json(returned);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("Return trip failed", error);
    if (error instanceof TripPhotoUploadError && error.kind === "REQUIRED") return NextResponse.json({ message: `${photoLabel(error.photoType)} photo is required.` }, { status: 400 });
    if (error instanceof TripPhotoUploadError) return NextResponse.json({ message: "Upload JPG, PNG or WEBP photos no larger than 5 MB each." }, { status: 400 });
    if (error instanceof Error && error.message === "UPLOADER_UNAVAILABLE") return NextResponse.json({ message: "The authenticated user is not associated with this company." }, { status: 403 });
    if (error instanceof Error && error.message === "TRIP_ALREADY_RETURNED") return NextResponse.json({ message: "This trip has already been returned." }, { status: 409 });
    return NextResponse.json({ message: "Vehicle return could not be completed. No changes were saved." }, { status: 500 });
  }
}
