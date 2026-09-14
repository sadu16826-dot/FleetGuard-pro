import { documentSignatureValid } from "@/lib/document-upload";

export const MAX_PRIMARY_VEHICLE_PHOTO_SIZE = 5 * 1024 * 1024;
export const PRIMARY_VEHICLE_PHOTO_ACCEPT = "image/jpeg,image/png,image/webp";

export class VehiclePhotoError extends Error {
  constructor(message: string, public status: 400 | 413 = 400) {
    super(message);
  }
}

const extensions: Record<string, readonly string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
};

export function primaryVehiclePhotoError(
  file: Pick<File, "name" | "type" | "size">,
) {
  if (!file.size) return "Select a non-empty vehicle photo.";
  if (file.size > MAX_PRIMARY_VEHICLE_PHOTO_SIZE)
    return "Vehicle photos must be no larger than 5 MB.";
  if (!extensions[file.type]?.includes(file.name.split(".").pop()?.toLowerCase() ?? ""))
    return "Upload a JPG, PNG, or WEBP image with a matching file extension.";
  return null;
}

export async function readPrimaryVehiclePhoto(value: FormDataEntryValue | null) {
  if (!(value instanceof File))
    throw new VehiclePhotoError("Select a vehicle photo to upload.");
  const error = primaryVehiclePhotoError(value);
  if (error) throw new VehiclePhotoError(error);
  const data = new Uint8Array(await value.arrayBuffer());
  if (!documentSignatureValid(data, value.type))
    throw new VehiclePhotoError("The vehicle photo contents do not match its image type.");
  return {
    data,
    fileName: value.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120),
    mimeType: value.type,
  };
}

export function primaryVehiclePhotoReference(vehicleId: string) {
  return `/api/vehicles/${vehicleId}/primary-photo`;
}
