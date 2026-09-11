import Link from "next/link";
import { AlertTriangle, ArrowUpRight, Gauge, Shield, TimerReset, Truck, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Table, TableCell, TableHead } from "@/components/ui/table";
import { authenticatedUser } from "@/lib/access-control";
import { db } from "@/lib/db";
import { getDriverPerformanceSummary, performanceLevelClassName, performanceLevelLabel } from "@/lib/driver-performance";
import { documentExpiryStatus } from "@/lib/driver-utils";
import { resolvePassportStatus } from "@/lib/passport";

export const dynamic = "force-dynamic";

export default async function DriverPerformancePage() {
  const user = await authenticatedUser();
  const [records, complianceDrivers] = await Promise.all([
    getDriverPerformanceSummary({ companyId: user.companyId!, range: "30d" }),
    db.driver.findMany({
      where: { companyId: user.companyId! },
      include: {
        licences: { where: { isCurrent: true }, orderBy: { expiryDate: "desc" }, take: 1 },
        passport: true,
      },
      orderBy: { name: "asc" },
      take: 5,
    }),
  ]);

  const totalDrivers = records.length;
  const activeDrivers = records.filter((record) => record.status === "ACTIVE").length;
  const averageScore = totalDrivers
    ? Math.round(records.reduce((sum, record) => sum + record.performanceScore, 0) / totalDrivers)
    : 0;
  const topPerformer = records[0]?.name ?? "N/A";
  const attentionRequired = records.filter((record) => record.needsAttention).length;

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Driver Performance</h1>
          <p className="mt-1 text-sm text-slate-500">Monitor driver safety, efficiency, reliability and operational performance.</p>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Total Drivers" value={String(totalDrivers)} detail="Database records" icon={Users} tone="blue"/>
        <MetricCard label="Active Drivers" value={String(activeDrivers)} detail="Currently active" icon={Truck} tone="green"/>
        <MetricCard label="Average Score" value={`${averageScore}%`} detail="Across active drivers" icon={Gauge} tone="violet"/>
        <MetricCard label="Top Performer" value={topPerformer} detail={records[0] ? `${records[0].performanceScore.toFixed(0)}% score` : "No driver data"} icon={ArrowUpRight} tone="emerald"/>
        <MetricCard label="Needs Attention" value={String(attentionRequired)} detail="Drivers requiring review" icon={AlertTriangle} tone="amber"/>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <Card className="overflow-hidden">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-sm font-semibold">Driver performance ranking</h2>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <thead className="bg-slate-50">
                <tr>
                  <TableHead>Driver</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Trips</TableHead>
                  <TableHead>Safety</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </tr>
              </thead>
              <tbody>
                {records.map((driver, index) => (
                  <tr key={driver.driverId} className="border-t border-slate-200">
                    <TableCell>
                      <div className="font-semibold text-slate-900">{index + 1}. {driver.name}</div>
                    </TableCell>
                    <TableCell>{driver.employeeId ?? "—"}</TableCell>
                    <TableCell>{driver.totalTrips}</TableCell>
                    <TableCell>{Math.round(driver.safetyScore)}%</TableCell>
                    <TableCell>{Math.round(driver.performanceScore)}%</TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${performanceLevelClassName(driver.performanceLevel)}`}>
                        {performanceLevelLabel(driver.performanceLevel)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/drivers/${driver.driverId}`} className="text-xs font-semibold text-blue-600">View Performance</Link>
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          {!records.length && <div className="p-8 text-center text-sm text-slate-500">No driver performance records available for this company.</div>}
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold">Performance alerts</h2>
          <div className="mt-4 space-y-3">
            {records.filter((record) => record.needsAttention).length ? (
              records.filter((record) => record.needsAttention).slice(0, 5).map((driver) => (
                <div key={driver.driverId} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  <div className="font-semibold">{driver.name}</div>
                  <div className="mt-1 text-xs">{performanceLevelLabel(driver.performanceLevel)} performance score: {Math.round(driver.performanceScore)}%</div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">No active alerts for the current period.</div>
            )}
          </div>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <MetricDetail title="Safety metrics" icon={Shield}>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between"><span>Accidents</span><strong>{records.reduce((sum, record) => sum + record.accidents, 0)}</strong></div>
            <div className="flex items-center justify-between"><span>Recent accidents</span><strong>{records.reduce((sum, record) => sum + record.recentAccidents, 0)}</strong></div>
            <div className="flex items-center justify-between"><span>Average safety score</span><strong>{totalAverage(records, "safetyScore")}%</strong></div>
            <div className="flex items-center justify-between"><span>Violations</span><strong>N/A</strong></div>
          </div>
        </MetricDetail>

        <MetricDetail title="Trip metrics" icon={TimerReset}>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between"><span>Total trips</span><strong>{records.reduce((sum, record) => sum + record.totalTrips, 0)}</strong></div>
            <div className="flex items-center justify-between"><span>Completed</span><strong>{records.reduce((sum, record) => sum + record.completedTrips, 0)}</strong></div>
            <div className="flex items-center justify-between"><span>Cancelled</span><strong>{records.reduce((sum, record) => sum + record.cancelledTrips, 0)}</strong></div>
            <div className="flex items-center justify-between"><span>Avg distance</span><strong>{records.reduce((sum, record) => sum + record.averageDistance, 0).toFixed(0)} km</strong></div>
          </div>
        </MetricDetail>

        <MetricDetail title="Compliance" icon={Shield}>
          <div className="space-y-3 text-sm">
            {complianceDrivers.map((driver) => (
              <div key={driver.id} className="flex items-center justify-between gap-3">
                <span className="truncate">{driver.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-slate-500">{documentExpiryStatus(driver.licences[0]?.expiryDate ?? null)}</span>
                  <span className="text-[11px] font-medium text-slate-500">{resolvePassportStatus(driver.passport ?? null)}</span>
                </div>
              </div>
            ))}
          </div>
        </MetricDetail>
      </section>
    </div>
  );
}

function MetricCard({ label, value, detail, icon: Icon, tone }: { label: string; value: string; detail: string; icon: typeof Users; tone: "blue" | "green" | "amber" | "violet" | "emerald"; }) {
  const colors = { blue: "bg-blue-50 text-blue-600", green: "bg-emerald-50 text-emerald-600", amber: "bg-amber-50 text-amber-600", violet: "bg-violet-50 text-violet-600", emerald: "bg-emerald-50 text-emerald-600" };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
        </div>
        <span className={`grid size-10 place-items-center rounded-lg ${colors[tone]}`}><Icon size={18} /></span>
      </div>
      <p className="mt-4 text-[11px] text-slate-500">{detail}</p>
    </Card>
  );
}

function MetricDetail({ title, icon: Icon, children }: { title: string; icon: typeof Shield; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-700"><Icon size={15} /></span>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="mt-5">{children}</div>
    </Card>
  );
}

function totalAverage(records: Array<{ performanceScore: number; safetyScore: number }>, key: "performanceScore" | "safetyScore") {
  if (!records.length) return 0;
  return Math.round(records.reduce((sum, record) => sum + record[key], 0) / records.length);
}
