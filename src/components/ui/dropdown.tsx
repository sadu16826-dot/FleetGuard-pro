"use client";

import { useEffect, useRef, useState } from "react";

export function Dropdown({ trigger, children }: { trigger: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const close = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); }; document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close); }, []);
  return <div className="relative" ref={ref}><button onClick={() => setOpen(!open)} aria-expanded={open}>{trigger}</button>{open && <div className="absolute right-0 top-full z-50 mt-2 min-w-48 rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg">{children}</div>}</div>;
}
