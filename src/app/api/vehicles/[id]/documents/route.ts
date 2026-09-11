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
import { VEHICLE_DOCUMENT_TYPES } from "@/lib/document-upload";
import type { DocumentType } from "@/generated/prisma";
type Context = { params: Promise<{ id: string }> };
export async function GET(_: Request, { params }: Context) {
  try {
    const { id } = await params;
    await documentVehicle(id);
    return Response.json(
      await db.vehicleDocument.findMany({
        where: { vehicleId: id, serviceId: null, fuelRecordId: null },
        select: documentSelect,
        orderBy: { createdAt: "desc" },
      }),
    );
  } catch (error) {
    return documentFailure(error);
  }
}
export async function POST(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const { user } = await documentVehicle(id, true);
    const form = await readDocumentForm(request);
    const documentName = String(form.get("documentName") ?? "").trim();
    const documentType = String(form.get("documentType") ?? "") as DocumentType;
    if (
      !documentName ||
      !(VEHICLE_DOCUMENT_TYPES as readonly string[]).includes(documentType)
    )
      throw new DocumentError(
        "Document name and a valid vehicle document type are required.",
      );
    const file = await readDocumentFile(form.get("file"));
    const issueDate = documentDate(form.get("issueDate"));
    const expiryDate = documentDate(form.get("expiryDate"));
    if (issueDate && expiryDate && expiryDate < issueDate)
      throw new DocumentError("Expiry date cannot precede issue date.");
    const document = await db.$transaction(async (tx) => {
      const created = await tx.vehicleDocument.create({
        data: {
          ...file,
          vehicleId: id,
          documentType,
          documentName,
          documentNumber:
            String(form.get("documentNumber") ?? "").trim() || null,
          issueDate,
          expiryDate,
          notes: String(form.get("notes") ?? "").trim() || null,
          ...documentReference(id),
          uploadedBy: user.name,
          uploadedById: user.id,
        },
        select: documentSelect,
      });
      await tx.vehicleActivity.create({
        data: {
          vehicleId: id,
          userId: user.id,
          action: "DOCUMENT_UPLOADED",
          description: `${documentName} uploaded`,
          metadata: { documentId: created.id },
        },
      });
      return created;
    });
    return Response.json(document, { status: 201 });
  } catch (error) {
    return documentFailure(error);
  }
}
