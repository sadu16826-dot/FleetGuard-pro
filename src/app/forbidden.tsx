import Link from "next/link";
import { ShieldX } from "lucide-react";

export default function Forbidden() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-red-50 text-red-600">
          <ShieldX size={22} />
        </span>
        <h1 className="mt-5 text-xl font-bold text-slate-950">Access denied</h1>
        <p className="mt-2 text-sm text-slate-600">
          You do not have permission to open User Management.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Return to dashboard
        </Link>
      </section>
    </main>
  );
}
