import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "light";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-lg px-5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" && "bg-blue-600 text-white shadow-sm hover:bg-blue-700 hover:-translate-y-px",
        variant === "secondary" && "border border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50",
        variant === "light" && "bg-white text-slate-950 hover:bg-slate-100",
        className,
      )}
      {...props}
    />
  );
}
