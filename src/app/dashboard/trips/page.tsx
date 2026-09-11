import Link from "next/link";
import { Activity, CarFront, Clock3, Route, Search, Truck } from "lucide-react";
import { authenticatedUser } from "@/lib/access-control";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";

export const dynamic = "force-dynamic";

const label = (value: string) => value.replaceAll("_", " ");
const dateTime = (value: Date | null) => value?.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) ?? "—";

export default async function OperationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await authenticatedUser();
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search.trim() : "";
  const status = typeof params.status === "string" ? params.status : "ALL";
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const pageSize = 12;
  const now = new Date();
  const where = {
    vehicle: { companyId: user.companyId! },
    ...(status !== "ALL" ? { status: status as "PLANNED" | "ACTIVE" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "ABORTED" } : {}),
    ...(search ? { OR: [
      { id: { contains: search, mode: "insensitive" as const } },
      { destination: { contains: search, mode: "insensitive" as const } },
      { vehicle: { companyId: user.companyId!, OR: [{ vehicleName: { contains: search, mode: "insensitive" as const } }, { registrationNumber: { contains: search, mode: "insensitive" as const } }] } },
      { driver: { name: { contains: search, mode: "insensitive" as const } } },
    ] } : {}),
  };
  const [vehicles, activeTrips, todayTrips, overdue, total, trips] = await Promise.all([
    db.vehicle.findMany({ where: { companyId: user.companyId! }, select: { status: true } }),
    db.trip.count({ where: { vehicle: { companyId: user.companyId! }, status: { in: ["ACTIVE", "IN_PROGRESS"] } } }),
    db.trip.count({ where: { vehicle: { companyId: user.companyId! }, tripDate: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()), lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) } } }),
    db.trip.count({ where: { vehicle: { companyId: user.companyId! }, status: { in: ["ACTIVE", "IN_PROGRESS"] }, expectedReturnTime: { lt: now } } }),
    db.trip.count({ where }),
    db.trip.findMany({ where, include: { vehicle: { select: { id: true, vehicleName: true, registrationNumber: true } }, driver: { select: { id: true, name: true } } }, orderBy: { startTime: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
  ]);
  const count = (value: string) => vehicles.filter((vehicle) => vehicle.status === value).length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return <div className="mx-auto max-w-[1500px]">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-medium text-slate-500">Vehicle Operations</p><h1 className="mt-1 text-2xl font-bold tracking-tight">Operations control center</h1><p className="mt-1 text-sm text-slate-500">Monitor allocation, active trips and vehicle returns.</p></div><div className="flex gap-2"><Link href="/dashboard/trips" className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white">All trips</Link><Link href="/dashboard/trips/history" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700">Operations history</Link></div></div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><StatCard label="Total vehicles" value={String(vehicles.length)} detail="Company fleet" icon={CarFront}/><StatCard label="Available" value={String(count("AVAILABLE"))} detail="Ready for allocation" icon={Truck} tone="green"/><StatCard label="In use" value={String(count("IN_USE"))} detail="Currently checked out" icon={Route} tone="violet"/><StatCard label="Active trips" value={String(activeTrips)} detail={`${todayTrips} trips today`} icon={Activity}/><StatCard label="Overdue returns" value={String(overdue)} detail="Needs attention" icon={Clock3} tone="amber"/></div>
    <Card className="mt-6 overflow-hidden"><form className="flex flex-wrap gap-3 border-b border-slate-100 p-4"><div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3"><Search size={15} className="text-slate-400"/><input name="search" defaultValue={search} placeholder="Search trip, vehicle, registration, driver or destination" className="w-full py-2 text-xs outline-none"/></div><select name="status" defaultValue={status} className="rounded-lg border border-slate-200 px-3 py-2 text-xs"><option value="ALL">All statuses</option>{["PLANNED","ACTIVE","IN_PROGRESS","COMPLETED","CANCELLED","ABORTED"].map(item => <option key={item} value={item}>{label(item)}</option>)}</select><button className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white">Filter</button></form><div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-slate-50"><tr>{["Trip","Vehicle","Driver","Route","Started","Expected return","Distance","Status","Action"].map(item => <th key={item} className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-slate-600">{item}</th>)}</tr></thead><tbody>{trips.map(trip => <tr key={trip.id} className="border-t border-slate-100 text-xs"><td className="px-4 py-4 font-semibold">{trip.id.slice(-8).toUpperCase()}</td><td className="px-4 py-4"><Link className="font-semibold text-blue-600" href={`/vehicles/${trip.vehicle.id}`}>{trip.vehicle.vehicleName}</Link><br/><span className="text-slate-500">{trip.vehicle.registrationNumber}</span></td><td className="px-4 py-4">{trip.driver.name}</td><td className="px-4 py-4">{trip.startLocation ?? "—"} → {trip.destination}</td><td className="whitespace-nowrap px-4 py-4">{dateTime(trip.startTime)}</td><td className="whitespace-nowrap px-4 py-4">{dateTime(trip.expectedReturnTime)}</td><td className="px-4 py-4">{trip.startKm != null && trip.endKm != null ? `${(trip.endKm - trip.startKm).toLocaleString()} KM` : "—"}</td><td className="px-4 py-4"><span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">{label(trip.status)}</span></td><td className="px-4 py-4"><Link className="font-semibold text-blue-600" href={`/vehicles/${trip.vehicle.id}/trips/${trip.id}`}>View</Link></td></tr>)}</tbody></table>{!trips.length && <p className="p-10 text-center text-sm text-slate-500">No trips match the current filters.</p>}</div><div className="flex items-center justify-between border-t border-slate-100 p-4 text-xs text-slate-500"><span>{total} trip records</span><div className="flex gap-2">{page > 1 && <Link className="rounded border px-3 py-1.5" href={`/dashboard/trips?search=${encodeURIComponent(search)}&status=${status}&page=${page - 1}`}>Previous</Link>}{page < pages && <Link className="rounded border px-3 py-1.5" href={`/dashboard/trips?search=${encodeURIComponent(search)}&status=${status}&page=${page + 1}`}>Next</Link>}</div></div></Card>
  </div>;
}
