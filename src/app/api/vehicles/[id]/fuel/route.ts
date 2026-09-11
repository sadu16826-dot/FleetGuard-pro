import {
  documentVehicle,
  documentReference,
  documentFailure,
  readRecordInput,
  documentSelect,
} from "@/lib/document-server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
type FuelInput = {
  fuelType?: string;
  quantity?: number;
  pricePerUnit?: number;
  totalCost?: number;
  date?: string;
  time?: string;
  odometer?: number;
  station?: string;
  paymentMethod?: string;
  receiptUrl?: string;
  notes?: string;
};
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await documentVehicle(id);
    return NextResponse.json(
      await db.fuelRecord.findMany({
        where: { vehicleId: id },
        include: { attachments: { select: documentSelect } },
        orderBy: { date: "desc" },
      }),
    );
  } catch (error) {
    return documentFailure(error);
  }
}
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { user, vehicle } = await documentVehicle(id, true);
    const parsed = await readRecordInput(request, "fuel");
    const input = parsed.input as FuelInput;
    if (!vehicle)
      return NextResponse.json(
        { message: "Vehicle could not be found." },
        { status: 404 },
      );
    const quantity = Number(input.quantity);
    const price = Number(input.pricePerUnit ?? 0);
    const km = Number(input.odometer);
    if (
      !input.fuelType ||
      !input.date ||
      !Number.isFinite(quantity) ||
      quantity <= 0
    )
      return NextResponse.json(
        {
          message:
            "Fuel type, date and a quantity greater than zero are required.",
        },
        { status: 400 },
      );
    if (!Number.isFinite(price) || price < 0)
      return NextResponse.json(
        { message: "Price per unit cannot be negative." },
        { status: 400 },
      );
    if (!Number.isFinite(km) || km < vehicle.currentKm)
      return NextResponse.json(
        {
          message:
            "Fuel odometer cannot be lower than the vehicle's current KM.",
        },
        { status: 400 },
      );
    const total =
      input.totalCost == null ? quantity * price : Number(input.totalCost);
    if (!Number.isFinite(km) || !Number.isInteger(km))
      return NextResponse.json(
        { message: "Odometer must be a whole number." },
        { status: 400 },
      );
    if (!Number.isFinite(total) || total < 0)
      return NextResponse.json(
        { message: "Enter a valid total." },
        { status: 400 },
      );
    const record = await db.$transaction(async (tx) => {
      const fuel = await tx.fuelRecord.create({
        data: {
          vehicleId: id,
          driverId: vehicle.currentDriverId,
          litres: quantity,
          amount: total,
          currentKm: km,
          date: new Date(`${input.date}T${input.time || "00:00"}`),
          fuelType: input.fuelType,
          pricePerUnit: price,
          station: input.station?.trim() || null,
          paymentMethod: input.paymentMethod?.trim() || null,
          receiptUrl: input.receiptUrl?.trim() || null,
          notes: input.notes?.trim() || null,
        },
      });
      for (const attachment of parsed.attachments)
        await tx.vehicleDocument.create({
          data: {
            ...attachment,
            vehicleId: id,
            fuelRecordId: fuel.id,
            ...documentReference(id, { fuelRecordId: fuel.id }),
            uploadedBy: user.name,
            uploadedById: user.id,
          },
        });
      if (km > vehicle.currentKm)
        await tx.vehicle.update({ where: { id }, data: { currentKm: km } });
      await tx.vehicleActivity.create({
        data: {
          vehicleId: id,
          userId: user.id,
          action: "FUEL_ADDED",
          description: `${quantity} ${input.fuelType === "ELECTRIC" ? "kWh" : "litres"} added`,
          metadata: {
            fuelRecordId: fuel.id,
            total,
            attachmentCount: parsed.attachments.length,
          },
        },
      });
      return fuel;
    });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    return documentFailure(error);
  }
}
