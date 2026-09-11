import { NextResponse } from "next/server";
import { accessFailure, authenticatedUser } from "@/lib/access-control";
import { db } from "@/lib/db";
import { resolvePassportStatus } from "@/lib/passport";

function normalizeText(value: FormDataEntryValue | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

const parseDate = (value: FormDataEntryValue | null | undefined, field: string) => {
  const raw = normalizeText(value);
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${field}.`);
  }
  return date;
};

async function toDataUrl(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  return `data:${file.type || "application/octet-stream"};base64,${Buffer.from(bytes).toString("base64")}`;
}

export async function GET(request: Request) {
  try {
    const user = await authenticatedUser();
    const search = new URL(request.url).searchParams.get("search")?.trim();

    const passports = await db.driverPassport.findMany({
      where: {
        driver: { companyId: user.companyId! },
        ...(search
          ? {
              OR: [
                { passportNumber: { contains: search, mode: "insensitive" } },
                { driver: { name: { contains: search, mode: "insensitive" } } },
                { driver: { employeeId: { contains: search, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      include: {
        driver: {
          select: { id: true, name: true, employeeId: true, status: true },
        },
      },
      orderBy: [{ expiryDate: "asc" }, { passportNumber: "asc" }],
    });

    return NextResponse.json({ passports });
  } catch (error) {
    return accessFailure(error, "Unable to load passport records.");
  }
}

export async function POST(request: Request) {
  try {
    const user = await authenticatedUser(true);
    const form = await request.formData();

    const driverId = normalizeText(form.get("driverId"));
    const passportNumber = normalizeText(form.get("passportNumber"));
    const passportHolderName = normalizeText(form.get("passportHolderName"));
    const issuingCountry = normalizeText(form.get("issuingCountry"));
    const placeOfIssue = normalizeText(form.get("placeOfIssue"));
    const issueDate = parseDate(form.get("issueDate"), "issue date");
    const expiryDate = parseDate(form.get("expiryDate"), "expiry date");

    if (!driverId) return NextResponse.json({ message: "Please select a driver." }, { status: 400 });
    if (!passportNumber) return NextResponse.json({ message: "Passport number is required." }, { status: 400 });
    if (!issueDate) return NextResponse.json({ message: "Issue date is required." }, { status: 400 });
    if (!expiryDate) return NextResponse.json({ message: "Expiry date is required." }, { status: 400 });
    if (expiryDate < issueDate) return NextResponse.json({ message: "Expiry date cannot be before issue date." }, { status: 400 });

    const driver = await db.driver.findFirst({
      where: { id: driverId, companyId: user.companyId! },
      select: { id: true, name: true, employeeId: true },
    });

    if (!driver) return NextResponse.json({ message: "Driver not found." }, { status: 404 });

    const existing = await db.driverPassport.findFirst({ where: { driverId } });
    if (existing) return NextResponse.json({ message: "This driver already has a passport record." }, { status: 409 });

    const documentFile = form.get("document");
    let fileUrl: string | null = null;
    let fileName: string | null = null;

    if (documentFile instanceof File && documentFile.size > 0) {
      fileUrl = await toDataUrl(documentFile);
      fileName = documentFile.name;
    }

    const status = resolvePassportStatus({ expiryDate });

    const passport = await db.driverPassport.create({
      data: {
        driverId,
        passportNumber,
        passportHolderName: passportHolderName || driver.name,
        issuingCountry: issuingCountry || null,
        placeOfIssue: placeOfIssue || null,
        issueDate,
        expiryDate,
        status,
        fileUrl,
        fileName,
      },
      include: {
        driver: {
          select: { id: true, name: true, employeeId: true, status: true },
        },
      },
    });

    return NextResponse.json(passport, { status: 201 });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("Passport creation failed", error);
    if (error instanceof Error && error.message.startsWith("Invalid ")) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return accessFailure(error, "Unable to add passport.");
  }
}
