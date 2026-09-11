/* eslint-disable @next/next/no-img-element -- Driver photos may use the configured storage URL. */
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CarFront, Mail, Phone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { authenticatedUser } from "@/lib/access-control";
import { db } from "@/lib/db";
import {
  documentExpiryStatus,
  driverStatusClassName,
  driverStatusLabels,
  formatShortDate,
} from "@/lib/driver-utils";

export const dynamic = "force-dynamic";
const value = (input: string | null | undefined) => input?.trim() || "—";

export default async function DriverDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await authenticatedUser();
  const driver = await db.driver.findFirst({
    where: { id, companyId: user.companyId! },
    include: {
      currentVehicles: {
        select: { id: true, vehicleCode: true, vehicleName: true },
      },
      primaryVehicles: {
        select: { id: true, vehicleCode: true, vehicleName: true },
      },
      trips: {
        select: {
          id: true,
          vehicleId: true,
          destination: true,
          startTime: true,
          endTime: true,
          status: true,
          vehicle: { select: { vehicleCode: true } },
        },
        orderBy: { startTime: "desc" },
        take: 10,
      },
      licences: {
        where: { isCurrent: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  if (!driver) notFound();

  const initials = driver.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const assignedVehicle =
    driver.currentVehicles[0] ?? driver.primaryVehicles[0];
  const currentLicence = driver.licences[0];
  const licenceStatus = documentExpiryStatus(currentLicence?.expiryDate ?? driver.licenseExpiry);

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/dashboard/drivers"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600"
      >
        <ArrowLeft size={14} />
        Drivers
      </Link>
      <div className="mt-5 grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="p-6">
          <div className="mx-auto grid size-36 place-items-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-3xl font-bold text-slate-500">
            {driver.profilePhotoUrl ? (
              <img
                src={driver.profilePhotoUrl}
                alt={`${driver.name} profile photo`}
                className="size-full object-cover"
              />
            ) : (
              <span aria-label={`${driver.name} has no profile photo`}>
                {initials}
              </span>
            )}
          </div>
          <div className="mt-5 text-center">
            <h1 className="text-2xl font-bold">{driver.name}</h1>
            <p className="mt-1 text-xs text-slate-500">
              {value(driver.employeeId)}
            </p>
            <span
              className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${driverStatusClassName(driver.status)}`}
            >
              {driverStatusLabels[driver.status] ?? driver.status}
            </span>
          </div>
          <div className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-xs">
            <p className="flex items-center gap-2 text-slate-600">
              <Phone size={14} />
              {driver.phone}
            </p>
            <p className="flex items-center gap-2 text-slate-600">
              <Mail size={14} />
              {value(driver.email)}
            </p>
            <p className="flex items-start gap-2 text-slate-600">
              <CarFront size={14} className="mt-0.5" />
              {assignedVehicle ? (
                <Link
                  href={`/vehicles/${assignedVehicle.id}`}
                  className="font-semibold text-blue-600"
                >
                  {assignedVehicle.vehicleCode} · {assignedVehicle.vehicleName}
                </Link>
              ) : (
                "Unassigned"
              )}
            </p>
          </div>
        </Card>
        <div className="space-y-5">
          <Card className="p-6">
            <h2 className="text-sm font-semibold">Driver details</h2>
            <Details
              rows={[
                ["Employee ID", value(driver.employeeId)],
                ["Department", value(driver.department)],
                ["Designation", value(driver.designation)],
                ["Employment type", value(driver.employmentType)],
                ["Joining date", formatShortDate(driver.joiningDate)],
                ["Date of birth", formatShortDate(driver.dateOfBirth)],
                ["Gender", value(driver.gender)],
                ["Address", value(driver.address)],
              ]}
            />
          </Card>
          <div className="grid gap-5 md:grid-cols-2">
            <Card className="p-6">
              <h2 className="text-sm font-semibold">Driving licence</h2>
              <Details
                rows={[
                  ["Licence number", currentLicence?.licenceNumber ?? driver.licenseNumber],
                  ["Category", currentLicence?.vehicleClass ?? "—"],
                  ["Expiry date", formatShortDate(currentLicence?.expiryDate ?? driver.licenseExpiry)],
                  ["Status", licenceStatus],
                ]}
              />
              {currentLicence && (
                <Link href={`/dashboard/drivers/licences/${currentLicence.id}`} className="mt-3 inline-flex text-xs font-semibold text-blue-600">
                  View licence →
                </Link>
              )}
            </Card>
            <Card className="p-6">
              <h2 className="text-sm font-semibold">Emergency contact</h2>
              <Details
                rows={[
                  ["Name", value(driver.emergencyContactName)],
                  ["Relationship", value(driver.emergencyRelationship)],
                  ["Phone", value(driver.emergencyPhone)],
                  ["Alternate phone", value(driver.emergencyAlternatePhone)],
                  ["Address", value(driver.emergencyAddress)],
                ]}
              />
            </Card>
          </div>
          <Card className="overflow-x-auto">
            <div className="p-5">
              <h2 className="text-sm font-semibold">Recent trips</h2>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    "Vehicle",
                    "Destination",
                    "Started",
                    "Returned",
                    "Status",
                  ].map((label) => (
                    <th key={label} className="px-4 py-3">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {driver.trips.map((trip) => (
                  <tr key={trip.id} className="border-t">
                    <td className="px-4 py-3">
                      <Link
                        href={`/vehicles/${trip.vehicleId}/trips/${trip.id}`}
                        className="font-semibold text-blue-600"
                      >
                        {trip.vehicle.vehicleCode}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{trip.destination}</td>
                    <td className="px-4 py-3">
                      {trip.startTime?.toLocaleString("en-GB") ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {trip.endTime?.toLocaleString("en-GB") ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {trip.status.replaceAll("_", " ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!driver.trips.length && (
              <p className="p-5 text-xs text-slate-500">
                No trips recorded for this driver.
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Details({ rows }: { rows: string[][] }) {
  return (
    <dl className="mt-4 divide-y divide-slate-100">
      {rows.map(([label, content]) => (
        <div key={label} className="flex justify-between gap-4 py-3 text-xs">
          <dt className="text-slate-500">{label}</dt>
          <dd className="text-right font-medium text-slate-800">{content}</dd>
        </div>
      ))}
    </dl>
  );
}
