"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CarFront, ChevronDown, MoreHorizontal, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { VehicleStatusBadge } from "./vehicle-status-badge";
import { normalizeSearch } from "@/lib/vehicle-utils";
import type { VehicleListItem, VehicleStatus } from "@/types/vehicle";

const selectClass = "h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-600 outline-none focus:border-blue-500";
const statuses: VehicleStatus[] = ["AVAILABLE","IN_USE","RESERVED","INSPECTION_REQUIRED","SERVICE_DUE","IN_SERVICE","ACCIDENT_REPAIR","NOT_ROADWORTHY","INACTIVE"];

export function VehicleTable({ vehicles }: { vehicles: VehicleListItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [type, setType] = useState("ALL");
  const [fuel, setFuel] = useState("ALL");
  const [service, setService] = useState("ALL");
  const [menu, setMenu] = useState<string>();
  const [statusVehicle, setStatusVehicle] = useState<VehicleListItem>();
  const [nextStatus, setNextStatus] = useState<VehicleStatus>("AVAILABLE");
  const [deactivateVehicle, setDeactivateVehicle] = useState<VehicleListItem>();
  const [error, setError] = useState("");

  const filtered = useMemo(() => vehicles.filter(vehicle => {
    const query = normalizeSearch(search);
    const matchesSearch = !query || [vehicle.vehicleName, vehicle.vehicleCode, vehicle.registrationNumber, vehicle.brand, vehicle.model, vehicle.currentDriver ?? ""].some(value => normalizeSearch(value).includes(query));
    return matchesSearch && (status === "ALL" || vehicle.status === status) && (type === "ALL" || vehicle.vehicleType === type) && (fuel === "ALL" || vehicle.fuelType === fuel) && (service === "ALL" || vehicle.serviceStatus === service);
  }), [vehicles, search, status, type, fuel, service]);

  async function updateStatus(vehicleId: string, value: VehicleStatus) {
    setError("");
    const response = await fetch(`/api/vehicles/${vehicleId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: value }) });
    const result = await response.json() as { message?: string };
    if (!response.ok) { setError(result.message ?? "Vehicle status could not be updated."); return; }
    setStatusVehicle(undefined); setDeactivateVehicle(undefined); setMenu(undefined);
    startTransition(() => router.refresh());
  }

  if (!vehicles.length) return <Card className="grid min-h-80 place-items-center p-8 text-center"><div><CarFront className="mx-auto text-slate-300" size={32}/><h2 className="mt-4 text-sm font-semibold">No vehicles registered yet.</h2><p className="mt-2 text-xs text-slate-500">Add your first vehicle to start managing your fleet.</p><Link href="/vehicles/new" className="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white">Add Vehicle</Link></div></Card>;

  return <>
    {error && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 xl:flex-row"><div className="relative min-w-0 flex-1"><Search className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" size={16}/><input value={search} onChange={event => setSearch(event.target.value)} className="h-10 w-full rounded-lg border border-slate-200 pr-3 pl-9 text-sm outline-none focus:border-blue-500" placeholder="Search vehicles, registration numbers..."/></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4"><Filter value={status} setValue={setStatus} label="Status" items={statuses}/><Filter value={type} setValue={setType} label="Vehicle type" items={["CAR","SUV","VAN","BUS","TRUCK","PICKUP","OTHER"]}/><Filter value={fuel} setValue={setFuel} label="Fuel type" items={["PETROL","DIESEL","ELECTRIC","HYBRID","CNG"]}/><Filter value={service} setValue={setService} label="Service" items={["UP_TO_DATE","DUE_SOON","OVERDUE"]}/></div></div>
      <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[1100px] text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500"><tr>{["Vehicle","Registration number","Type","Current KM","Current driver","Status","Service","Documents","Last updated","Actions"].map(value => <th key={value} className="px-4 py-3 font-semibold">{value}</th>)}</tr></thead><tbody>{filtered.map(vehicle => <tr key={vehicle.id} className="border-t border-slate-100 hover:bg-slate-50/70"><td className="px-4 py-3"><VehicleIdentity vehicle={vehicle}/></td><td className="px-4 py-3 font-medium">{vehicle.registrationNumber}</td><td className="px-4 py-3 text-slate-500">{vehicle.vehicleType}</td><td className="px-4 py-3 font-medium">{vehicle.currentKm.toLocaleString()} KM</td><td className="px-4 py-3 text-slate-600">{vehicle.currentDriver ?? "Unassigned"}</td><td className="px-4 py-3"><VehicleStatusBadge status={vehicle.status}/></td><td className="px-4 py-3"><SummaryBadge value={vehicle.serviceStatus}/></td><td className="px-4 py-3"><SummaryBadge value={vehicle.documentStatus}/></td><td className="px-4 py-3 text-slate-500">{vehicle.updatedAt}</td><td className="relative px-4 py-3"><button onClick={() => setMenu(menu === vehicle.id ? undefined : vehicle.id)} aria-label={`Actions for ${vehicle.vehicleName}`} className="grid size-8 place-items-center rounded-md hover:bg-slate-100"><MoreHorizontal size={16}/></button>{menu === vehicle.id && <ActionMenu vehicle={vehicle} onStatus={() => { setStatusVehicle(vehicle); setNextStatus(vehicle.status); }} onDeactivate={() => setDeactivateVehicle(vehicle)}/>}</td></tr>)}</tbody></table></div>
      <div className="divide-y divide-slate-100 md:hidden">{filtered.map(vehicle => <div key={vehicle.id} className="p-4"><div className="flex items-start justify-between gap-3"><VehicleIdentity vehicle={vehicle}/><button onClick={() => setMenu(menu === vehicle.id ? undefined : vehicle.id)} className="grid size-8 place-items-center"><MoreHorizontal size={17}/></button></div><div className="mt-4 grid grid-cols-2 gap-3 text-xs"><div><p className="text-slate-400">Registration</p><p className="mt-1 font-medium">{vehicle.registrationNumber}</p></div><div><p className="text-slate-400">Current KM</p><p className="mt-1 font-medium">{vehicle.currentKm.toLocaleString()} KM</p></div><div><p className="text-slate-400">Status</p><div className="mt-1"><VehicleStatusBadge status={vehicle.status}/></div></div><div className="flex items-end gap-3"><Link href={`/vehicles/${vehicle.id}`} className="font-semibold text-blue-600">View</Link><Link href={`/vehicles/${vehicle.id}/edit`} className="font-semibold text-blue-600">Edit</Link></div></div>{menu === vehicle.id && <div className="relative mt-3"><ActionMenu vehicle={vehicle} onStatus={() => { setStatusVehicle(vehicle); setNextStatus(vehicle.status); }} onDeactivate={() => setDeactivateVehicle(vehicle)}/></div>}</div>)}</div>
      {!filtered.length && <div className="grid min-h-56 place-items-center p-8 text-center"><div><CarFront className="mx-auto text-slate-300"/><p className="mt-3 text-sm font-semibold">No vehicles match your filters.</p><button onClick={() => { setSearch(""); setStatus("ALL"); setType("ALL"); setFuel("ALL"); setService("ALL"); }} className="mt-2 text-xs font-semibold text-blue-600">Clear filters</button></div></div>}
      <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-500"><span>Showing {filtered.length} of {vehicles.length} vehicles</span><span className="flex items-center gap-1">Sort: Last updated <ChevronDown size={13}/></span></div>
    </Card>
    {statusVehicle && <Dialog title="Update vehicle status" onClose={() => setStatusVehicle(undefined)}><p className="text-sm text-slate-500">Choose the operational status for {statusVehicle.vehicleName}.</p><select value={nextStatus} onChange={event => setNextStatus(event.target.value as VehicleStatus)} className={`${selectClass} mt-4 w-full`}>{statuses.map(value => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select><div className="mt-5 flex justify-end gap-2"><button onClick={() => setStatusVehicle(undefined)} className="rounded-lg border px-4 py-2 text-xs font-semibold">Cancel</button><button disabled={pending} onClick={() => updateStatus(statusVehicle.id, nextStatus)} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white">Save status</button></div></Dialog>}
    {deactivateVehicle && <Dialog title="Deactivate this vehicle?" onClose={() => setDeactivateVehicle(undefined)}><p className="text-sm leading-6 text-slate-500">The vehicle will no longer be available for normal operations, but its history and records will be preserved.</p><div className="mt-5 flex justify-end gap-2"><button onClick={() => setDeactivateVehicle(undefined)} className="rounded-lg border px-4 py-2 text-xs font-semibold">Cancel</button><button disabled={pending} onClick={() => updateStatus(deactivateVehicle.id, "INACTIVE")} className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white">Deactivate</button></div></Dialog>}
  </>;
}

function Filter({ value, setValue, label, items }: { value: string; setValue: (value: string) => void; label: string; items: readonly string[] }) { return <select value={value} onChange={event => setValue(event.target.value)} className={selectClass}><option value="ALL">All {label.toLowerCase()}</option>{items.map(item => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select>; }
function VehicleIdentity({ vehicle }: { vehicle: VehicleListItem }) { return <Link href={`/vehicles/${vehicle.id}`} className="flex items-center gap-3">{vehicle.primaryPhotoUrl ? <span role="img" aria-label={vehicle.vehicleName} className="size-10 rounded-lg bg-cover bg-center" style={{ backgroundImage: `url(${vehicle.primaryPhotoUrl})` }}/> : <span className="grid size-10 place-items-center rounded-lg bg-slate-100 text-slate-500"><CarFront size={19}/></span>}<span><strong className="block text-sm text-slate-800">{vehicle.vehicleName}</strong><span className="mt-0.5 block text-[10px] text-slate-400">{vehicle.vehicleCode}</span></span></Link>; }
function SummaryBadge({ value }: { value: string }) { const color = value === "OVERDUE" || value === "EXPIRED" ? "text-red-700" : value === "DUE_SOON" || value === "ATTENTION" || value === "URGENT" ? "text-amber-700" : "text-emerald-700"; return <span className={`font-semibold ${color}`}>{value.replaceAll("_", " ")}</span>; }
function ActionMenu({ vehicle, onStatus, onDeactivate }: { vehicle: VehicleListItem; onStatus: () => void; onDeactivate: () => void }) { return <div className="absolute right-3 z-20 mt-1 w-40 rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg"><Link href={`/vehicles/${vehicle.id}`} className="block rounded-md px-3 py-2 text-xs hover:bg-slate-50">View</Link><Link href={`/vehicles/${vehicle.id}/edit`} className="block rounded-md px-3 py-2 text-xs hover:bg-slate-50">Edit</Link><button onClick={onStatus} className="block w-full rounded-md px-3 py-2 text-left text-xs hover:bg-slate-50">Update status</button><button onClick={onDeactivate} className="block w-full rounded-md px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50">Deactivate</button></div>; }
function Dialog({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) { return <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/40 p-4" onMouseDown={onClose}><div role="dialog" aria-modal="true" aria-labelledby="dialog-title" onMouseDown={event => event.stopPropagation()} className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"><h2 id="dialog-title" className="text-lg font-semibold">{title}</h2><div className="mt-3">{children}</div></div></div>; }
