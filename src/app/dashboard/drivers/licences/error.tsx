"use client";

import { Card } from "@/components/ui/card";

export default function LicenceError({ retry }: { retry: () => void }) {
  return (
    <Card className="p-6">
      <h1 className="text-xl font-semibold">Licence Management</h1>
      <p className="mt-2 text-sm text-slate-500">
        Unable to load licence records. Please try again.
      </p>
      <button type="button" onClick={() => retry()} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">
        Try again
      </button>
    </Card>
  );
}
