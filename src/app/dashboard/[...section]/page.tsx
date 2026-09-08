import Link from "next/link";
import { ArrowLeft, Construction } from "lucide-react";
import { Card } from "@/components/ui/card";

export default async function ModulePage({ params }: { params: Promise<{ section: string[] }> }) {
  const { section } = await params;
  const title = section.at(-1)?.split("-").map(word => word[0]?.toUpperCase() + word.slice(1)).join(" ") ?? "Module";
  return <div className="mx-auto max-w-[1500px]"><Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600"><ArrowLeft size={14}/>Dashboard</Link><Card className="mt-5 grid min-h-[420px] place-items-center p-8 text-center"><div><span className="mx-auto grid size-12 place-items-center rounded-xl bg-blue-50 text-blue-600"><Construction size={23}/></span><p className="mt-5 text-xs font-bold uppercase tracking-wider text-blue-600">Module prepared</p><h1 className="mt-2 text-2xl font-bold tracking-tight">{title}</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">This application route is ready for its Phase 3 workflow, API integration and database-backed records.</p></div></Card></div>;
}
