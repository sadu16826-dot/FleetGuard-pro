import { NextResponse } from "next/server";
import { accessFailure } from "@/lib/access-control";
import { db } from "@/lib/db";
import { documentFileError, documentSignatureValid } from "@/lib/document-upload";
import { accessibleLicence } from "@/lib/licence-access";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { user, licence } = await accessibleLicence(id, true);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ message: "Select a licence document." }, { status: 400 });
    const error = documentFileError(file);
    if (error) return NextResponse.json({ message: error }, { status: 400 });
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!documentSignatureValid(bytes, file.type)) return NextResponse.json({ message: "The file contents do not match its file type." }, { status: 400 });
    const document = await db.$transaction(async tx => {
      await tx.driverLicenceDocument.updateMany({ where: { licenceId: id, isCurrent: true }, data: { isCurrent: false } });
      return tx.driverLicenceDocument.create({ data: { licenceId: id, driverId: licence.driverId, fileName: file.name, mimeType: file.type, fileSize: file.size, fileData: Buffer.from(bytes), uploadedById: user.id } });
    });
    return NextResponse.json({ id: document.id, fileName: document.fileName, mimeType: document.mimeType, fileSize: document.fileSize, createdAt: document.createdAt }, { status: 201 });
  } catch (error) { return accessFailure(error, "Unable to upload licence document."); }
}
