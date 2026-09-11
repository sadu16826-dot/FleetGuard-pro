import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accessibleVehicle, accessFailure } from "@/lib/access-control";

const statuses = new Set([
  "GOOD",
  "MONITOR",
  "INSPECTION_REQUIRED",
  "REPLACE_SOON",
  "REPLACE_IMMEDIATELY",
]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; tyreId: string }> },
) {
  try {
    const { id, tyreId } = await params;
    const { user } = await accessibleVehicle(id, true);
    const input = (await request.json()) as {
      position?: string;
      brand?: string;
      model?: string | null;
      size?: string | null;
      serialNumber?: string | null;
      installationDate?: string;
      installationKm?: number;
      pressure?: number | null;
      condition?: string;
      status?: string;
      cost?: number | null;
    };
    const existing = await db.tyre.findFirst({
      where: { id: tyreId, vehicleId: id, status: { not: "REPLACED" } },
      include: { vehicle: { select: { currentKm: true } } },
    });
    if (!existing)
      return NextResponse.json(
        { message: "Current tyre could not be found." },
        { status: 404 },
      );
    const installationKm =
      input.installationKm == null
        ? existing.installationKm
        : Number(input.installationKm);
    if (
      installationKm != null &&
      (!Number.isFinite(installationKm) ||
        installationKm > existing.vehicle.currentKm)
    )
      return NextResponse.json(
        { message: "Installation KM cannot exceed the vehicle's current KM." },
        { status: 400 },
      );
    if (input.status && !statuses.has(input.status))
      return NextResponse.json(
        { message: "Select a valid tyre status." },
        { status: 400 },
      );
    const updated = await db.$transaction(async (tx) => {
      const tyre = await tx.tyre.update({
        where: { id: tyreId },
        data: {
          position: input.position,
          brand: input.brand,
          model: input.model,
          size: input.size,
          serialNumber: input.serialNumber,
          installationDate: input.installationDate
            ? new Date(input.installationDate)
            : undefined,
          installationKm,
          pressure: input.pressure,
          condition: input.condition,
          status: input.status as never,
          cost: input.cost,
        },
      });
      await tx.tyreHistory.create({
        data: {
          tyreId,
          action: "UPDATED",
          description: `Tyre details updated at ${tyre.position}`,
        },
      });
      await tx.vehicleActivity.create({
        data: {
          vehicleId: id,
          userId: user.id,
          action: "TYRE_UPDATED",
          description: `Tyre updated at ${tyre.position}`,
          metadata: { tyreId },
        },
      });
      return tyre;
    });
    return NextResponse.json(updated);
  } catch (error) {
    if (process.env.NODE_ENV !== "production")
      console.error("Update tyre failed", error);
    return accessFailure(error, "Unable to update tyre.");
  }
}
