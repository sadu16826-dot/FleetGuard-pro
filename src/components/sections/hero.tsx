"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Clock3, FileWarning, MapPin, Truck, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const stats = [
  { label: "Total vehicles", value: "128", note: "+6 this month", icon: Truck },
  { label: "Active trips", value: "42", note: "33% of fleet", icon: MapPin },
  { label: "Service alerts", value: "7", note: "3 due this week", icon: Wrench },
  { label: "Expiring docs", value: "4", note: "Next 30 days", icon: FileWarning },
];

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-[#f7f9fc] pt-32 pb-20 lg:pt-44 lg:pb-28">
      <div className="grid-fade absolute inset-0" />
      <div className="container-page relative grid items-center gap-16 lg:grid-cols-[.9fr_1.1fr]">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }}>
          <Badge><span className="mr-2 size-1.5 rounded-full bg-blue-600"/>Fleet operations, unified</Badge>
          <h1 className="mt-7 text-[clamp(2.9rem,6vw,4.8rem)] leading-[.98] font-bold tracking-[-.055em] text-slate-950">Complete Control Over Your Fleet Operations</h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600">Monitor vehicles, manage drivers, automate maintenance alerts and improve fleet safety with one intelligent platform.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row"><a href="#contact"><Button className="w-full gap-2 sm:w-auto">Request Demo <ArrowRight size={16}/></Button></a><a href="#features"><Button variant="secondary" className="w-full sm:w-auto">Explore Features</Button></a></div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500"><span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-blue-600"/>Built for every fleet size</span><span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-blue-600"/>Quick onboarding</span></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 24, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .7, delay: .15 }} className="relative">
          <div className="absolute -inset-5 rounded-[32px] bg-blue-100/60 blur-3xl"/>
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_28px_80px_-28px_rgba(15,23,42,.28)]">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><p className="text-sm font-semibold text-slate-900">Fleet overview</p><p className="mt-0.5 text-xs text-slate-500">Wednesday, 2 September</p></div><div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"><span className="size-1.5 rounded-full bg-emerald-500"/>Live</div></div>
            <div className="grid grid-cols-2 gap-px bg-slate-200 lg:grid-cols-4">{stats.map(({label,value,note,icon:Icon}) => <div key={label} className="bg-white p-4"><div className="flex items-center justify-between text-slate-500"><span className="text-[11px] font-medium">{label}</span><Icon size={15}/></div><p className="mt-3 text-2xl font-bold tracking-tight">{value}</p><p className="mt-1 text-[10px] text-slate-500">{note}</p></div>)}</div>
            <div className="grid gap-0 lg:grid-cols-[1.35fr_.65fr]">
              <div className="border-b border-slate-200 p-5 lg:border-r lg:border-b-0"><div className="mb-5 flex items-center justify-between"><p className="text-xs font-semibold">Vehicle status</p><span className="text-[10px] text-slate-400">Updated now</span></div><div className="flex h-28 items-end gap-2">{[62,82,51,91,76,86,68,95,80,88,72,92].map((h,i)=><div key={i} className="group flex-1 rounded-t-sm bg-blue-100"><div className="rounded-t-sm bg-blue-600 transition-all group-hover:bg-blue-700" style={{height:`${h}px`}}/></div>)}</div><div className="mt-3 flex justify-between text-[9px] text-slate-400"><span>06:00</span><span>10:00</span><span>14:00</span><span>18:00</span></div></div>
              <div className="p-5"><p className="mb-4 text-xs font-semibold">Upcoming service</p>{[["TRK-1048","Brake service","2 days"],["VAN-2031","Oil change","5 days"],["SUV-0084","Inspection","8 days"]].map(([id,task,time])=><div key={id} className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-0"><span className="grid size-8 shrink-0 place-items-center rounded-md bg-amber-50 text-amber-700"><Clock3 size={14}/></span><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-semibold">{id}</p><p className="truncate text-[10px] text-slate-500">{task}</p></div><span className="text-[9px] text-slate-400">{time}</span></div>)}</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
