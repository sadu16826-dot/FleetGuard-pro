import Link from "next/link";
import { CarFront, FileCheck2, History, Plus, UserPlus } from "lucide-react";
import { Card } from "@/components/ui/card";

const actions = [
  { label: "Add vehicle", href: "/vehicles/new", icon: CarFront },
  { label: "Register driver", href: "/dashboard/drivers/new", icon: UserPlus },
  { label: "Vehicle documents", href: "/vehicles/documents", icon: FileCheck2 },
  { label: "Vehicle history", href: "/vehicles/history", icon: History },
];
export function QuickActions() {
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold">Quick actions</h2>
      <p className="mt-1 text-xs text-slate-500">Common fleet tasks</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
        {actions.map(({ label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="group flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-700"
          >
            <span className="grid size-8 place-items-center rounded-md bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-blue-600">
              <Icon size={15} />
            </span>
            {label}
            <Plus
              size={14}
              className="ml-auto text-slate-300 group-hover:text-blue-500"
            />
          </Link>
        ))}
      </div>
    </Card>
  );
}
