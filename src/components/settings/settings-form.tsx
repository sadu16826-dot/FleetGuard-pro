"use client";

import { useState } from "react";
import { Check, Save, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Company = { id: string; name: string; address: string | null; phone: string | null };

export function SettingsForm({ initialCompany }: { initialCompany: Company }) {
  const [company, setCompany] = useState(initialCompany);
  const [form, setForm] = useState({ name: company.name, address: company.address ?? "", phone: company.phone ?? "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true); setMessage(""); setError("");
    try {
      const response = await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? "Unable to save settings.");
      setCompany(data.company); setForm({ name: data.company.name, address: data.company.address ?? "", phone: data.company.phone ?? "" });
      setMessage("Company settings saved.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save settings."); }
    finally { setSaving(false); }
  }

  return <div className="space-y-5">
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,.04)]">
      <div className="flex items-start gap-3"><span className="grid size-10 place-items-center rounded-lg bg-blue-50 text-blue-600"><Settings2 size={19}/></span><div><h2 className="font-bold text-slate-900">General settings</h2><p className="mt-1 text-sm text-slate-500">Update the company profile used throughout FleetGuard Pro.</p></div></div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-semibold text-slate-700">Company name<Input className="mt-2" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/></label>
        <label className="text-sm font-semibold text-slate-700">Phone<Input className="mt-2" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}/></label>
        <label className="text-sm font-semibold text-slate-700 md:col-span-2">Address<Input className="mt-2" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}/></label>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3"><span aria-live="polite" className="text-sm text-rose-600">{error}</span><div className="flex items-center gap-3"><span aria-live="polite" className="text-sm text-emerald-600">{message}</span><Button type="button" onClick={save} disabled={saving}>{saving ? "Saving…" : <><Save size={16}/>Save changes</>}</Button></div></div>
    </section>
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {[
        ["Fleet", "Vehicle status, types and fuel types are governed by the existing Vehicle model enums."],
        ["Inspection", "Daily inspections and checklist results remain in Inspection Management."],
        ["Maintenance", "Maintenance priorities and statuses remain attached to maintenance records."],
        ["Tyre & Wheel", "Tyre condition and status values use the existing tyre data model."],
        ["Documents & compliance", "Document types and expiry dates remain managed by vehicle documents."],
        ["Notifications", "In-app notifications use the existing notification records and access rules."],
      ].map(([title, description]) => <div key={title} className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2 text-sm font-bold text-slate-900"><Check size={16} className="text-emerald-600"/>{title}</div><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p><span className="mt-3 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">Existing system values</span></div>)}
    </section>
  </div>;
}
