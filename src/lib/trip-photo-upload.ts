export const TRIP_PHOTO_TYPES = ["FRONT", "REAR", "LEFT", "RIGHT"] as const;
const ALLOWED_IMAGES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export class TripPhotoUploadError extends Error {
  constructor(public kind: "REQUIRED" | "INVALID", public photoType: typeof TRIP_PHOTO_TYPES[number]) {
    super(`${kind}:${photoType}`);
  }
}

function hasValidSignature(bytes: Uint8Array, mimeType: string) {
  if (mimeType === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === "image/png") return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  return bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
}

export async function readTripPhotos(form: FormData) {
  return Promise.all(TRIP_PHOTO_TYPES.map(async photoType => {
    const value = form.get(`photo_${photoType}`);
    if (!(value instanceof File) || value.size === 0) throw new TripPhotoUploadError("REQUIRED", photoType);
    if (!ALLOWED_IMAGES.has(value.type) || value.size > MAX_IMAGE_SIZE) throw new TripPhotoUploadError("INVALID", photoType);
    const data = new Uint8Array(await value.arrayBuffer());
    if (!hasValidSignature(data, value.type)) throw new TripPhotoUploadError("INVALID", photoType);
    return { photoType, data, mimeType: value.type, fileName: value.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120), size: value.size };
  }));
}

export function photoLabel(photoType: string) {
  return photoType === "LEFT" ? "Left side" : photoType === "RIGHT" ? "Right side" : photoType[0] + photoType.slice(1).toLowerCase();
}
