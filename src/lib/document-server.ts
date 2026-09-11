import { randomUUID } from "node:crypto";
import {
  AccessError,
  accessibleVehicle,
  authenticatedUser,
} from "@/lib/access-control";
import {
  documentFileError,
  documentSignatureValid,
  SERVICE_DOCUMENT_TYPES,
  FUEL_DOCUMENT_TYPES,
} from "@/lib/document-upload";
import type { DocumentType } from "@/generated/prisma";

export class DocumentError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export async function documentUser(write = false) {
  return authenticatedUser(write);
}
export async function documentVehicle(id: string, write = false) {
  return accessibleVehicle(id, write);
}
export function documentFailure(error: unknown) {
  const known = error instanceof DocumentError || error instanceof AccessError;
  return Response.json(
    {
      message: known
        ? error.message
        : "The document or record could not be saved. Please try again.",
    },
    { status: known ? error.status : 500 },
  );
}
export async function readDocumentFile(value: FormDataEntryValue | null) {
  if (!(value instanceof File))
    throw new DocumentError("Select a file to upload.");
  const error = documentFileError(value);
  if (error) throw new DocumentError(error);
  const data = new Uint8Array(await value.arrayBuffer());
  if (!documentSignatureValid(data, value.type))
    throw new DocumentError("The file contents do not match its type.");
  return {
    data,
    fileName: value.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120),
    originalFileName: value.name.slice(0, 255),
    mimeType: value.type,
    fileSize: value.size,
  };
}
export async function readRecordInput(
  request: Request,
  context: "service" | "fuel",
) {
  if (!request.headers.get("content-type")?.includes("multipart/form-data"))
    return { input: await request.json(), attachments: [] };
  const form = await readDocumentForm(request);
  const input = Object.fromEntries(
    [...form.entries()].filter(([, value]) => typeof value === "string"),
  );
  for (const key of Object.keys(input))
    if (input[key] === "") delete input[key];
  const files = form
    .getAll("attachment")
    .filter(
      (value) => value instanceof File && (value.name !== "" || value.size > 0),
    );
  if (files.length > 5)
    throw new DocumentError("Upload at most five files per record.");
  const types = form.getAll("attachmentType");
  const allowed: readonly string[] =
    context === "service" ? SERVICE_DOCUMENT_TYPES : FUEL_DOCUMENT_TYPES;
  const attachments = await Promise.all(
    files.map(async (file, i) => {
      const documentType = String(types[i] ?? "");
      if (!allowed.includes(documentType))
        throw new DocumentError("Select a valid attachment type.");
      return {
        ...(await readDocumentFile(file)),
        documentType: documentType as DocumentType,
      };
    }),
  );
  return { input, attachments };
}
// Metadata projections never fetch file bytes into list pages or JSON responses.
export const documentSelect = {
  id: true,
  vehicleId: true,
  serviceId: true,
  fuelRecordId: true,
  documentType: true,
  documentName: true,
  documentNumber: true,
  issueDate: true,
  expiryDate: true,
  fileName: true,
  originalFileName: true,
  mimeType: true,
  fileSize: true,
  uploadedBy: true,
  uploadedById: true,
  createdAt: true,
  notes: true,
} as const;
export function documentDate(value: unknown) {
  if (value === null || value === "") return null;
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(new Date(value).getTime())
  )
    throw new DocumentError("Enter a valid date.");
  return new Date(value);
}

export function documentReference(
  vehicleId: string,
  context: { serviceId?: string | null; fuelRecordId?: string | null } = {},
  id: string = randomUUID(),
) {
  const query = new URLSearchParams();
  if (context.serviceId) query.set("serviceId", context.serviceId);
  if (context.fuelRecordId) query.set("fuelRecordId", context.fuelRecordId);
  return {
    id,
    fileUrl: `/api/vehicles/${vehicleId}/documents/${id}${query.size ? `?${query}` : ""}`,
  };
}

export async function readDocumentForm(request: Request) {
  if (Number(request.headers.get("content-length")) > 51 * 1024 * 1024) {
    throw new DocumentError(
      "The upload is too large. Upload at most five files of 10 MB each.",
      413,
    );
  }
  try {
    return await request.formData();
  } catch {
    throw new DocumentError(
      "Unable to read the upload. Select valid files and try again.",
    );
  }
}
