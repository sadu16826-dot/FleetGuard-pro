import { CarFront, CheckCircle2, FileUp, Wrench } from "lucide-react";
import { Card } from "@/components/ui/card";

const activities = [
  { text: "Ahmed completed vehicle inspection", time: "12 minutes ago", icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-50" },
  { text: "CAR-005 service updated", time: "38 minutes ago", icon: Wrench, tone: "text-blue-600 bg-blue-50" },
  { text: "Insurance document uploaded", time: "1 hour ago", icon: FileUp, tone: "text-violet-600 bg-violet-50" },
  { text: "CAR-022 assigned to Priya", time: "2 hours ago", icon: CarFront, tone: "text-slate-600 bg-slate-100" },
];

export function ActivityList() {
  return <Card className="p-5"><h2 className="text-sm font-semibold">Recent activity</h2><p className="mt-1 text-xs text-slate-500">Latest updates across your fleet</p><div className="mt-5 space-y-5">{activities.map(({text,time,icon:Icon,tone})=><div key={text} className="flex gap-3"><span className={`grid size-8 shrink-0 place-items-center rounded-full ${tone}`}><Icon size={14}/></span><div><p className="text-xs leading-5 font-medium text-slate-700">{text}</p><p className="mt-0.5 text-[10px] text-slate-400">{time}</p></div></div>)}</div></Card>;
}
