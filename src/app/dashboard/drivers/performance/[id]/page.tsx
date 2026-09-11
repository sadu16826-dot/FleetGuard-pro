import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Gauge, Shield, TrendingUp, Truck, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { authenticatedUser } from "@/lib/access-control";
import { getDriverPerformanceDetail, performanceLevelClassName, performanceLevelLabel } from "@/lib/driver-performance";
import { documentExpiryStatus } from "@/lib/driver-utils";
import { resolvePassportStatus } from "@/lib/passport";

export const dynamic = "force-dynamic";

export default async function DriverPerformanceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await authenticatedUser();
  const detail = await getDriverPerformanceDetail({ companyId: user.companyId!, driverId: id, range: "30d" });

  if (!detail?.summary) notFound();

  const summary = detail.summary;
  const vehicle = detail.driver.currentVehicles[0] ?? detail.driver.assignments[0]?.vehicle ?? null;
  const licence = detail.driver.licences[0] ?? null;
  const passport = detail.driver.passport ?? null;
  const performanceMetrics = [
    { label: "Overall Performance", value: `${Math.round(summary.performanceScore)}%`, note: performanceLevelLabel(summary.performanceLevel) },
    { label: "Safety", value: `${Math.round(summary.safetyScore)}%`, note: "Accident and care rating" },
    { label: "Trip Reliability", value: `${Math.round(summary.tripCompletionRate)}%`, note: "Completed trips" },
    { label: "Timeliness", value: summary.onTimeRate === null ? "N/A" : `${Math.round(summary.onTimeRate)}%`, note: summary.onTimeRate === null ? "Insufficient timing data" : "On-time return rate" },
    { label: "Fuel Efficiency", value: summary.fuelEfficiencyScore === null ? "N/A" : `${Math.round(summary.fuelEfficiencyScore)}%`, note: summary.fuelEfficiencyValue === null ? "No fuel data" : `${summary.fuelEfficiencyValue.toFixed(1)} km/l` },
    { label: "Vehicle Care", value: `${Math.round(summary.vehicleCareScore)}%`, note: "Inspection and return checks" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link href="/dashboard/drivers/performance" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600">
        <ArrowLeft size={14} /> Driver performance
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Driver Performance</h1>
          <p className="mt-1 text-sm text-slate-500">Review the current performance profile for this driver.</p>
        </div>
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${performanceLevelClassName(summary.performanceLevel)}`}>
          {performanceLevelLabel(summary.performanceLevel)}
        </span>
      </div>

      <Card className="p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Driver profile</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">{detail.driver.name}</h2>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-600">
              <span>Employee ID: {detail.driver.employeeId ?? "—"}</span>
              <span>Status: {detail.driver.status}</span>
              <span>Assigned vehicle: {vehicle ? `${vehicle.vehicleCode} · ${vehicle.vehicleName}` : "Unassigned"}</span>
            </div>
          </div>
          <div className="grid gap-3 text-sm text-slate-600 md:text-right">
            <div>Licence: {licence ? documentExpiryStatus(licence.expiryDate) : "MISSING"}</div>
            <div>Passport: {passport ? resolvePassportStatus(passport) : "MISSING"}</div>
            <div>Trips: {summary.totalTrips}</div>
          </div>
        </div>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {performanceMetrics.map((metric) => (
          <Card key={metric.label} className="p-5">
            <p className="text-xs font-medium text-slate-500">{metric.label}</p>
            <p className="mt-3 text-3xl font-bold text-slate-950">{metric.value}</p>
            <p className="mt-2 text-[11px] text-slate-500">{metric.note}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-700"><Gauge size={15} /></span>
            <h3 className="text-sm font-semibold">Trip performance</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span>Total trips</span><strong>{summary.totalTrips}</strong></div>
            <div className="flex justify-between"><span>Completed</span><strong>{summary.completedTrips}</strong></div>
            <div className="flex justify-between"><span>Cancelled</span><strong>{summary.cancelledTrips}</strong></div>
            <div className="flex justify-between"><span>Average distance</span><strong>{summary.averageDistance.toFixed(1)} km</strong></div>
            <div className="flex justify-between"><span>Longest trip</span><strong>{summary.longestTrip} km</strong></div>
            <div className="flex justify-between"><span>Shortest trip</span><strong>{summary.shortestTrip} km</strong></div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-700"><Shield size={15} /></span>
            <h3 className="text-sm font-semibold">Safety overview</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span>Accidents</span><strong>{summary.accidents}</strong></div>
            <div className="flex justify-between"><span>Recent accidents</span><strong>{summary.recentAccidents}</strong></div>
            <div className="flex justify-between"><span>Safety score</span><strong>{Math.round(summary.safetyScore)}%</strong></div>
            <div className="flex justify-between"><span>Vehicle care score</span><strong>{Math.round(summary.vehicleCareScore)}%</strong></div>
            <div className="flex justify-between"><span>Violations</span><strong>N/A</strong></div>
          </div>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-700"><TrendingUp size={15} /></span>
            <h3 className="text-sm font-semibold">Performance trend</h3>
          </div>
          <p className="text-sm text-slate-500">Insufficient historical data to compute a meaningful trend for this driver in the current app data model.</p>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-700"><Truck size={15} /></span>
            <h3 className="text-sm font-semibold">Vehicle and compliance</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span>Current vehicle</span><strong>{vehicle ? `${vehicle.vehicleCode} · ${vehicle.vehicleName}` : "Unassigned"}</strong></div>
            <div className="flex justify-between"><span>Licence status</span><strong>{licence ? documentExpiryStatus(licence.expiryDate) : "MISSING"}</strong></div>
            <div className="flex justify-between"><span>Passport status</span><strong>{passport ? resolvePassportStatus(passport) : "MISSING"}</strong></div>
            <div className="flex justify-between"><span>Active trips</span><strong>{summary.activeTrips}</strong></div>
          </div>
        </Card>
      </section>

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-700"><Users size={15} /></span>
          <h3 className="text-sm font-semibold">Recent activity</h3>
        </div>
        <div className="space-y-2 text-sm text-slate-600">
          <p>Trips tracked: {summary.totalTrips}</p>
          <p>Completed trips: {summary.completedTrips}</p>
          <p>Accidents recorded: {summary.accidents}</p>
          <p>Average performance score: {Math.round(summary.performanceScore)}%</p>
        </div>
      </Card>
    </div>
  );
}
