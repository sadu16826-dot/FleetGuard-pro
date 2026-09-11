import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accessibleVehicle, accessFailure } from "@/lib/access-control";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await accessibleVehicle(id);
    return NextResponse.json(
      await db.vehicleActivity.findMany({
        where: { vehicleId: id },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
    );
  } catch (error) {
    return accessFailure(error, "Unable to load vehicle history.");
  }
}
