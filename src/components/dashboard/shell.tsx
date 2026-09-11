"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { DashboardHeader } from "./header";
import type { UserRole } from "@/generated/prisma";

export function DashboardShell({ children, user }: { children: React.ReactNode; user: { name: string; role: UserRole } }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return <div className="min-h-screen bg-slate-50"><Sidebar user={user} open={sidebarOpen} onClose={() => setSidebarOpen(false)}/><div className="lg:pl-[276px]"><DashboardHeader user={user} onMenu={() => setSidebarOpen(true)}/><main className="p-4 sm:p-6 xl:p-8">{children}</main></div></div>;
}
