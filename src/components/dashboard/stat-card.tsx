import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

export function StatCard({ label, value, detail, trend = "up", icon: Icon, tone = "blue" }: { label: string; value: string; detail: string; trend?: "up" | "down"; icon: LucideIcon; tone?: "blue" | "green" | "amber" | "violet" }) {
  const colors = { blue: "bg-blue-50 text-blue-600", green: "bg-emerald-50 text-emerald-600", amber: "bg-amber-50 text-amber-600", violet: "bg-violet-50 text-violet-600" };
  return <Card className="p-5"><div className="flex items-start justify-between"><div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{value}</p></div><span className={`grid size-10 place-items-center rounded-lg ${colors[tone]}`}><Icon size={19}/></span></div><div className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-500">{trend === "up" ? <ArrowUpRight size={13} className="text-emerald-600"/> : <ArrowDownRight size={13} className="text-blue-600"/>}<span>{detail}</span></div></Card>;
}
