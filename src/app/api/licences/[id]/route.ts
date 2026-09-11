import { NextResponse } from "next/server";
import { accessFailure } from "@/lib/access-control";
import { db } from "@/lib/db";
import { accessibleLicence } from "@/lib/licence-access";
import { LICENCE_TYPES, RENEWAL_STATUSES, validLicenceDateRange } from "@/lib/licence";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await accessibleLicence(id);
    const licence = await db.driverLicence.findUnique({ where: { id }, include: { driver: { select: { id: true, name: true, employeeId: true, profilePhotoUrl: true, phone: true, status: true } }, documents: { select: { id: true, fileName: true, mimeType: true, fileSize: true, isCurrent: true, createdAt: true, uploader: { select: { name: true } } }, orderBy: { createdAt: "desc" } }, previousLicence: { select: { id: true, licenceNumber: true, issueDate: true, expiryDate: true } }, renewals: { select: { id: true, licenceNumber: true, issueDate: true, expiryDate: true }, orderBy: { issueDate: "desc" } } } });
    return NextResponse.json(licence);
  } catch (error) { return accessFailure(error, "Unable to load licence."); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { licence } = await accessibleLicence(id, true);
    const input = await request.json() as Record<string, string | undefined>;
    const issueDate = new Date(input.issueDate ?? licence.issueDate);
    const expiryDate = new Date(input.expiryDate ?? licence.expiryDate);
    const licenceNumber = input.licenceNumber?.trim() || licence.licenceNumber;
    const licenceType = input.licenceType ?? licence.licenceType;
    const vehicleClass = input.vehicleClass?.trim() || licence.vehicleClass;
    if (!LICENCE_TYPES.includes(licenceType as never)) return NextResponse.json({ message: "Select a valid licence type." }, { status: 400 });
    if (!validLicenceDateRange(issueDate, expiryDate)) return NextResponse.json({ message: "Expiry date cannot be before issue date." }, { status: 400 });
    const duplicate = await db.driverLicence.findFirst({ where: { id: { not: id }, licenceNumber: { equals: licenceNumber, mode: "insensitive" }, isCurrent: true } });
    if (duplicate) return NextResponse.json({ message: "A licence with this number already exists." }, { status: 409 });
    const updated = await db.$transaction(async tx => {
      const row = await tx.driverLicence.update({ where: { id }, data: { licenceNumber, licenceType, vehicleClass, issueDate, expiryDate, issuingAuthority: input.issuingAuthority?.trim() || null, issuingCountry: input.issuingCountry?.trim() || null, issuingState: input.issuingState?.trim() || null, renewalDate: input.renewalDate ? new Date(input.renewalDate) : null, renewalApplicationDate: input.renewalApplicationDate ? new Date(input.renewalApplicationDate) : null, renewalStatus: RENEWAL_STATUSES.includes(input.renewalStatus as never) ? input.renewalStatus : licence.renewalStatus, operationalStatus: input.operationalStatus === "SUSPENDED" ? "SUSPENDED" : "ACTIVE", notes: input.notes?.trim() || null } });
      if (row.isCurrent) await tx.driver.update({ where: { id: row.driverId }, data: { licenseNumber: licenceNumber, licenseExpiry: expiryDate } });
      return row;
    });
    return NextResponse.json(updated);
  } catch (error) { return accessFailure(error, "Licence record could not be updated."); }
}
