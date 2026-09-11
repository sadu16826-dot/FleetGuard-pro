import { NextResponse } from "next/server";
import { authenticatedUser } from "@/lib/access-control";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const user = await authenticatedUser({ module: "INSPECTIONS", action: "APPROVE" });
    const contentType = request.headers.get("content-type") ?? "";
    const form = contentType.includes("multipart/form-data") ? await request.formData() : null;
    const body = form ? Object.fromEntries(form.entries()) : await request.json();
    const vehicleId = String(body.vehicleId ?? "");
    const status = body.status === "ISSUE_REPORTED" ? "ISSUE_REPORTED" : "APPROVED";
    const vehicle = await db.vehicle.findFirst({ where: { id: vehicleId, companyId: user.companyId! }, select: { id: true, currentKm: true } });
    if (!vehicle) return NextResponse.json({ message: "Vehicle not found." }, { status: 404 });
    const start = new Date(); start.setHours(0, 0, 0, 0); const end = new Date(start); end.setDate(end.getDate() + 1);
    const existing = await db.inspection.findFirst({ where: { vehicleId, companyId: user.companyId!, inspectionDate: { gte: start, lt: end } }, select: { id: true } });
    if (existing) return NextResponse.json({ message: "Today's inspection is already recorded." }, { status: 409 });
    const files = form ? form.getAll("evidence").filter((value): value is File => value instanceof File && value.size > 0) : [];
    if (files.length > 10 || files.some(file => file.size > 10 * 1024 * 1024)) return NextResponse.json({ message: "Use no more than 10 files, with each file no larger than 10 MB." }, { status: 400 });
    const inspection = await db.$transaction(async tx => {
      const row = await tx.inspection.create({ data: { vehicleId, companyId: user.companyId!, inspectorId: user.id, inspectionType: "PERIODIC", inspectionDate: new Date(), previousKm: vehicle.currentKm, currentKm: vehicle.currentKm, result: status === "APPROVED" ? "PASSED" : "FAILED", status, tyreStatus: status === "APPROVED" ? "OK" : "ATTENTION", damageStatus: status === "APPROVED" ? "CLEAR" : "NEW_DAMAGE", fuelLevel: 0, notes: body.remarks ? String(body.remarks) : null, photos: [], tyresOk: status === "APPROVED", tyrePressureOk: status === "APPROVED", lightsOk: status === "APPROVED" } });
      for (const file of files) await tx.inspectionEvidence.create({ data: { inspectionId: row.id, vehicleId, uploadedById: user.id, fileName: file.name, mimeType: file.type || "application/octet-stream", fileSize: file.size, fileData: Buffer.from(await file.arrayBuffer()) } });
      await tx.vehicleActivity.create({ data: { vehicleId, userId: user.id, action: "INSPECTION_COMPLETED", description: `Daily inspection ${status === "APPROVED" ? "approved" : "issue reported"}`, metadata: { inspectionId: row.id, status, evidenceCount: files.length } } });
      return row;
    });
    return NextResponse.json(inspection, { status: 201 });
  } catch { return NextResponse.json({ message: "Inspection could not be recorded." }, { status: 500 }); }
}
