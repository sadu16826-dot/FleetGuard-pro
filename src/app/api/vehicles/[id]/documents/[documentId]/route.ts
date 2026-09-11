import { db } from "@/lib/db";
import {
  documentVehicle,
  documentReference,
  documentFailure,
  documentSelect,
  DocumentError,
  readDocumentFile,
  readDocumentForm,
  documentDate,
} from "@/lib/document-server";
import type { Prisma } from "@/generated/prisma";
type Context = { params: Promise<{ id: string; documentId: string }> };
function scope(request: Request, id: string, documentId: string) {
  const query = new URL(request.url).searchParams;
  const serviceId = query.get("serviceId");
  const fuelRecordId = query.get("fuelRecordId");
  if (serviceId && fuelRecordId)
    throw new DocumentError("Invalid document context.");
  return {
    id: documentId,
    vehicleId: id,
    serviceId,
    fuelRecordId,
    ...(serviceId ? { service: { vehicleId: id } } : {}),
    ...(fuelRecordId ? { fuelRecord: { vehicleId: id } } : {}),
  };
}
export async function GET(request: Request, { params }: Context) {
  try {
    const { id, documentId } = await params;
    await documentVehicle(id);
    const document = await db.vehicleDocument.findFirst({
      where: scope(request, id, documentId),
      select: { data: true, mimeType: true, fileName: true },
    });
    if (!document) throw new DocumentError("Document not found.", 404);
    if (!document.data || !document.mimeType)
      throw new DocumentError(
        "This legacy document has no stored file. Replace it to enable secure viewing.",
        404,
      );
    const download = new URL(request.url).searchParams.get("download") === "1";
    return new Response(new Uint8Array(document.data), {
      headers: {
        "Content-Type": document.mimeType,
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${document.fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "sandbox",
      },
    });
  } catch (error) {
    return documentFailure(error);
  }
}
export async function PATCH(request: Request, { params }: Context) {
  try {
    const { id, documentId } = await params;
    const { user } = await documentVehicle(id, true);
    const where = scope(request, id, documentId);
    const existing = await db.vehicleDocument.findFirst({
      where,
      select: documentSelect,
    });
    if (!existing) throw new DocumentError("Document not found.", 404);
    const replacing = request.headers
      .get("content-type")
      ?.includes("multipart/form-data");
    let data: Prisma.VehicleDocumentUncheckedUpdateManyInput;
    if (replacing) {
      data = {
        ...(await readDocumentFile((await readDocumentForm(request)).get("file"))),
        fileUrl: documentReference(id, existing, documentId).fileUrl,
        uploadedBy: user.name,
        uploadedById: user.id,
      };
    } else {
      const input = await request.json();
      data = {};
      for (const key of ["documentName", "documentNumber", "notes"] as const) {
        if (key in input) {
          if (input[key] !== null && typeof input[key] !== "string")
            throw new DocumentError("Invalid document details.");
          data[key] = input[key]?.trim() || null;
        }
      }
      if ("issueDate" in input) data.issueDate = documentDate(input.issueDate);
      if ("expiryDate" in input)
        data.expiryDate = documentDate(input.expiryDate);
      const issue =
        data.issueDate === undefined ? existing.issueDate : data.issueDate;
      const expiry =
        data.expiryDate === undefined ? existing.expiryDate : data.expiryDate;
      if (issue instanceof Date && expiry instanceof Date && expiry < issue)
        throw new DocumentError("Expiry date cannot precede issue date.");
    }
    await db.$transaction(async (tx) => {
      const updated = await tx.vehicleDocument.updateMany({ where, data });
      if (!updated.count) throw new DocumentError("Document not found.", 404);
      await tx.vehicleActivity.create({
        data: {
          vehicleId: id,
          userId: user.id,
          action: replacing ? "DOCUMENT_REPLACED" : "DOCUMENT_UPDATED",
          description: `${existing.documentName ?? existing.fileName} ${replacing ? "replaced" : "updated"}`,
          metadata: {
            documentId,
            serviceId: existing.serviceId,
            fuelRecordId: existing.fuelRecordId,
          },
        },
      });
    });
    return Response.json({ ok: true });
  } catch (error) {
    return documentFailure(error);
  }
}
export async function DELETE(request: Request, { params }: Context) {
  try {
    const { id, documentId } = await params;
    const { user } = await documentVehicle(id, true);
    const where = scope(request, id, documentId);
    await db.$transaction(async (tx) => {
      const existing = await tx.vehicleDocument.findFirst({
        where,
        select: documentSelect,
      });
      if (!existing) throw new DocumentError("Document not found.", 404);
      await tx.vehicleDocument.deleteMany({ where });
      await tx.vehicleActivity.create({
        data: {
          vehicleId: id,
          userId: user.id,
          action: "DOCUMENT_DELETED",
          description: `${existing.documentName ?? existing.fileName} removed`,
          metadata: {
            documentId,
            serviceId: existing.serviceId,
            fuelRecordId: existing.fuelRecordId,
          },
        },
      });
    });
    return Response.json({ ok: true });
  } catch (error) {
    return documentFailure(error);
  }
}
