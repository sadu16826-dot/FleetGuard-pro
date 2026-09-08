import Link from "next/link";
import { Plus } from "lucide-react";
import { VehicleTable } from "@/components/vehicles/vehicle-table";
import { db } from "@/lib/db";
import { getDocumentSummary, getServiceStatus } from "@/lib/vehicle-utils";
import type { VehicleListItem } from "@/types/vehicle";

export const dynamic = "force-dynamic";

export default async function VehiclesPage({ searchParams }: { searchParams: Promise<{ created?: string; updated?: string }> }) {
  const query = await searchParams;
  let records;
  try {
    records = await db.vehicle.findMany({ include: { documents: { select: { expiryDate: true } } }, orderBy: { updatedAt: "desc" } });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("Unable to load vehicles from PostgreSQL:", error);
    return <div className="mx-auto max-w-[1500px]"><div className="mb-6 flex items-end justify-between gap-4"><div><h1 className="text-2xl font-bold tracking-tight">Vehicles</h1><p className="mt-1 text-sm text-slate-500">Manage and monitor your complete fleet.</p></div><Link href="/vehicles/new" className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"><Plus size={16}/>Add Vehicle</Link></div><div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"><p className="font-semibold">Vehicle data is temporarily unavailable.</p><p className="mt-1">The database connection could not be established. Please try again.</p><Link href="/vehicles" className="mt-3 inline-flex font-semibold text-red-800 underline underline-offset-2">Retry</Link></div></div>;
  }
  const vehicles: VehicleListItem[] = records.map(vehicle => ({ id: vehicle.id, vehicleCode: vehicle.vehicleCode, vehicleName: vehicle.vehicleName, registrationNumber: vehicle.registrationNumber, vehicleType: vehicle.vehicleType, brand: vehicle.brand, model: vehicle.model, fuelType: vehicle.fuelType, currentKm: vehicle.currentKm, status: vehicle.status, serviceStatus: getServiceStatus(vehicle.currentKm, vehicle.nextServiceKm, vehicle.nextServiceDate), documentStatus: getDocumentSummary(vehicle.documents.map(document => document.expiryDate)), updatedAt: vehicle.updatedAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }), primaryPhotoUrl: vehicle.primaryPhotoUrl ?? undefined }));
  return <div className="mx-auto max-w-[1500px]"><div className="mb-6 flex items-end justify-between gap-4"><div><h1 className="text-2xl font-bold tracking-tight">Vehicles</h1><p className="mt-1 text-sm text-slate-500">Manage and monitor your complete fleet.</p></div><Link href="/vehicles/new" className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"><Plus size={16}/>Add Vehicle</Link></div>{query.created && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">Vehicle added successfully.</div>}{query.updated && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">Vehicle details updated successfully.</div>}<VehicleTable vehicles={vehicles}/></div>;
}
