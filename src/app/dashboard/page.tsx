import Link from "next/link";
import {
  CalendarDays,
  CarFront,
  CheckCircle2,
  FileWarning,
  Route,
  Wrench,
} from "lucide-react";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card } from "@/components/ui/card";
import { authenticatedUser } from "@/lib/access-control";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const statusGroups = [
  { label: "Available", values: ["AVAILABLE"], color: "bg-emerald-500" },
  { label: "In use", values: ["IN_USE"], color: "bg-blue-600" },
  {
    label: "Service",
    values: ["SERVICE_DUE", "IN_SERVICE"],
    color: "bg-amber-500",
  },
  {
    label: "Repair",
    values: ["ACCIDENT_REPAIR", "NOT_ROADWORTHY"],
    color: "bg-red-500",
  },
  {
    label: "Inspection required",
    values: ["INSPECTION_REQUIRED"],
    color: "bg-violet-500",
  },
] as const;

export default async function DashboardPage() {
  const user = await authenticatedUser();
  const companyId = user.companyId!;
  const now = new Date();
  const inThirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  let dashboardData;
  try {
    dashboardData = await Promise.all([
      db.vehicle.findMany({
        where: { companyId },
        select: { id: true, status: true },
      }),
      db.trip.findMany({
        where: {
          vehicle: { companyId },
          status: { in: ["ACTIVE", "IN_PROGRESS"] },
        },
        include: {
          vehicle: { select: { vehicleCode: true } },
          driver: { select: { name: true } },
        },
        orderBy: { startTime: "desc" },
        take: 8,
      }),
      db.vehicleActivity.findMany({
        where: { vehicle: { companyId } },
        include: { vehicle: { select: { vehicleCode: true } } },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      db.vehicleDocument.count({
        where: {
          vehicle: { companyId },
          serviceId: null,
          fuelRecordId: null,
          expiryDate: { gte: now, lte: inThirtyDays },
        },
      }),
      db.vehicle.count({
        where: {
          companyId,
          OR: [
            { status: { in: ["SERVICE_DUE", "IN_SERVICE"] } },
            { nextServiceDate: { lte: inThirtyDays } },
          ],
        },
      }),
    ]);
  } catch (error) {
    console.error("Dashboard data load failed", error);
    throw error;
  }
  const [vehicles, activeTrips, activities, expiringDocuments, serviceAlerts] =
    dashboardData;
  const available = vehicles.filter(
    (vehicle) => vehicle.status === "AVAILABLE",
  ).length;
  const statusRows = statusGroups.map((group) => ({
    ...group,
    value: vehicles.filter((vehicle) =>
      (group.values as readonly string[]).includes(vehicle.status),
    ).length,
  }));

  return (
    <div className="mx-auto max-w-[1500px]">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Operations overview
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
            Hello, {user.name}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Current records for your company fleet.
          </p>
        </div>
        <div className="flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
          <CalendarDays size={15} />
          <span>
            {now.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
      </div>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Total vehicles"
          value={String(vehicles.length)}
          detail="Database records"
          icon={CarFront}
        />
        <StatCard
          label="Available vehicles"
          value={String(available)}
          detail={`${vehicles.length ? Math.round((available / vehicles.length) * 100) : 0}% fleet availability`}
          icon={CheckCircle2}
          tone="green"
        />
        <StatCard
          label="Active trips"
          value={String(activeTrips.length)}
          detail="Currently in progress"
          icon={Route}
          tone="violet"
        />
        <StatCard
          label="Maintenance alerts"
          value={String(serviceAlerts)}
          detail="Due or in service"
          trend="down"
          icon={Wrench}
          tone="amber"
        />
        <StatCard
          label="Expiring documents"
          value={String(expiringDocuments)}
          detail="Within the next 30 days"
          trend="down"
          icon={FileWarning}
        />
      </section>
      <section className="mt-5">
        <Card className="p-5 sm:p-6">
          <div>
            <h2 className="text-sm font-semibold">Vehicle status overview</h2>
            <p className="mt-1 text-xs text-slate-500">
              Current distribution across {vehicles.length} vehicles
            </p>
          </div>
          <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {statusRows.map((row) => (
              <div key={row.label}>
                <div className="flex items-end justify-between">
                  <p className="text-xs font-medium text-slate-600">
                    {row.label}
                  </p>
                  <p className="text-lg font-bold">{row.value}</p>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${row.color}`}
                    style={{
                      width: `${vehicles.length ? (row.value / vehicles.length) * 100 : 0}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-[10px] text-slate-400">
                  {vehicles.length
                    ? Math.round((row.value / vehicles.length) * 100)
                    : 0}
                  % of fleet
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>
      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <Card className="overflow-x-auto">
          <div className="border-b p-5">
            <h2 className="text-sm font-semibold">Active trips</h2>
            <p className="mt-1 text-xs text-slate-500">
              Current vehicle and driver assignments
            </p>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50">
              <tr>
                {["Vehicle", "Driver", "Destination", "Started"].map(
                  (label) => (
                    <th key={label} className="p-3">
                      {label}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {activeTrips.map((trip) => (
                <tr key={trip.id} className="border-t">
                  <td className="p-3 font-semibold">
                    {trip.vehicle.vehicleCode}
                  </td>
                  <td className="p-3">{trip.driver.name}</td>
                  <td className="p-3">{trip.destination}</td>
                  <td className="p-3">
                    {trip.startTime?.toLocaleString("en-GB") ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!activeTrips.length && (
            <p className="p-5 text-xs text-slate-500">No active trips.</p>
          )}
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-semibold">Recent activity</h2>
          <p className="mt-1 text-xs text-slate-500">
            Latest authoritative vehicle events
          </p>
          <div className="mt-5 space-y-4">
            {activities.map((activity) => (
              <div key={activity.id}>
                <Link
                  href={`/vehicles/${activity.vehicleId}?tab=History`}
                  className="text-xs font-medium text-slate-700 hover:text-blue-600"
                >
                  {activity.description}
                </Link>
                <p className="mt-1 text-[10px] text-slate-400">
                  {activity.vehicle.vehicleCode} ·{" "}
                  {activity.createdAt.toLocaleString("en-GB")}
                </p>
              </div>
            ))}
            {!activities.length && (
              <p className="text-xs text-slate-500">No activity recorded.</p>
            )}
          </div>
        </Card>
      </section>
      <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_300px]">
        <Card className="p-5">
          <h2 className="text-sm font-semibold">Fleet records</h2>
          <p className="mt-2 text-xs text-slate-500">
            Open Vehicle Management to view service, document, tyre, fuel and
            issue details from PostgreSQL.
          </p>
          <Link
            href="/vehicles"
            className="mt-4 inline-flex text-xs font-semibold text-blue-600"
          >
            View vehicles →
          </Link>
        </Card>
        <QuickActions />
      </section>
    </div>
  );
}
