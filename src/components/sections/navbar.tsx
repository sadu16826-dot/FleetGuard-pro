"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  ["Features", "#features"], ["Solutions", "#solutions"], ["How It Works", "#how-it-works"],
  ["Security", "#security"], ["Pricing", "#contact"], ["Contact", "#contact"],
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => { const onScroll = () => setScrolled(window.scrollY > 24); onScroll(); window.addEventListener("scroll", onScroll); return () => window.removeEventListener("scroll", onScroll); }, []);
  return (
    <header className={cn("fixed inset-x-0 top-0 z-50 border-b border-transparent transition-all duration-300", scrolled && "border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-lg")}>
      <nav className="container-page flex h-[72px] items-center justify-between" aria-label="Main navigation">
        <a href="#top" className="flex items-center gap-2.5 font-bold tracking-tight text-slate-950"><span className="grid size-9 place-items-center rounded-lg bg-slate-950 text-white"><ShieldCheck size={20}/></span>FleetGuard <span className="text-blue-600">Pro</span></a>
        <div className="hidden items-center gap-7 lg:flex">{links.map(([label, href]) => <a key={label} href={href} className="text-sm font-medium text-slate-600 transition hover:text-slate-950">{label}</a>)}</div>
        <div className="hidden items-center gap-3 md:flex"><Link href="/login" className="px-3 text-sm font-semibold text-slate-700 transition hover:text-blue-600">Login</Link><a href="#contact"><Button>Request Demo</Button></a></div>
        <button className="grid size-10 place-items-center md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>{open ? <X/> : <Menu/>}</button>
      </nav>
      {open && <div className="border-t border-slate-200 bg-white px-5 py-5 shadow-lg md:hidden"><div className="flex flex-col gap-1">{links.map(([label, href]) => <a key={label} href={href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">{label}</a>)}<Link href="/login" onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Login</Link><a href="#contact" onClick={() => setOpen(false)}><Button className="mt-3 w-full">Request Demo</Button></a></div></div>}
    </header>
  );
}
