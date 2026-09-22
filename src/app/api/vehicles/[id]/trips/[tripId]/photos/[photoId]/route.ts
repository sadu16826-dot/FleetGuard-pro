import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accessibleVehicle, accessFailure } from "@/lib/access-control";

export async function GET(
  _: Request,
  {
    params,
  }: { params: Promise<{ id: string; tripId: string; photoId: string }> },
) {
  try {
    const { id, tripId, photoId } = await params;
    await accessibleVehicle(id);
    const photo = await db.tripVehiclePhoto.findFirst({
      where: { id: photoId, vehicleId: id, tripId },
      select: { data: true, storageUrl: true, mimeType: true, fileName: true },
    });
    if (!photo)
      return NextResponse.json(
        { message: "Trip photo could not be found." },
        { status: 404 },
      );
    if (photo.storageUrl) {
      const blob = await get(photo.storageUrl, { access: "private" });
      if (!blob || blob.statusCode !== 200 || !blob.stream)
        return NextResponse.json(
          { message: "Trip photo could not be found." },
          { status: 404 },
        );
      return new Response(blob.stream, {
        headers: {
          "Content-Type": blob.blob.contentType || photo.mimeType,
          "Content-Disposition": `inline; filename="${photo.fileName}"`,
          "Cache-Control": "private, max-age=3600",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
    if (!photo.data)
      return NextResponse.json({ message: "Trip photo could not be found." }, { status: 404 });
    return new Response(new Uint8Array(photo.data), {
      headers: {
        "Content-Type": photo.mimeType,
        "Content-Disposition": `inline; filename="${photo.fileName}"`,
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production")
      console.error("Trip photo download failed", error);
    return accessFailure(error, "Unable to load the trip photo.");
  }
}
