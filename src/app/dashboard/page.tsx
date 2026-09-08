import { CalendarDays, CarFront, CheckCircle2, Clock3, FileWarning, Route, Wrench } from "lucide-react";
import { ActivityList } from "@/components/dashboard/activity-list";
import { AlertTable } from "@/components/dashboard/alert-table";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { StatCard } from "@/components/dashboard/stat-card";
import { TripTable } from "@/components/dashboard/trip-table";
import { Card } from "@/components/ui/card";

const statuses=[{label:"Available",value:86,total:128,color:"bg-emerald-500"},{label:"In use",value:32,total:128,color:"bg-blue-600"},{label:"Service",value:5,total:128,color:"bg-amber-500"},{label:"Repair",value:2,total:128,color:"bg-red-500"},{label:"Inspection required",value:3,total:128,color:"bg-violet-500"}];

export default function DashboardPage() {
  return <div className="mx-auto max-w-[1500px]"><div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-medium text-slate-500">Operations overview</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Good morning, Sadu</h1><p className="mt-1 text-sm text-slate-500">Here’s what is happening across your fleet today.</p></div><div className="flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600"><CalendarDays size={15}/><span>2 September 2026</span></div></div>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><StatCard label="Total vehicles" value="128" detail="5 added this month" icon={CarFront}/><StatCard label="Available vehicles" value="86" detail="67.2% fleet availability" icon={CheckCircle2} tone="green"/><StatCard label="Active trips" value="32" detail="8 completing today" icon={Route} tone="violet"/><StatCard label="Maintenance alerts" value="7" detail="Requires attention" trend="down" icon={Wrench} tone="amber"/><StatCard label="Expiring documents" value="5" detail="Within the next 30 days" trend="down" icon={FileWarning}/></section>
    <section className="mt-5"><Card className="p-5 sm:p-6"><div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center"><div><h2 className="text-sm font-semibold">Vehicle status overview</h2><p className="mt-1 text-xs text-slate-500">Current distribution across 128 vehicles</p></div><span className="flex items-center gap-1.5 text-[11px] text-slate-400"><Clock3 size={12}/>Updated 2 minutes ago</span></div><div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">{statuses.map(s=><div key={s.label}><div className="flex items-end justify-between"><p className="text-xs font-medium text-slate-600">{s.label}</p><p className="text-lg font-bold">{s.value}</p></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${s.color}`} style={{width:`${Math.max((s.value/s.total)*100,7)}%`}}/></div><p className="mt-2 text-[10px] text-slate-400">{Math.round((s.value/s.total)*100)}% of fleet</p></div>)}</div></Card></section>
    <section className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_.8fr]"><AlertTable/><ActivityList/></section>
    <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_300px]"><TripTable/><QuickActions/></section>
  </div>;
}
