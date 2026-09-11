import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accessibleVehicle, accessFailure } from "@/lib/access-control";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string; tripId: string }> },
) {
  try {
    const { id, tripId } = await params;
    await accessibleVehicle(id);
    const trip = await db.trip.findFirst({
      where: { id: tripId, vehicleId: id },
      include: {
        driver: true,
        inspections: true,
        vehiclePhotos: {
          select: {
            id: true,
            photoType: true,
            phase: true,
            mimeType: true,
            fileName: true,
            size: true,
            createdAt: true,
            uploadedBy: { select: { id: true, name: true } },
          },
        },
      },
    });
    return trip
      ? NextResponse.json(trip)
      : NextResponse.json(
          { message: "Trip could not be found." },
          { status: 404 },
        );
  } catch (error) {
    return accessFailure(error, "Unable to load trip.");
  }
}
