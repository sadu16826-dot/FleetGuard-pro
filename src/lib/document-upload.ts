export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;
export const DOCUMENT_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp";
export const VEHICLE_DOCUMENT_TYPES = [
  "RC",
  "INSURANCE",
  "POLLUTION_CERTIFICATE",
  "FITNESS_CERTIFICATE",
  "PERMIT",
  "TAX_DOCUMENT",
  "REGISTRATION_DOCUMENT",
  "ROAD_TAX",
  "SERVICE_DOCUMENT",
  "INSPECTION_DOCUMENT",
  "WARRANTY",
  "LEASE_DOCUMENT",
  "FINANCE_DOCUMENT",
  "OTHER",
] as const;
export const SERVICE_DOCUMENT_TYPES = [
  "SERVICE_INVOICE",
  "SERVICE_BILL",
  "SERVICE_REPORT",
  "SERVICE_ESTIMATE",
  "WARRANTY",
  "SERVICE_DOCUMENT",
] as const;
export const FUEL_DOCUMENT_TYPES = [
  "FUEL_BILL",
  "FUEL_RECEIPT",
  "CHARGING_RECEIPT",
  "CHARGING_INVOICE",
  "OTHER_FUEL_DOCUMENT",
] as const;
const extensions: Record<string, string[]> = {
  "application/pdf": ["pdf"],
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
};
export function documentFileError(file: Pick<File, "name" | "type" | "size">) {
  if (!file.size) return "Select a non-empty file.";
  if (file.size > MAX_DOCUMENT_SIZE)
    return "Files must be no larger than 10 MB.";
  if (
    !extensions[file.type]?.includes(
      file.name.split(".").pop()?.toLowerCase() ?? "",
    )
  )
    return "Upload a PDF, JPG, PNG or WEBP file with a matching file extension.";
  return null;
}
export function documentSignatureValid(data: Uint8Array, mime: string) {
  const starts = (bytes: number[]) =>
    bytes.every((byte, index) => data[index] === byte);
  if (mime === "application/pdf") return starts([37, 80, 68, 70, 45]);
  if (mime === "image/jpeg") return starts([255, 216, 255]);
  if (mime === "image/png") return starts([137, 80, 78, 71, 13, 10, 26, 10]);
  return (
    mime === "image/webp" &&
    starts([82, 73, 70, 70]) &&
    [87, 69, 66, 80].every((byte, i) => data[i + 8] === byte)
  );
}
