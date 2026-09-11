"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function NewDriverPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());

    try {
      const response = await fetch("/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json() as { message?: string };
      if (!response.ok) {
        setError(result.message || "Unable to save driver details.");
        return;
      }

      router.push("/dashboard/drivers");
      router.refresh();
    } catch {
      setError("Unable to connect to the driver service.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/dashboard/drivers" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
        <ArrowLeft size={14} /> Drivers
      </Link>

      <div className="mt-6 mb-5">
        <h1 className="text-2xl font-bold">Register driver</h1>
        <p className="mt-1 text-sm text-slate-500">Add a driver profile with their licence details and operational status.</p>
      </div>

      <Card className="p-6">
        <form onSubmit={onSubmit} className="grid gap-5 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-medium text-slate-700" htmlFor="name">Driver name</label>
            <Input id="name" name="name" required />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700" htmlFor="phone">Phone</label>
            <Input id="phone" name="phone" required />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700" htmlFor="email">Email</label>
            <Input id="email" name="email" type="email" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700" htmlFor="licenseNumber">License number</label>
            <Input id="licenseNumber" name="licenseNumber" required />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700" htmlFor="licenseExpiry">License expiry</label>
            <Input id="licenseExpiry" name="licenseExpiry" type="date" required />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700" htmlFor="status">Status</label>
            <select id="status" name="status" defaultValue="ACTIVE" className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500">
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="TERMINATED">Terminated</option>
            </select>
          </div>

          {error && <div className="md:col-span-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          <div className="md:col-span-2 flex justify-end gap-3">
            <Link href="/dashboard/drivers" className="inline-flex h-11 items-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</Link>
            <Button type="submit" disabled={saving}>
              {saving && <LoaderCircle size={16} className="mr-2 animate-spin" />}
              {saving ? "Saving driver…" : "Save driver"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
