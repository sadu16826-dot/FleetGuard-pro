import { NextResponse } from "next/server";
import { accessFailure } from "@/lib/access-control";
import { db } from "@/lib/db";
import { accessibleLicence } from "@/lib/licence-access";

export async function GET(request: Request, { params }: { params: Promise<{ id: string; documentId: string }> }) {
  try {
    const { id, documentId } = await params;
    await accessibleLicence(id);
    const document = await db.driverLicenceDocument.findFirst({ where: { id: documentId, licenceId: id }, select: { fileData: true, fileName: true, mimeType: true } });
    if (!document) return NextResponse.json({ message: "Document not found." }, { status: 404 });
    const download = new URL(request.url).searchParams.has("download");
    const safeName = document.fileName.replace(/[\r\n"\\]/g, "_");
    return new Response(new Uint8Array(document.fileData), { headers: {
      "content-type": document.mimeType,
      "content-disposition": `${download ? "attachment" : "inline"}; filename="${safeName}"`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    }});
  } catch (error) { return accessFailure(error, "Unable to load licence document."); }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string; documentId: string }> }) {
  try {
    const { id, documentId } = await params;
    await accessibleLicence(id, true);
    const result = await db.driverLicenceDocument.deleteMany({ where: { id: documentId, licenceId: id } });
    if (!result.count) return NextResponse.json({ message: "Document not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) { return accessFailure(error, "Unable to delete licence document."); }
}
