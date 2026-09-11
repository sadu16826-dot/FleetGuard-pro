import {
  documentVehicle,
  documentReference,
  documentFailure,
  readRecordInput,
  documentSelect,
} from "@/lib/document-server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
type ServiceInput = {
  serviceType?: string;
  serviceDate?: string;
  provider?: string;
  serviceCentre?: string;
  odometer?: number;
  serviceCost?: number;
  partsCost?: number;
  labourCost?: number;
  notes?: string;
  nextServiceDate?: string;
  nextServiceKm?: number;
};
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await documentVehicle(id);
    return NextResponse.json(
      await db.service.findMany({
        where: { vehicleId: id },
        include: { attachments: { select: documentSelect } },
        orderBy: { serviceDate: "desc" },
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
    const parsed = await readRecordInput(request, "service");
    const input = parsed.input as ServiceInput;
    if (!vehicle)
      return NextResponse.json(
        { message: "Vehicle could not be found." },
        { status: 404 },
      );
    const km = Number(input.odometer);
    if (!input.serviceType || !input.serviceDate)
      return NextResponse.json(
        { message: "Service type and date are required." },
        { status: 400 },
      );
    if (!Number.isFinite(km) || km < vehicle.currentKm)
      return NextResponse.json(
        {
          message:
            "Service odometer cannot be lower than the vehicle's current KM.",
        },
        { status: 400 },
      );
    if (!Number.isFinite(km) || !Number.isInteger(km))
      return NextResponse.json(
        { message: "Odometer must be a whole number." },
        { status: 400 },
      );
    if (
      !Number.isFinite(Number(input.serviceCost ?? 0)) ||
      Number(input.serviceCost ?? 0) < 0
    )
      return NextResponse.json(
        { message: "Enter a valid cost." },
        { status: 400 },
      );
    const record = await db.$transaction(async (tx) => {
      const service = await tx.service.create({
        data: {
          vehicleId: id,
          serviceType: input.serviceType!,
          serviceDate: new Date(input.serviceDate!),
          serviceKm: km,
          cost: Number(input.serviceCost ?? 0),
          provider: input.provider?.trim() || null,
          serviceCentre: input.serviceCentre?.trim() || null,
          partsCost: Number(input.partsCost ?? 0),
          labourCost: Number(input.labourCost ?? 0),
          notes: input.notes?.trim() || null,
          nextServiceDate: input.nextServiceDate
            ? new Date(input.nextServiceDate)
            : null,
          nextServiceKm:
            input.nextServiceKm == null ? null : Number(input.nextServiceKm),
          status: "COMPLETED",
        },
      });
      for (const attachment of parsed.attachments)
        await tx.vehicleDocument.create({
          data: {
            ...attachment,
            vehicleId: id,
            serviceId: service.id,
            ...documentReference(id, { serviceId: service.id }),
            uploadedBy: user.name,
            uploadedById: user.id,
          },
        });
      await tx.vehicle.update({
        where: { id },
        data: {
          currentKm: km,
          lastServiceDate: new Date(input.serviceDate!),
          lastServiceKm: km,
          nextServiceDate: input.nextServiceDate
            ? new Date(input.nextServiceDate)
            : null,
          nextServiceKm:
            input.nextServiceKm == null ? null : Number(input.nextServiceKm),
          status: ["SERVICE_DUE", "IN_SERVICE"].includes(vehicle.status)
            ? "AVAILABLE"
            : vehicle.status,
        },
      });
      await tx.vehicleActivity.create({
        data: {
          vehicleId: id,
          userId: user.id,
          action: "SERVICE_ADDED",
          description: `${input.serviceType!.replaceAll("_", " ")} service added`,
          metadata: {
            serviceId: service.id,
            attachmentCount: parsed.attachments.length,
          },
        },
      });
      return service;
    });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    return documentFailure(error);
  }
}
