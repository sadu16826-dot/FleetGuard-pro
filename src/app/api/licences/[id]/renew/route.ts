import { NextResponse } from "next/server";
import { accessFailure } from "@/lib/access-control";
import { db } from "@/lib/db";
import { accessibleLicence } from "@/lib/licence-access";
import { validLicenceDateRange } from "@/lib/licence";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { licence } = await accessibleLicence(id, true);
    if (!licence.isCurrent) return NextResponse.json({ message: "Only the current licence can be renewed." }, { status: 409 });
    const input = await request.json() as Record<string, string | undefined>;
    const licenceNumber = input.licenceNumber?.trim() || licence.licenceNumber;
    const issueDate = new Date(input.issueDate ?? "");
    const expiryDate = new Date(input.expiryDate ?? "");
    if (!validLicenceDateRange(issueDate, expiryDate)) return NextResponse.json({ message: "Enter valid new issue and expiry dates." }, { status: 400 });
    const renewed = await db.$transaction(async tx => {
      await tx.driverLicence.update({ where: { id }, data: { isCurrent: false, renewalStatus: "RENEWED", renewalDate: new Date() } });
      const row = await tx.driverLicence.create({ data: { driverId: licence.driverId, licenceNumber, licenceType: input.licenceType || licence.licenceType, vehicleClass: input.vehicleClass?.trim() || licence.vehicleClass, issueDate, expiryDate, issuingAuthority: input.issuingAuthority?.trim() || licence.issuingAuthority, issuingCountry: input.issuingCountry?.trim() || licence.issuingCountry, issuingState: input.issuingState?.trim() || licence.issuingState, renewalStatus: "NOT_STARTED", previousLicenceId: id, notes: input.notes?.trim() || null } });
      await tx.driver.update({ where: { id: licence.driverId }, data: { licenseNumber: licenceNumber, licenseExpiry: expiryDate } });
      return row;
    });
    return NextResponse.json(renewed, { status: 201 });
  } catch (error) { return accessFailure(error, "Licence could not be renewed."); }
}
