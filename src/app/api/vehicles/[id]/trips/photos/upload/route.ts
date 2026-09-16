import { del } from "@vercel/blob";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { AccessError, accessibleVehicle, accessFailure } from "@/lib/access-control";
import { MAX_TRIP_PHOTO_SIZE, TRIP_PHOTO_TYPES } from "@/lib/trip-photo-upload";

const types = new Set<string>(TRIP_PHOTO_TYPES);
const contentTypes = ["image/jpeg", "image/png", "image/webp"];
const HANDLE_UPLOAD_TIMEOUT_MS = 45_000;

export const runtime = "nodejs";

function blobError(message: string, code: string, status: number) {
  return NextResponse.json({ code, message }, { status });
}

function logUploadEvent(event: string, vehicleId: string, photoType?: string, details?: Record<string, unknown>) {
  console.info("Trip photo upload", {
    event,
    vehicleId,
    ...(photoType ? { photoType } : {}),
    ...details,
  });
}

async function handleUploadWithTimeout(body: HandleUploadBody, request: Request, id: string) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      handleUpload({
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
      }),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error("BLOB_UPLOAD_TIMEOUT")), HANDLE_UPLOAD_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const startedAt = Date.now();
  let vehicleId = "unknown";
  let photoType: string | undefined;
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN)
      return blobError("Vehicle photo storage is temporarily unavailable.", "BLOB_CONFIGURATION_MISSING", 503);
    const { id } = await params;
    vehicleId = id;
    const body = await request.json() as HandleUploadBody;
    photoType = body.type === "blob.generate-client-token" && typeof body.payload.clientPayload === "string"
      ? (JSON.parse(body.payload.clientPayload) as { photoType?: string }).photoType
      : undefined;
    logUploadEvent("request-start", id, photoType, { requestType: body.type });
    if (body.type === "blob.generate-client-token")
      await accessibleVehicle(id, { module: "TRIPS", action: "CREATE" });
    const response = await handleUploadWithTimeout(body, request, id);
    logUploadEvent("request-complete", id, photoType, { durationMs: Date.now() - startedAt, status: 200 });
    return NextResponse.json(response);
  } catch (error) {
    const code = error instanceof AccessError
      ? error.status === 401 ? "AUTHENTICATION_REQUIRED" : "TRIP_UPLOAD_FORBIDDEN"
      : error instanceof Error && error.message === "BLOB_UPLOAD_TIMEOUT" ? "BLOB_UPLOAD_FAILED" : "BLOB_CLIENT_TOKEN_FAILED";
    const status = error instanceof AccessError
      ? error.status
      : code === "BLOB_UPLOAD_FAILED" ? 504 : code === "BLOB_CLIENT_TOKEN_FAILED" ? 400 : 500;
    logUploadEvent("request-error", vehicleId, photoType, { durationMs: Date.now() - startedAt, status, code });
    if (error instanceof AccessError)
      return blobError(error.message, error.status === 401 ? "AUTHENTICATION_REQUIRED" : "TRIP_UPLOAD_FORBIDDEN", error.status);
    if (error instanceof SyntaxError)
      return blobError("The photo upload request was invalid.", "BLOB_CLIENT_TOKEN_FAILED", 400);
    if (error instanceof Error && error.message === "Invalid vehicle photo upload.")
      return blobError("The photo upload request was invalid.", "INVALID_PHOTO", 400);
    if (error instanceof Error && error.message === "BLOB_UPLOAD_TIMEOUT")
      return blobError("Unable to upload vehicle photo.", "BLOB_UPLOAD_FAILED", 504);
    return accessFailure(error, "Vehicle photo storage is temporarily unavailable.");
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN)
      return blobError("Vehicle photo storage is temporarily unavailable.", "BLOB_CONFIGURATION_MISSING", 503);
    const { id } = await params;
    await accessibleVehicle(id, { module: "TRIPS", action: "CREATE" });
    const { urls } = await request.json() as { urls?: unknown };
    if (!Array.isArray(urls) || urls.some(url => typeof url !== "string" || !url.includes(`/fleetguard/trips/${id}/pre-trip/`)))
      return NextResponse.json({ message: "Invalid vehicle photo cleanup request." }, { status: 400 });
    if (urls.length) await del(urls);
    return NextResponse.json({ deleted: urls.length });
  } catch (error) {
    return accessFailure(error, "Vehicle photo cleanup could not be completed.");
  }
}
