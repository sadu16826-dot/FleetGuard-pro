import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accessibleVehicle, accessFailure } from "@/lib/access-control";
type TyreInput = {
  position?: string;
  brand?: string;
  model?: string;
  size?: string;
  serialNumber?: string;
  installationDate?: string;
  installationKm?: number;
  pressure?: number;
  condition?: string;
  status?: string;
  cost?: number;
};
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await accessibleVehicle(id);
    return NextResponse.json(
      await db.tyre.findMany({
        where: { vehicleId: id },
        include: { history: true },
        orderBy: { position: "asc" },
      }),
    );
  } catch (error) {
    return accessFailure(error, "Unable to load tyres.");
  }
}
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { user, vehicle } = await accessibleVehicle(id, true);
    const input = (await request.json()) as TyreInput;
    const km = Number(input.installationKm);
    const positionTaken = await db.tyre.findFirst({ where: { vehicleId: id, position: input.position, status: { not: "REPLACED" } }, select: { id: true } });
    if (positionTaken)
      return NextResponse.json({ message: "That wheel position already has an active tyre." }, { status: 409 });
    if (
      !input.position ||
      !input.brand ||
      !input.installationDate ||
      !Number.isFinite(km) ||
      km > vehicle.currentKm
    )
      return NextResponse.json(
        {
          message:
            "Position, brand, installation date and a valid installation KM are required.",
        },
        { status: 400 },
      );
    const tyre = await db.$transaction(async (tx) => {
      const created = await tx.tyre.create({
        data: {
          vehicleId: id,
          position: input.position!,
          brand: input.brand!,
          model: input.model,
          size: input.size,
          serialNumber: input.serialNumber?.trim() || null,
          installationDate: new Date(input.installationDate!),
          installationKm: km,
          currentKm: vehicle.currentKm,
          pressure: input.pressure,
          condition: input.condition || "New",
          status: (input.status || "GOOD") as never,
          cost: input.cost,
        },
      });
      await tx.tyreHistory.create({
        data: {
          tyreId: created.id,
          action: "ADDED",
          description: `Tyre installed at ${input.position}`,
          metadata: { installationKm: km },
        },
      });
      await tx.vehicleActivity.create({
        data: {
          vehicleId: id,
          userId: user.id,
          action: "TYRE_ADDED",
          description: `Tyre added at ${input.position}`,
          metadata: { tyreId: created.id },
        },
      });
      return created;
    });
    return NextResponse.json(tyre, { status: 201 });
  } catch (error) {
    if (process.env.NODE_ENV !== "production")
      console.error("Add tyre failed", error);
    return accessFailure(error, "Unable to add tyre.");
  }
}
