import { cn } from "@/lib/utils";

export function Table({ className, ...props }: React.ComponentProps<"table">) { return <table className={cn("w-full text-left text-sm", className)} {...props}/>; }
export function TableHead({ className, ...props }: React.ComponentProps<"th">) { return <th className={cn("px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500", className)} {...props}/>; }
export function TableCell({ className, ...props }: React.ComponentProps<"td">) { return <td className={cn("px-5 py-4", className)} {...props}/>; }
