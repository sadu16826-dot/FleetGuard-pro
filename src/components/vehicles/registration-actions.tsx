"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Vehicle = { id: string; vehicleName: string; registrationNumber: string; status: string };

export function RegistrationActions({ vehicle }: { vehicle: Vehicle }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function deactivate() {
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/vehicles/${vehicle.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "INACTIVE" }) });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message ?? "Unable to deactivate registration.");
      setOpen(false); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to deactivate registration."); }
    finally { setLoading(false); }
  }
  return <><div className="flex flex-wrap items-center gap-2"><Link href={`/vehicles/${vehicle.id}`} className="font-semibold text-blue-600 hover:underline">View</Link><Link href={`/vehicles/${vehicle.id}/edit`} className="font-semibold text-blue-600 hover:underline">Edit</Link><Link href={`/vehicles/${vehicle.id}?tab=Documents`} className="font-semibold text-blue-600 hover:underline">Upload RC</Link>{vehicle.status !== "INACTIVE" && <button type="button" onClick={() => setOpen(true)} className="font-semibold text-red-600 hover:underline">Delete</button>}</div>{open && <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/40 p-4" onMouseDown={() => !loading && setOpen(false)}><div role="dialog" aria-modal="true" aria-labelledby="registration-dialog-title" className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onMouseDown={event => event.stopPropagation()}><h2 id="registration-dialog-title" className="text-lg font-semibold">Deactivate Vehicle Registration</h2><p className="mt-3 text-sm leading-6 text-slate-600">Are you sure you want to deactivate this vehicle registration?</p><p className="mt-2 text-sm leading-6 text-slate-500">The vehicle and all related historical records will be preserved.</p><div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs"><p className="font-semibold text-slate-800">{vehicle.vehicleName}</p><p className="mt-1 text-slate-500">{vehicle.registrationNumber}</p></div>{error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}<div className="mt-6 flex justify-end gap-2"><button type="button" disabled={loading} onClick={() => setOpen(false)} className="rounded-lg border px-4 py-2 text-xs font-semibold disabled:opacity-50">Cancel</button><button type="button" disabled={loading} onClick={deactivate} className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{loading ? "Deactivating…" : "Deactivate"}</button></div></div></div>}</>;
}
