import { NextResponse } from "next/server";
import { authenticatedUser, accessFailure } from "@/lib/access-control";
import { db } from "@/lib/db";
import { LICENCE_TYPES, RENEWAL_STATUSES, validLicenceDateRange } from "@/lib/licence";

export async function GET(request: Request) {
  try {
    const user = await authenticatedUser();
    const search = new URL(request.url).searchParams.get("search")?.trim();
    const licences = await db.driverLicence.findMany({
      where: {
        driver: { companyId: user.companyId! },
        ...(search ? { OR: [
          { licenceNumber: { contains: search, mode: "insensitive" } },
          { driver: { name: { contains: search, mode: "insensitive" } } },
          { driver: { employeeId: { contains: search, mode: "insensitive" } } },
        ] } : {}),
      },
      select: { id: true, driverId: true, licenceNumber: true, licenceType: true, vehicleClass: true, issueDate: true, expiryDate: true, renewalStatus: true, operationalStatus: true, isCurrent: true, driver: { select: { name: true, employeeId: true } }, documents: { where: { isCurrent: true }, select: { id: true, fileName: true, mimeType: true, fileSize: true, createdAt: true }, take: 1 } },
      orderBy: [{ isCurrent: "desc" }, { expiryDate: "asc" }],
    });
    const drivers = await db.driver.findMany({ where: { companyId: user.companyId! }, select: { id: true, name: true, employeeId: true, phone: true, status: true }, orderBy: { name: "asc" } });
    return NextResponse.json({ licences, drivers });
  } catch (error) { return accessFailure(error, "Unable to load licences."); }
}

export async function POST(request: Request) {
  try {
    const user = await authenticatedUser(true);
    const input = await request.json() as Record<string, string | undefined>;
    const driverId = input.driverId?.trim();
    const licenceNumber = input.licenceNumber?.trim();
    const licenceType = input.licenceType?.trim();
    const vehicleClass = input.vehicleClass?.trim();
    const issueDate = new Date(input.issueDate ?? "");
    const expiryDate = new Date(input.expiryDate ?? "");
    if (!driverId) return NextResponse.json({ message: "Please select a driver." }, { status: 400 });
    if (!licenceNumber) return NextResponse.json({ message: "Licence number is required." }, { status: 400 });
    if (!licenceType || !LICENCE_TYPES.includes(licenceType as never)) return NextResponse.json({ message: "Select a valid licence type." }, { status: 400 });
    if (!vehicleClass) return NextResponse.json({ message: "Licence category is required." }, { status: 400 });
    if (!validLicenceDateRange(issueDate, expiryDate)) return NextResponse.json({ message: "Expiry date cannot be before issue date." }, { status: 400 });
    const driver = await db.driver.findFirst({ where: { id: driverId, companyId: user.companyId! }, select: { id: true } });
    if (!driver) return NextResponse.json({ message: "Driver not found." }, { status: 404 });
    const duplicate = await db.driverLicence.findFirst({ where: { licenceNumber: { equals: licenceNumber, mode: "insensitive" }, isCurrent: true } });
    if (duplicate) return NextResponse.json({ message: "A licence with this number already exists." }, { status: 409 });
    const result = await db.$transaction(async tx => {
      await tx.driverLicence.updateMany({ where: { driverId, isCurrent: true }, data: { isCurrent: false } });
      const licence = await tx.driverLicence.create({ data: { driverId, licenceNumber, licenceType, vehicleClass, issueDate, expiryDate, renewalDate: input.renewalDate ? new Date(input.renewalDate) : null, issuingAuthority: input.issuingAuthority?.trim() || null, issuingCountry: input.issuingCountry?.trim() || null, issuingState: input.issuingState?.trim() || null, renewalStatus: RENEWAL_STATUSES.includes(input.renewalStatus as never) ? input.renewalStatus! : "NOT_STARTED", notes: input.notes?.trim() || null } });
      await tx.driver.update({ where: { id: driverId }, data: { licenseNumber: licenceNumber, licenseExpiry: expiryDate } });
      return licence;
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) { if (process.env.NODE_ENV !== "production") console.error("Licence creation failed", error); return accessFailure(error, "Licence record could not be created."); }
}
