import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string; tripId: string; photoId: string }> }) {
  try {
    const { id, tripId, photoId } = await params;
    const photo = await db.tripVehiclePhoto.findFirst({
      where: { id: photoId, vehicleId: id, tripId },
      select: { data: true, mimeType: true, fileName: true },
    });
    if (!photo) return NextResponse.json({ message: "Trip photo could not be found." }, { status: 404 });
    return new Response(new Uint8Array(photo.data), {
      headers: {
        "Content-Type": photo.mimeType,
        "Content-Disposition": `inline; filename="${photo.fileName}"`,
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("Trip photo download failed", error);
    return NextResponse.json({ message: "Unable to load the trip photo." }, { status: 500 });
  }
}
