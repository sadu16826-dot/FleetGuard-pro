"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("Dashboard error boundary", error);

  return (
    <main className="mx-auto flex min-h-[50vh] max-w-xl items-center justify-center px-6">
      <section className="w-full rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <h1 className="text-lg font-semibold text-red-950">
          Dashboard temporarily unavailable
        </h1>
        <p className="mt-2 text-sm text-red-800">
          We could not load the latest fleet records. Please try again in a
          moment.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-5 rounded-lg bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
