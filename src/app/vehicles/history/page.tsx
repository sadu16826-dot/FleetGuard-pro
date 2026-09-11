import Link from "next/link";
import { Card } from "@/components/ui/card";
import { authenticatedUser } from "@/lib/access-control";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
export default async function History() {
  const user = await authenticatedUser();
  const events = await db.vehicleActivity.findMany({ where: { vehicle: { companyId: user.companyId! } }, include: { vehicle: { select: { registrationNumber: true } }, user: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 100 });
  return <div className="mx-auto max-w-4xl"><h1 className="text-2xl font-bold">Vehicle history</h1><p className="mt-1 text-sm text-slate-500">Recent fleet activity.</p><Card className="mt-6 space-y-5 p-6">{events.map(event => <div key={event.id}><p className="text-xs text-slate-400">{event.createdAt.toLocaleString("en-GB")}</p><p className="mt-1 text-sm font-semibold">{event.description}</p><p className="mt-1 text-xs text-slate-500"><Link href={`/vehicles/${event.vehicleId}?tab=History`}>{event.vehicle.registrationNumber}</Link> · {event.user?.name ?? "System"}</p></div>)}{!events.length && <p className="text-sm text-slate-500">No vehicle activity recorded yet.</p>}</Card></div>;
}
