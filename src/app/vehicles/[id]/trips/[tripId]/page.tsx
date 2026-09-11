/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";
import { authenticatedUser } from "@/lib/access-control";

export const dynamic = "force-dynamic";
const display = (value: string | number | null | undefined) =>
  value == null || value === "" ? "—" : String(value).replaceAll("_", " ");
const dateTime = (value: Date | null) =>
  value
    ? value.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })
    : "—";

export default async function TripDetails({
  params,
}: {
  params: Promise<{ id: string; tripId: string }>;
}) {
  const { id, tripId } = await params;
  const user = await authenticatedUser();
  const trip = await db.trip.findFirst({
    where: {
      id: tripId,
      vehicleId: id,
      vehicle: { companyId: user.companyId! },
    },
    include: {
      vehicle: true,
      driver: true,
      inspections: { orderBy: { inspectionType: "asc" } },
      vehiclePhotos: {
        select: { id: true, photoType: true, phase: true },
        orderBy: { photoType: "asc" },
      },
    },
  });
  if (!trip) notFound();
  const distance =
    trip.startKm != null && trip.endKm != null
      ? trip.endKm - trip.startKm
      : null;
  const preTripPhotos = trip.vehiclePhotos.filter(
    (photo) => photo.phase === "PRE_TRIP",
  );
  const postTripPhotos = trip.vehiclePhotos.filter(
    (photo) => photo.phase === "POST_TRIP",
  );
  const photoTypes = ["FRONT", "REAR", "LEFT", "RIGHT"] as const;
  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href={`/vehicles/${id}?tab=Trips`}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500"
      >
        <ArrowLeft size={14} />
        Back to {trip.vehicle.vehicleName}
      </Link>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Trip details</h1>
          <p className="mt-1 text-sm text-slate-500">
            {trip.vehicle.registrationNumber} · {trip.purpose}
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
          {display(trip.status)}
        </span>
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <Details
          title="Trip information"
          rows={[
            ["Driver", trip.driver.name],
            ["Purpose", trip.purpose],
            ["Route", `${display(trip.startLocation)} → ${trip.destination}`],
            ["Started", dateTime(trip.startTime)],
            ["Expected return", dateTime(trip.expectedReturnTime)],
            ["Returned", dateTime(trip.endTime)],
            ["Start KM", trip.startKm?.toLocaleString() ?? "—"],
            ["End KM", trip.endKm?.toLocaleString() ?? "—"],
            [
              "Distance",
              distance == null ? "—" : `${distance.toLocaleString()} KM`,
            ],
            ["Remarks", display(trip.remarks)],
          ]}
        />
        <Details
          title="Return condition"
          rows={[
            ["New damage", trip.newDamage ? "Yes" : "No"],
            ["Accident", trip.accidentReported ? "Yes" : "No"],
            ["Tyre problem", trip.tyreProblem ? "Yes" : "No"],
            ["Warning light", trip.warningLight ? "Yes" : "No"],
            ["Mechanical problem", trip.mechanicalProblem ? "Yes" : "No"],
            [
              "Return fuel",
              trip.returnFuelLevel == null ? "—" : `${trip.returnFuelLevel}%`,
            ],
            [
              "Return battery",
              trip.returnBatteryPercentage == null
                ? "—"
                : `${trip.returnBatteryPercentage}%`,
            ],
            ["Driver remarks", display(trip.returnRemarks)],
          ]}
        />
      </div>
      <Card className="mt-5 p-5">
        <h2 className="text-sm font-semibold">Vehicle condition</h2>
        <p className="mt-1 text-xs text-slate-500">
          Compare the vehicle before departure and after return.
        </p>
        <div className="mt-4 grid grid-cols-[64px_minmax(0,1fr)_minmax(0,1fr)] gap-2 sm:grid-cols-[90px_minmax(0,1fr)_minmax(0,1fr)] sm:gap-4">
          <span />
          <span className="text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Before trip
          </span>
          <span className="text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            After trip
          </span>
          {photoTypes.map((type) => (
            <div key={type} className="contents">
              <span className="self-center text-[11px] font-semibold text-slate-600">
                {display(type)}
              </span>
              <ConditionPhoto
                id={preTripPhotos.find((photo) => photo.photoType === type)?.id}
                vehicleId={id}
                tripId={tripId}
                label={`${display(type)} before trip`}
              />
              <ConditionPhoto
                id={
                  postTripPhotos.find((photo) => photo.photoType === type)?.id
                }
                vehicleId={id}
                tripId={tripId}
                label={`${display(type)} after trip`}
              />
            </div>
          ))}
        </div>
      </Card>
      <h2 className="mt-7 text-sm font-semibold">Inspections</h2>
      <div className="mt-3 grid gap-5 md:grid-cols-2">
        {trip.inspections.map((inspection) => (
          <Details
            key={inspection.id}
            title={display(inspection.inspectionType)}
            rows={[
              ["Tyres", inspection.tyreStatus],
              ["Damage", inspection.damageStatus],
              ["Fuel level", `${inspection.fuelLevel}%`],
              [
                "Tyre pressure",
                inspection.tyrePressureOk == null
                  ? "—"
                  : inspection.tyrePressureOk
                    ? "OK"
                    : "Attention",
              ],
              [
                "Lights",
                inspection.lightsOk == null
                  ? "—"
                  : inspection.lightsOk
                    ? "OK"
                    : "Attention",
              ],
              [
                "Indicators",
                inspection.indicatorsOk == null
                  ? "—"
                  : inspection.indicatorsOk
                    ? "OK"
                    : "Attention",
              ],
              [
                "Brake lights",
                inspection.brakeLightsOk == null
                  ? "—"
                  : inspection.brakeLightsOk
                    ? "OK"
                    : "Attention",
              ],
              [
                "Mirrors",
                inspection.mirrorsOk == null
                  ? "—"
                  : inspection.mirrorsOk
                    ? "OK"
                    : "Attention",
              ],
              ["Notes", display(inspection.notes)],
            ]}
          />
        ))}
        {!trip.inspections.length && (
          <Card className="p-8 text-center text-sm text-slate-500">
            No inspections recorded.
          </Card>
        )}
      </div>
    </div>
  );
}

function Details({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      <dl className="mt-4 divide-y divide-slate-100">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 py-3 text-xs">
            <dt className="text-slate-500">{label}</dt>
            <dd className="text-right font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function ConditionPhoto({
  id,
  vehicleId,
  tripId,
  label,
}: {
  id?: string;
  vehicleId: string;
  tripId: string;
  label: string;
}) {
  if (!id)
    return (
      <span className="grid aspect-[4/3] place-items-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-2 text-center text-[10px] text-slate-400">
        Not recorded
      </span>
    );
  const url = `/api/vehicles/${vehicleId}/trips/${tripId}/photos/${id}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="overflow-hidden rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <img src={url} alt={label} className="aspect-[4/3] w-full object-cover" />
    </a>
  );
}
