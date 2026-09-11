import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SettingsForm } from "@/components/settings/settings-form";
import { authenticatedUser } from "@/lib/access-control";
import { db } from "@/lib/db";

export default async function SettingsPage() {
  const user = await authenticatedUser();
  const company = await db.company.findUnique({ where: { id: user.companyId! }, select: { id: true, name: true, address: true, phone: true } });
  if (!company) return <Card className="p-8 text-sm text-slate-600">Company settings are unavailable.</Card>;
  return <div className="mx-auto max-w-[1500px]">
    <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600"><ArrowLeft size={14}/>Dashboard</Link>
    <div className="mt-5 flex flex-col justify-between gap-3 md:flex-row md:items-end"><div><p className="text-xs font-bold uppercase tracking-wider text-blue-600">Administration</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Settings</h1><p className="mt-2 text-sm text-slate-500">Manage FleetGuard Pro configuration without duplicating operational data.</p></div><div className="flex items-center gap-2 text-xs font-semibold text-slate-500"><ShieldCheck size={16} className="text-emerald-600"/>Company-scoped</div></div>
    <div className="mt-6"><SettingsForm initialCompany={company}/></div>
  </div>;
}
