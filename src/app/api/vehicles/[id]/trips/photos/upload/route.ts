import { del } from "@vercel/blob";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { accessibleVehicle, accessFailure } from "@/lib/access-control";
import { MAX_TRIP_PHOTO_SIZE, TRIP_PHOTO_TYPES } from "@/lib/trip-photo-upload";

const types = new Set<string>(TRIP_PHOTO_TYPES);
const contentTypes = ["image/jpeg", "image/png", "image/webp"];

export const runtime = "nodejs";

function blobError(message: string, code: string, status: number) {
  return NextResponse.json({ code, message }, { status });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN)
      return blobError("Vehicle photo storage is temporarily unavailable.", "BLOB_CONFIGURATION_MISSING", 503);
    const { id } = await params;
    const body = await request.json() as HandleUploadBody;
    if (body.type === "blob.generate-client-token") await accessibleVehicle(id, true);
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = JSON.parse(clientPayload ?? "{}") as { photoType?: string };
        if (!types.has(payload.photoType ?? "") || !pathname.startsWith(`fleetguard/trips/${id}/pre-trip/`))
          throw new Error("Invalid vehicle photo upload.");
        return {
          addRandomSuffix: true,
          allowedContentTypes: contentTypes,
          maximumSizeInBytes: MAX_TRIP_PHOTO_SIZE,
          validUntil: Date.now() + 10 * 60 * 1000,
        };
      },
    });
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof SyntaxError)
      return blobError("The photo upload request was invalid.", "BLOB_CLIENT_TOKEN_FAILED", 400);
    if (error instanceof Error && error.message === "Invalid vehicle photo upload.")
      return blobError("The photo upload request was invalid.", "INVALID_PHOTO", 400);
    return accessFailure(error, "Vehicle photo storage is temporarily unavailable.");
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN)
      return blobError("Vehicle photo storage is temporarily unavailable.", "BLOB_CONFIGURATION_MISSING", 503);
    const { id } = await params;
    await accessibleVehicle(id, true);
    const { urls } = await request.json() as { urls?: unknown };
    if (!Array.isArray(urls) || urls.some(url => typeof url !== "string" || !url.includes(`/fleetguard/trips/${id}/pre-trip/`)))
      return NextResponse.json({ message: "Invalid vehicle photo cleanup request." }, { status: 400 });
    if (urls.length) await del(urls);
    return NextResponse.json({ deleted: urls.length });
  } catch (error) {
    return accessFailure(error, "Vehicle photo cleanup could not be completed.");
  }
}
