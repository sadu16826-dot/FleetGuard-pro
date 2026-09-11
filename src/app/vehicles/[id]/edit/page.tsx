import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { db } from "@/lib/db";
import { authenticatedUser } from "@/lib/access-control";
import type { VehicleFormValues } from "@/types/vehicle";

export const dynamic = "force-dynamic";
const dateValue = (value: Date | null) => value?.toISOString().slice(0, 10);

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await authenticatedUser();
  const vehicle = await db.vehicle.findFirst({
    where: { id, companyId: user.companyId! },
  });
  if (!vehicle) notFound();
  const initialData: VehicleFormValues = {
    vehicleCode: vehicle.vehicleCode,
    vehicleName: vehicle.vehicleName,
    registrationNumber: vehicle.registrationNumber,
    vehicleType: vehicle.vehicleType,
    brand: vehicle.brand,
    model: vehicle.model,
    variant: vehicle.variant ?? undefined,
    manufacturingYear: vehicle.manufacturingYear ?? undefined,
    colour: vehicle.colour ?? undefined,
    fuelType: vehicle.fuelType,
    transmission: vehicle.transmission ?? undefined,
    seatingCapacity: vehicle.seatingCapacity ?? undefined,
    chassisNumber: vehicle.chassisNumber ?? undefined,
    engineNumber: vehicle.engineNumber ?? undefined,
    vin: vehicle.vin ?? undefined,
    currentKm: vehicle.currentKm,
    engineCapacity: vehicle.engineCapacity ?? undefined,
    batteryType: vehicle.batteryType ?? undefined,
    batteryCapacity: vehicle.batteryCapacity ?? undefined,
    vehicleWeight: vehicle.vehicleWeight ?? undefined,
    ownerName: vehicle.ownerName ?? undefined,
    ownershipType: vehicle.ownershipType ?? undefined,
    purchaseDate: dateValue(vehicle.purchaseDate),
    purchasePrice: vehicle.purchasePrice
      ? Number(vehicle.purchasePrice)
      : undefined,
    currentEstimatedValue: vehicle.currentEstimatedValue
      ? Number(vehicle.currentEstimatedValue)
      : undefined,
    financeStatus: vehicle.financeStatus ?? undefined,
    financeCompany: vehicle.financeCompany ?? undefined,
    registrationDate: dateValue(vehicle.registrationDate),
    registrationState: vehicle.registrationState ?? undefined,
    registrationAuthority: vehicle.registrationAuthority ?? undefined,
    rcNumber: vehicle.rcNumber ?? undefined,
    vehicleClass: vehicle.vehicleClass ?? undefined,
    lastServiceDate: dateValue(vehicle.lastServiceDate),
    lastServiceKm: vehicle.lastServiceKm ?? undefined,
    nextServiceDate: dateValue(vehicle.nextServiceDate),
    nextServiceKm: vehicle.nextServiceKm ?? undefined,
    serviceInterval: vehicle.serviceInterval ?? undefined,
    status: vehicle.status,
  };
  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href={`/vehicles/${id}`}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500"
      >
        <ArrowLeft size={14} />
        Vehicle profile
      </Link>
      <div className="my-6">
        <h1 className="text-2xl font-bold">Edit vehicle</h1>
        <p className="mt-1 text-sm text-slate-500">
          Update the saved vehicle information and operational status.
        </p>
      </div>
      <VehicleForm vehicleId={id} initialData={initialData} />
    </div>
  );
}
