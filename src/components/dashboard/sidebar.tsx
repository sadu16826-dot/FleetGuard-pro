"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ShieldCheck, X } from "lucide-react";
import { dashboardNavigation } from "./navigation";
import { cn } from "@/lib/utils";

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<string[]>(() => dashboardNavigation.filter(item => item.children && pathname.startsWith(item.href)).map(item => item.label));
  const toggle = (label: string) => setExpanded(current => current.includes(label) ? current.filter(x => x !== label) : [...current, label]);
  return <>
    {open && <button aria-label="Close navigation" className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden" onClick={onClose}/>} 
    <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-[276px] flex-col bg-[#0b1220] text-slate-300 transition-transform duration-200 lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5"><Link href="/dashboard" className="flex items-center gap-2.5 font-bold text-white"><span className="grid size-8 place-items-center rounded-lg bg-blue-600"><ShieldCheck size={18}/></span>FleetGuard <span className="text-blue-400">Pro</span></Link><button className="grid size-9 place-items-center lg:hidden" onClick={onClose} aria-label="Close sidebar"><X size={19}/></button></div>
      <div className="border-b border-white/10 px-5 py-4"><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-slate-500">Workspace</p><div className="mt-2 flex items-center gap-3"><span className="grid size-8 place-items-center rounded-md bg-white/10 text-xs font-bold text-white">FG</span><div><p className="text-xs font-semibold text-white">FleetGuard Operations</p><p className="mt-0.5 text-[10px] text-slate-500">Main workspace</p></div></div></div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:thin] [scrollbar-color:#334155_transparent]">{dashboardNavigation.map(item => { const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href); const isOpen = expanded.includes(item.label); const Icon=item.icon; return <div key={item.label} className="mb-1"><div className={cn("flex items-center rounded-lg transition", active ? "bg-blue-600/15 text-white" : "hover:bg-white/5 hover:text-white")}><Link href={item.href} onClick={onClose} className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-[13px] font-medium"><Icon size={17} className={active ? "text-blue-400" : "text-slate-500"}/><span className="truncate">{item.label}</span></Link>{item.children && <button onClick={() => toggle(item.label)} className="mr-1 grid size-8 place-items-center" aria-label={`Toggle ${item.label}`}><ChevronDown size={14} className={cn("transition", isOpen && "rotate-180")}/></button>}</div>{item.children && isOpen && <div className="ml-8 border-l border-slate-700 py-1 pl-3">{item.children.map(child => <Link onClick={onClose} key={child.href} href={child.href} className={cn("block rounded-md px-3 py-2 text-xs transition hover:bg-white/5 hover:text-white", pathname === child.href ? "bg-white/5 font-medium text-blue-300" : "text-slate-500")}>{child.label}</Link>)}</div>}</div>})}</nav>
      <div className="border-t border-white/10 p-4"><div className="flex items-center gap-3 rounded-lg p-2"><span className="grid size-9 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white">SA</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-white">Sadu Admin</p><p className="text-[10px] text-slate-500">Administrator</p></div></div></div>
    </aside>
  </>;
}
