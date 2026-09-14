"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { validateVehicle } from "@/lib/vehicle-utils";
import type { VehicleFormValues } from "@/types/vehicle";

const initial: Partial<VehicleFormValues> = { vehicleCode: "", vehicleName: "", registrationNumber: "", vehicleType: "", brand: "", model: "", fuelType: "", currentKm: undefined, status: "AVAILABLE" };
const numberFields = ["currentKm", "manufacturingYear", "lastServiceKm", "nextServiceKm", "seatingCapacity"] as const;

function Field({ label, name, type = "text", required, error, defaultValue }: { label: string; name: string; type?: string; required?: boolean; error?: string; defaultValue?: string | number }) {
  return <div className="space-y-1.5"><label className="block text-xs font-medium text-slate-700" htmlFor={name}>{label}{required && <span className="text-red-500"> *</span>}</label><Input id={name} name={name} type={type} defaultValue={defaultValue} min={type === "number" ? 0 : undefined}/>{error && <p className="text-xs text-red-600">{error}</p>}</div>;
}

function Select({ label, name, options, required, error, defaultValue = "" }: { label: string; name: string; options: string[]; required?: boolean; error?: string; defaultValue?: string }) {
  return <div className="space-y-1.5"><label className="block text-xs font-medium text-slate-700" htmlFor={name}>{label}{required && <span className="text-red-500"> *</span>}</label><select id={name} name={name} defaultValue={defaultValue} className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500"><option value="">Select {label.toLowerCase()}</option>{options.map(option => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}</select>{error && <p className="text-xs text-red-600">{error}</p>}</div>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <Card className="p-5 sm:p-6"><h2 className="text-sm font-semibold">{title}</h2><div className="mt-5">{children}</div></Card>;
}

export function VehicleForm({ initialData, vehicleId }: { initialData?: Partial<VehicleFormValues>; vehicleId?: string } = {}) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");
  const values = { ...initial, ...initialData };
  const editing = Boolean(vehicleId);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const raw = Object.fromEntries(new FormData(event.currentTarget));
    const payload: Record<string, unknown> = { ...initial, ...raw };
    for (const field of numberFields) payload[field] = raw[field] === "" || raw[field] == null ? undefined : Number(raw[field]);
    payload.currentKm = Number(raw.currentKm || 0);
    delete payload.primaryPhoto;

    const vehicle = payload as unknown as VehicleFormValues;
    const validationErrors = validateVehicle(vehicle, editing ? Number(initialData?.currentKm ?? 0) : 0);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;

    setSaving(true); setApiError("");
    try {
      const response = await fetch(editing ? `/api/vehicles/${vehicleId}` : "/api/vehicles", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(vehicle) });
      const result = await response.json() as { id?: string; message?: string; errors?: Record<string, string> };
      if (!response.ok) { setErrors(result.errors ?? {}); setApiError(result.message ?? "Unable to add vehicle."); return; }
      router.push(editing ? `/vehicles/${vehicleId}?updated=1` : "/vehicles?created=1"); router.refresh();
    } catch { setApiError("Unable to connect to the vehicle service."); }
    finally { setSaving(false); }
  }

  return <form onSubmit={submit} className="space-y-5">
    <Section title="Basic vehicle information"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><Field label="Vehicle ID" name="vehicleCode" defaultValue={values.vehicleCode} required error={errors.vehicleCode}/><Field label="Vehicle name" name="vehicleName" defaultValue={values.vehicleName} required error={errors.vehicleName}/><Field label="Registration number" name="registrationNumber" defaultValue={values.registrationNumber} required error={errors.registrationNumber}/><Select label="Vehicle type" name="vehicleType" defaultValue={values.vehicleType} required error={errors.vehicleType} options={["CAR","SUV","VAN","BUS","TRUCK","PICKUP","OTHER"]}/><Field label="Brand" name="brand" defaultValue={values.brand} required error={errors.brand}/><Field label="Model" name="model" defaultValue={values.model} required error={errors.model}/><Field label="Variant" name="variant" defaultValue={values.variant}/><Field label="Manufacturing year" name="manufacturingYear" defaultValue={values.manufacturingYear} type="number" error={errors.manufacturingYear}/><Field label="Colour" name="colour" defaultValue={values.colour}/><Select label="Fuel type" name="fuelType" defaultValue={values.fuelType} required error={errors.fuelType} options={["PETROL","DIESEL","ELECTRIC","HYBRID","CNG"]}/><Select label="Transmission" name="transmission" defaultValue={values.transmission} options={["MANUAL","AUTOMATIC"]}/><Field label="Seating capacity" name="seatingCapacity" defaultValue={values.seatingCapacity} type="number"/></div></Section>
    <Section title="Technical information"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><Field label="Chassis number" name="chassisNumber" defaultValue={values.chassisNumber}/><Field label="Engine number" name="engineNumber" defaultValue={values.engineNumber}/><Field label="Current KM" name="currentKm" defaultValue={values.currentKm} type="number" required error={errors.currentKm}/></div></Section>
    <Section title="Ownership information"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><Field label="Owner name" name="ownerName" defaultValue={values.ownerName}/><Select label="Ownership type" name="ownershipType" defaultValue={values.ownershipType} options={["COMPANY_OWNED","LEASED","RENTED","EMPLOYEE_OWNED","THIRD_PARTY"]}/><Field label="Purchase date" name="purchaseDate" defaultValue={values.purchaseDate} type="date"/></div></Section>
    <Section title="Vehicle photo"><label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500"><Upload size={20} className="mb-2"/>Choose primary vehicle photo<input type="file" name="primaryPhoto" accept="image/jpeg,image/png" className="sr-only"/></label></Section>
    <Section title="Registration information"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><Field label="Registration date" name="registrationDate" defaultValue={values.registrationDate} type="date"/><Field label="Registration state" name="registrationState" defaultValue={values.registrationState}/><Field label="RC number" name="rcNumber" defaultValue={values.rcNumber}/></div></Section>
    <Section title="Initial maintenance information"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><Field label="Last service date" name="lastServiceDate" defaultValue={values.lastServiceDate} type="date"/><Field label="Last service KM" name="lastServiceKm" defaultValue={values.lastServiceKm} type="number"/><Field label="Next service date" name="nextServiceDate" defaultValue={values.nextServiceDate} type="date"/><Field label="Next service KM" name="nextServiceKm" defaultValue={values.nextServiceKm} type="number" error={errors.nextServiceKm}/><Select label="Initial status" name="status" defaultValue={values.status} options={["AVAILABLE","IN_USE","RESERVED","INSPECTION_REQUIRED","SERVICE_DUE","IN_SERVICE","ACCIDENT_REPAIR","NOT_ROADWORTHY","INACTIVE"]}/></div></Section>
    {apiError && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{apiError}</p>}
    <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button><Button disabled={saving}>{saving && <LoaderCircle size={16} className="mr-2 animate-spin"/>}{saving ? (editing ? "Saving changes…" : "Adding vehicle…") : (editing ? "Save changes" : "Add vehicle")}</Button></div>
  </form>;
}
