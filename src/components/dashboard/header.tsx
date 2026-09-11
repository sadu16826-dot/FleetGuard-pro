"use client";

import { Bell, ChevronDown, HelpCircle, Menu, Search } from "lucide-react";
import { Dropdown } from "@/components/ui/dropdown";
import type { UserRole } from "@/generated/prisma";
import { roleLabel } from "@/lib/permissions";

type HeaderUser = { name: string; role: UserRole };

export function DashboardHeader({ onMenu, user }: { onMenu: () => void; user: HeaderUser }) {
  const initials = user.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <button onClick={onMenu} className="mr-3 grid size-9 place-items-center text-slate-600 lg:hidden" aria-label="Open navigation"><Menu size={20}/></button>
      <div className="relative hidden w-full max-w-sm sm:block"><Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"/><input className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pr-3 pl-9 text-xs outline-none focus:border-blue-400 focus:bg-white" placeholder="Search vehicles, drivers or trips…"/></div>
      <div className="ml-auto flex items-center gap-1">
        <button className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Help"><HelpCircle size={18}/></button>
        <button className="relative grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Notifications"><Bell size={18}/><span className="absolute top-2 right-2 size-1.5 rounded-full bg-red-500 ring-2 ring-white"/></button>
        <div className="mx-2 hidden h-6 w-px bg-slate-200 sm:block"/>
        <Dropdown trigger={<span className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-slate-50"><span className="grid size-8 place-items-center rounded-full bg-slate-900 text-[11px] font-bold text-white">{initials}</span><span className="hidden text-left sm:block"><span className="block text-xs font-semibold text-slate-800">{user.name}</span><span className="block text-[10px] text-slate-400">{roleLabel(user.role)}</span></span><ChevronDown size={13} className="hidden text-slate-400 sm:block"/></span>}>
          <form action="/api/auth/logout" method="post"><button className="w-full rounded-md px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100">Sign out</button></form>
        </Dropdown>
      </div>
    </header>
  );
}
