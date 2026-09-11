import { NextResponse } from "next/server";
import { accessFailure, authenticatedUser } from "@/lib/access-control";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await authenticatedUser({ module: "SETTINGS" });
    const company = await db.company.findUnique({
      where: { id: user.companyId! },
      select: { id: true, name: true, address: true, phone: true },
    });
    if (!company) return NextResponse.json({ message: "Company not found." }, { status: 404 });
    return NextResponse.json({ company });
  } catch (error) {
    return accessFailure(error, "Unable to load settings.");
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await authenticatedUser({ module: "SETTINGS", action: "MANAGE" });
    const body = (await request.json()) as { name?: string; address?: string; phone?: string };
    const name = body.name?.trim();
    if (!name) return NextResponse.json({ message: "Company name is required." }, { status: 400 });

    const company = await db.company.update({
      where: { id: user.companyId! },
      data: {
        name,
        address: body.address?.trim() || null,
        phone: body.phone?.trim() || null,
      },
      select: { id: true, name: true, address: true, phone: true },
    });
    return NextResponse.json({ company });
  } catch (error) {
    return accessFailure(error, "Unable to save settings.");
  }
}
