"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableCell, TableHead } from "@/components/ui/table";
import { passportStatusClassName, passportStatusLabel, resolvePassportStatus } from "@/lib/passport";

type Driver = { id: string; name: string; employeeId: string | null; status: string };
type Passport = {
  id: string;
  driverId: string;
  passportNumber: string;
  passportHolderName: string | null;
  issuingCountry: string | null;
  placeOfIssue: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  status: string | null;
  fileUrl: string | null;
  fileName: string | null;
  createdAt: string;
  updatedAt: string;
  driver: { id: string; name: string; employeeId: string | null; status: string };
};

const fieldClass = "mt-1 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500";

export default function PassportManager({ initialPassports, drivers }:{ initialPassports: Passport[]; drivers: Driver[] }) {
  const [passports, setPassports] = useState(initialPassports);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const filteredPassports = useMemo(() => passports.filter((passport) => {
    const q = search.toLowerCase();
    const derived = resolvePassportStatus(passport);
    const matchesText = !q || `${passport.driver.name} ${passport.driver.employeeId ?? ""} ${passport.passportNumber}`.toLowerCase().includes(q);
    const matchesStatus = status === "ALL" || derived === status;
    return matchesText && matchesStatus;
  }), [passports, search, status]);

  const counts = useMemo(() => {
    const total = passports.length;
    const activeDriverIds = new Set(passports.map((passport) => passport.driverId));
    const valid = passports.filter((passport) => resolvePassportStatus(passport) === "VALID").length;
    const expiringSoon = passports.filter((passport) => resolvePassportStatus(passport) === "EXPIRING_SOON").length;
    const expired = passports.filter((passport) => resolvePassportStatus(passport) === "EXPIRED").length;
    const missing = drivers.filter((driver) => !activeDriverIds.has(driver.id)).length;
    return { total, valid, expiringSoon, expired, missing };
  }, [drivers, passports]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/passports", { method: "POST", body: form });
    const result = await response.json();

    if (!response.ok) {
      setError(result.message || "Unable to save passport record.");
      setSaving(false);
      return;
    }

    const next = result as Passport;
    setPassports((current) => [{ ...next, issueDate: next.issueDate ?? null, expiryDate: next.expiryDate ?? null, status: next.status ?? null }, ...current]);
    setOpen(false);
    setSaving(false);
    event.currentTarget.reset();
  }

  return (
    <div className="mx-auto max-w-[1500px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Passport Management</h1>
          <p className="mt-1 text-sm text-slate-500">Manage driver passports, validity, renewals and travel compliance.</p>
        </div>
        <Button type="button" onClick={() => setOpen(true)} className="inline-flex gap-2">
          <Plus size={16} /> Add Passport
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Total Passports", counts.total],
          ["Valid", counts.valid],
          ["Expiring Soon", counts.expiringSoon],
          ["Expired", counts.expired],
          ["Missing Passport", counts.missing],
        ].map(([label, value]) => (
          <Card key={label} className="p-5">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-[1fr_220px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-3 text-slate-400" size={15} />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search driver, employee ID or passport number"
              className="pl-9"
            />
          </label>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className={fieldClass}>
            <option value="ALL">All statuses</option>
            <option value="VALID">Valid</option>
            <option value="EXPIRING_SOON">Expiring soon</option>
            <option value="EXPIRED">Expired</option>
            <option value="MISSING">Missing</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <thead className="bg-slate-50">
              <tr>
                {['Driver','Employee ID','Passport Number','Passport Type','Nationality','Issue Date','Expiry Date','Status','Document','Actions'].map((heading) => (
                  <TableHead key={heading}>{heading}</TableHead>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPassports.map((passport) => {
                const statusValue = resolvePassportStatus(passport);
                return (
                  <tr key={passport.id} className="border-t border-slate-200">
                    <TableCell>
                      <Link href={`/dashboard/drivers/${passport.driverId}`} className="font-semibold text-blue-600">
                        {passport.driver.name}
                      </Link>
                    </TableCell>
                    <TableCell>{passport.driver.employeeId ?? "—"}</TableCell>
                    <TableCell>
                      <Link href={`/dashboard/drivers/passports/${passport.id}`} className="font-semibold text-slate-900 hover:text-blue-600">
                        {passport.passportNumber}
                      </Link>
                    </TableCell>
                    <TableCell>ORDINARY</TableCell>
                    <TableCell>{passport.issuingCountry ?? "—"}</TableCell>
                    <TableCell>{passport.issueDate ? new Date(passport.issueDate).toLocaleDateString("en-GB") : "—"}</TableCell>
                    <TableCell>{passport.expiryDate ? new Date(passport.expiryDate).toLocaleDateString("en-GB") : "—"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${passportStatusClassName(statusValue)}`}>
                        {passportStatusLabel(statusValue)}
                      </span>
                    </TableCell>
                    <TableCell>{passport.fileName ? "Available" : "Missing"}</TableCell>
                    <TableCell>
                      <Link href={`/dashboard/drivers/passports/${passport.id}`} className="font-semibold text-blue-600">View</Link>
                    </TableCell>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>

        {!filteredPassports.length && (
          <div className="p-8 text-center text-sm text-slate-500">No passport records found.</div>
        )}
      </Card>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold">Add Passport</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close passport form" className="rounded-md p-1 text-slate-500 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Driver information</h3>
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  <label className="block text-xs font-medium text-slate-700 md:col-span-2">
                    Driver *
                    <select name="driverId" required className={fieldClass}>
                      <option value="">Select Driver</option>
                      {drivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>{driver.name} · {driver.employeeId ?? "No employee ID"} · {driver.status}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs font-medium text-slate-700">
                    Passport holder name
                    <Input name="passportHolderName" />
                  </label>
                  <label className="block text-xs font-medium text-slate-700">
                    Nationality
                    <Input name="issuingCountry" placeholder="India" />
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-800">Passport information</h3>
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  <label className="block text-xs font-medium text-slate-700 md:col-span-2">
                    Passport number *
                    <Input name="passportNumber" required />
                  </label>
                  <label className="block text-xs font-medium text-slate-700">
                    Passport type
                    <select name="passportType" defaultValue="ORDINARY" className={fieldClass}>
                      <option value="ORDINARY">Ordinary</option>
                      <option value="OFFICIAL">Official</option>
                      <option value="DIPLOMATIC">Diplomatic</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </label>
                  <label className="block text-xs font-medium text-slate-700">
                    Date of birth
                    <Input name="dateOfBirth" type="date" />
                  </label>
                  <label className="block text-xs font-medium text-slate-700">
                    Issue date *
                    <Input name="issueDate" type="date" required />
                  </label>
                  <label className="block text-xs font-medium text-slate-700">
                    Expiry date *
                    <Input name="expiryDate" type="date" required />
                  </label>
                  <label className="block text-xs font-medium text-slate-700">
                    Place of issue
                    <Input name="placeOfIssue" />
                  </label>
                  <label className="block text-xs font-medium text-slate-700">
                    Issuing authority
                    <Input name="issuingAuthority" />
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-800">Document</h3>
                <div className="mt-3">
                  <label className="block text-xs font-medium text-slate-700">
                    Passport document
                    <Input name="document" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="mt-1 cursor-pointer" />
                  </label>
                </div>
              </div>

              {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setOpen(false)} className="inline-flex h-11 items-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700">Cancel</button>
                <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save Passport"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
