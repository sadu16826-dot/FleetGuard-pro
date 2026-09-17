import Link from "next/link";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Table, TableCell, TableHead } from "@/components/ui/table";
import { DriverRowActions } from "@/components/drivers/driver-row-actions";
import { authenticatedUser } from "@/lib/access-control";
import { db } from "@/lib/db";
import { documentExpiryStatus, driverStatusClassName, driverStatusLabels, formatShortDate } from "@/lib/driver-utils";

export const dynamic = "force-dynamic";

export default async function DriverManagementPage() {
  const user = await authenticatedUser();
  const drivers = await db.driver.findMany({
    where: { companyId: user.companyId! },
    include: {
      currentVehicles: { select: { vehicleName: true, vehicleCode: true } },
      trips: { orderBy: { startTime: "desc" }, take: 1 },
    },
    orderBy: { name: "asc" },
  });
  const canManageDrivers = user.role === "ADMIN";

  return (
    <div className="mx-auto max-w-[1500px]">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Driver management</h1>
          <p className="mt-1 text-sm text-slate-500">Track driver profiles, licence status and active assignments.</p>
        </div>
        {canManageDrivers && <Link href="/dashboard/drivers/new" className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">
          <Plus size={16} />
          Add driver
        </Link>}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <thead className="bg-slate-50">
              <tr>
                <TableHead>Driver</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>License</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned vehicle</TableHead>
                <TableHead>Last trip</TableHead>
                <TableHead>Expiry</TableHead>
                {canManageDrivers && <TableHead>Actions</TableHead>}
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver) => {
                const latestTrip = driver.trips[0];
                const expiryStatus = documentExpiryStatus(driver.licenseExpiry);
                const assignedVehicle = driver.currentVehicles[0];

                return (
                  <tr key={driver.id} className="border-t border-slate-200 text-sm">
                    <TableCell>
                      <Link href={`/dashboard/drivers/${driver.id}`} className="font-semibold text-slate-900 hover:text-blue-600">
                        {driver.name}
                      </Link>
                      <div className="mt-1 text-xs text-slate-500">{driver.email || "No email on file"}</div>
                    </TableCell>
                    <TableCell>{driver.phone}</TableCell>
                    <TableCell>
                      <div className="font-medium">{driver.licenseNumber}</div>
                      <div className="text-xs text-slate-500">{formatShortDate(driver.licenseExpiry)}</div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${driverStatusClassName(driver.status)}`}>
                        {driverStatusLabels[(driver.status as keyof typeof driverStatusLabels)] ?? "Unknown"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {assignedVehicle ? `${assignedVehicle.vehicleCode} · ${assignedVehicle.vehicleName}` : "Unassigned"}
                    </TableCell>
                    <TableCell>
                      {latestTrip ? `${latestTrip.destination} · ${formatShortDate(latestTrip.startTime)}` : "No trips recorded"}
                    </TableCell>
                    <TableCell>
                      <span className={expiryStatus === "EXPIRED" ? "text-rose-700" : expiryStatus === "DUE_SOON" ? "text-amber-700" : "text-emerald-700"}>
                        {expiryStatus}
                      </span>
                    </TableCell>
                    {canManageDrivers && <TableCell><DriverRowActions driver={driver} /></TableCell>}
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
        {!drivers.length && (
          <div className="p-8 text-center text-sm text-slate-500">No drivers found for this company.</div>
        )}
      </Card>
    </div>
  );
}
