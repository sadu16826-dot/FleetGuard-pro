import { NextResponse } from "next/server";
import { accessibleVehicle, accessFailure } from "@/lib/access-control";
import { db } from "@/lib/db";
import {
  MAX_PRIMARY_VEHICLE_PHOTO_SIZE,
  primaryVehiclePhotoReference,
  readPrimaryVehiclePhoto,
  VehiclePhotoError,
} from "@/lib/vehicle-photo";

type Context = { params: Promise<{ id: string }> };

export const runtime = "nodejs";

function photoFailure(error: unknown, fallback: string) {
  if (error instanceof VehiclePhotoError)
    return NextResponse.json({ message: error.message }, { status: error.status });
  return accessFailure(error, fallback);
}

export async function GET(_: Request, { params }: Context) {
  try {
    const { id } = await params;
    await accessibleVehicle(id);
    const photo = await db.vehicle.findUnique({
      where: { id },
      select: {
        primaryPhotoData: true,
        primaryPhotoMimeType: true,
        primaryPhotoFileName: true,
      },
    });
    if (!photo?.primaryPhotoData || !photo.primaryPhotoMimeType)
      return NextResponse.json({ message: "Vehicle photo not found." }, { status: 404 });
    return new Response(new Uint8Array(photo.primaryPhotoData), {
      headers: {
        "Content-Type": photo.primaryPhotoMimeType,
        "Content-Disposition": `inline; filename="${(photo.primaryPhotoFileName ?? "vehicle-photo").replace(/[^a-zA-Z0-9._-]/g, "_")}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "sandbox",
      },
    });
  } catch (error) {
    return accessFailure(error, "Unable to load the vehicle photo.");
  }
}

export async function POST(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const { user } = await accessibleVehicle(id, true);
    if (!request.headers.get("content-type")?.includes("multipart/form-data"))
      return NextResponse.json({ message: "Submit the vehicle photo as form data." }, { status: 400 });
    const contentLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_PRIMARY_VEHICLE_PHOTO_SIZE + 1024 * 1024)
      return NextResponse.json({ message: "Vehicle photos must be no larger than 5 MB." }, { status: 413 });
    const photo = await readPrimaryVehiclePhoto((await request.formData()).get("primaryPhoto"));
    const primaryPhotoUrl = primaryVehiclePhotoReference(id);
    await db.$transaction(async (tx) => {
      await tx.vehicle.update({
        where: { id },
        data: {
          primaryPhotoUrl,
          primaryPhotoData: photo.data,
          primaryPhotoMimeType: photo.mimeType,
          primaryPhotoFileName: photo.fileName,
        },
      });
      await tx.vehicleActivity.create({
        data: {
          vehicleId: id,
          userId: user.id,
          action: "VEHICLE_UPDATED",
          description: "Primary vehicle photo updated",
        },
      });
    });
    return NextResponse.json({ primaryPhotoUrl });
  } catch (error) {
    return photoFailure(error, "Unable to save the vehicle photo.");
  }
}

export async function DELETE(_: Request, { params }: Context) {
  try {
    const { id } = await params;
    const { user } = await accessibleVehicle(id, true);
    await db.$transaction(async (tx) => {
      await tx.vehicle.update({
        where: { id },
        data: {
          primaryPhotoUrl: null,
          primaryPhotoData: null,
          primaryPhotoMimeType: null,
          primaryPhotoFileName: null,
        },
      });
      await tx.vehicleActivity.create({
        data: {
          vehicleId: id,
          userId: user.id,
          action: "VEHICLE_UPDATED",
          description: "Primary vehicle photo removed",
        },
      });
    });
    return NextResponse.json({ primaryPhotoUrl: null });
  } catch (error) {
    return accessFailure(error, "Unable to remove the vehicle photo.");
  }
}
