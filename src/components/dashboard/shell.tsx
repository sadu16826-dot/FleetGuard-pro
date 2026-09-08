"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { DashboardHeader } from "./header";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return <div className="min-h-screen bg-slate-50"><Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)}/><div className="lg:pl-[276px]"><DashboardHeader onMenu={() => setSidebarOpen(true)}/><main className="p-4 sm:p-6 xl:p-8">{children}</main></div></div>;
}
