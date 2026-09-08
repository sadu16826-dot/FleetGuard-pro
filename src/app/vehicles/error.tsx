"use client";

export default function VehiclesError({ reset }: { error: Error; reset: () => void }) {
  return <div className="mx-auto grid min-h-[420px] max-w-[1500px] place-items-center rounded-xl border border-slate-200 bg-white p-8 text-center"><div><h1 className="text-lg font-semibold">Vehicles could not be loaded.</h1><p className="mt-2 text-sm text-slate-500">Check the database connection and try again.</p><button onClick={reset} className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Try again</button></div></div>;
}
