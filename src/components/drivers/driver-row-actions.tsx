"use client";

import { LoaderCircle, Pencil, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Driver = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  licenseNumber: string;
  licenseExpiry: Date;
  status: "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "SUSPENDED" | "TERMINATED";
};

const statuses: Array<Driver["status"]> = ["ACTIVE", "INACTIVE", "ON_LEAVE", "SUSPENDED", "TERMINATED"];
const label = (status: Driver["status"]) => status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const dateValue = (date: Date) => new Date(date).toISOString().slice(0, 10);

export function DriverRowActions({ driver }: { driver: Driver }) {
  const router = useRouter();
  const [mode, setMode] = useState<"edit" | "delete" | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function edit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await fetch(`/api/drivers/${driver.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await response.json() as { message?: string };
      if (!response.ok) {
        setError(result.message || "Unable to update driver details.");
        return;
      }
      setMode(null);
      router.refresh();
    } catch {
      setError("Unable to connect to the driver service.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/drivers/${driver.id}`, { method: "DELETE" });
      const result = await response.json() as { message?: string };
      if (!response.ok) {
        setError(result.message || "Unable to delete driver.");
        return;
      }
      setMode(null);
      router.refresh();
    } catch {
      setError("Unable to connect to the driver service.");
    } finally {
      setSaving(false);
    }
  }

  return <>
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => { setError(""); setMode("edit"); }} className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Pencil size={13} /> Edit</button>
      <button type="button" onClick={() => { setError(""); setMode("delete"); }} className="inline-flex h-8 items-center gap-1 rounded-md border border-red-200 px-2 text-xs font-semibold text-red-700 hover:bg-red-50"><Trash2 size={13} /> Delete</button>
    </div>
    {mode && <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-bold">{mode === "edit" ? "Edit driver" : "Delete driver"}</h2><p className="mt-1 text-sm text-slate-500">{mode === "edit" ? "Update the driver profile and licence details." : `Remove ${driver.name} from active driver records? Historical driver data will be kept and the driver will be made inactive.`}</p></div><button type="button" onClick={() => setMode(null)} aria-label="Close dialog" className="text-slate-500 hover:text-slate-800"><X size={20} /></button></div>
        {mode === "edit" ? <form onSubmit={edit} className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Driver name" name="name" defaultValue={driver.name} required className="sm:col-span-2" />
          <Field label="Phone" name="phone" defaultValue={driver.phone} required />
          <Field label="Email" name="email" type="email" defaultValue={driver.email || ""} />
          <Field label="License number" name="licenseNumber" defaultValue={driver.licenseNumber} required />
          <Field label="License expiry" name="licenseExpiry" type="date" defaultValue={dateValue(driver.licenseExpiry)} required />
          <label className="grid gap-1.5 text-xs font-medium text-slate-700">Status<select name="status" defaultValue={driver.status} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm">{statuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}</select></label>
          {error && <p className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <div className="flex justify-end gap-3 sm:col-span-2"><button type="button" onClick={() => setMode(null)} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700">Cancel</button><button disabled={saving} className="inline-flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white disabled:opacity-60">{saving && <LoaderCircle size={15} className="mr-2 animate-spin" />}{saving ? "Saving…" : "Save changes"}</button></div>
        </form> : <div className="mt-5"><p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">This action cannot be undone for drivers without related records.</p>{error && <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}<div className="mt-5 flex justify-end gap-3"><button type="button" onClick={() => setMode(null)} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700">Cancel</button><button type="button" onClick={remove} disabled={saving} className="inline-flex h-10 items-center rounded-lg bg-red-600 px-4 text-sm font-semibold text-white disabled:opacity-60">{saving && <LoaderCircle size={15} className="mr-2 animate-spin" />}{saving ? "Deleting…" : "Delete driver"}</button></div></div>}
      </div>
    </div>}
  </>;
}

function Field({ label, className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label className={`grid gap-1.5 text-xs font-medium text-slate-700 ${className}`}>{label}<input {...props} className="h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-blue-500" /></label>;
}
