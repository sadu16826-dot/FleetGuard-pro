import Link from "next/link";
import { ArrowLeft, History } from "lucide-react";
import { authenticatedUser } from "@/lib/access-control";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function OperationsHistoryPage() {
  const user = await authenticatedUser();
  const activities = await db.vehicleActivity.findMany({
    where: { vehicle: { companyId: user.companyId! } },
    include: { vehicle: { select: { id: true, vehicleName: true, registrationNumber: true } }, user: { select: { name: true } } },
    orderBy: { createdAt: "desc" }, take: 100,
  });
  return <div className="mx-auto max-w-[1200px]"><Link href="/dashboard/trips" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500"><ArrowLeft size={14}/>Vehicle Operations</Link><div className="mt-5"><p className="text-xs font-medium text-slate-500">Vehicle Operations</p><h1 className="mt-1 text-2xl font-bold">Operations history</h1><p className="mt-1 text-sm text-slate-500">A database-backed timeline of fleet activity.</p></div><Card className="mt-6 overflow-hidden"><div className="border-b border-slate-100 p-4"><div className="flex items-center gap-2 text-sm font-semibold"><History size={17} className="text-blue-600"/>Recent operational events</div></div><div className="divide-y divide-slate-100">{activities.map(activity => <div key={activity.id} className="flex flex-wrap items-center gap-4 px-5 py-4 text-xs"><span className="grid size-8 place-items-center rounded-full bg-blue-50 text-blue-600"><History size={14}/></span><div className="min-w-[220px] flex-1"><p className="font-semibold text-slate-800">{activity.description}</p><p className="mt-1 text-slate-500">{activity.vehicle.vehicleName} · {activity.vehicle.registrationNumber}</p></div><span className="text-slate-500">{activity.user?.name ?? "System"}</span><time className="text-slate-400">{activity.createdAt.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</time></div>)}{!activities.length && <p className="p-10 text-center text-sm text-slate-500">No operational activity recorded yet.</p>}</div></Card></div>;
}
