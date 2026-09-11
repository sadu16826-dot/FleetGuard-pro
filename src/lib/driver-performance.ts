import { db } from "@/lib/db";
import { documentExpiryStatus } from "@/lib/driver-utils";
import { resolvePassportStatus } from "@/lib/passport";

export type PerformanceRange = "7d" | "30d" | "90d" | "180d" | "365d" | "all";
export type PerformanceLevel = "EXCELLENT" | "GOOD" | "AVERAGE" | "NEEDS_ATTENTION" | "CRITICAL";

export type DriverPerformanceRecord = {
  driverId: string;
  name: string;
  employeeId: string | null;
  status: string;
  assignedVehicle: { id: string; vehicleCode: string; vehicleName: string } | null;
  totalTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  activeTrips: number;
  totalDistance: number;
  averageDistance: number;
  longestTrip: number;
  shortestTrip: number;
  onTimeRate: number | null;
  accidents: number;
  recentAccidents: number;
  violations: number | null;
  totalFuelLitres: number;
  fuelEfficiencyScore: number | null;
  fuelEfficiencyValue: number | null;
  performanceScore: number;
  safetyScore: number;
  tripCompletionRate: number;
  cancellationRate: number;
  vehicleCareScore: number;
  performanceLevel: PerformanceLevel;
  driverStatusLabel: string;
  licenceStatus: string;
  passportStatus: string;
  needsAttention: boolean;
};

export function getPerformanceRange(range: string | undefined): { label: string; start: Date | null; end: Date | null } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const start = new Date(end.getTime());

  switch (range) {
    case "7d":
      start.setDate(end.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return { label: "Last 7 days", start, end };
    case "90d":
      start.setDate(end.getDate() - 89);
      start.setHours(0, 0, 0, 0);
      return { label: "Last 3 months", start, end };
    case "180d":
      start.setDate(end.getDate() - 179);
      start.setHours(0, 0, 0, 0);
      return { label: "Last 6 months", start, end };
    case "365d":
      start.setDate(end.getDate() - 364);
      start.setHours(0, 0, 0, 0);
      return { label: "This year", start, end };
    case "all":
      return { label: "All time", start: null, end: null };
    case "30d":
    default:
      start.setDate(end.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      return { label: "Last 30 days", start, end };
  }
}

export function performanceLevelForScore(score: number): PerformanceLevel {
  if (score >= 90) return "EXCELLENT";
  if (score >= 75) return "GOOD";
  if (score >= 60) return "AVERAGE";
  if (score >= 40) return "NEEDS_ATTENTION";
  return "CRITICAL";
}

export function performanceLevelLabel(level: PerformanceLevel) {
  return {
    EXCELLENT: "Excellent",
    GOOD: "Good",
    AVERAGE: "Average",
    NEEDS_ATTENTION: "Needs Attention",
    CRITICAL: "Critical",
  }[level];
}

export function performanceLevelClassName(level: PerformanceLevel) {
  switch (level) {
    case "EXCELLENT":
      return "bg-emerald-50 text-emerald-700";
    case "GOOD":
      return "bg-blue-50 text-blue-700";
    case "AVERAGE":
      return "bg-amber-50 text-amber-700";
    case "NEEDS_ATTENTION":
      return "bg-orange-50 text-orange-700";
    case "CRITICAL":
      return "bg-red-50 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export function clamp(value: number, minimum = 0, maximum = 100) {
  return Math.min(maximum, Math.max(minimum, value));
}

function distanceForTrip(trip: { startKm: number | null; endKm: number | null }) {
  const start = trip.startKm ?? 0;
  const end = trip.endKm ?? 0;
  if (start === 0 && end === 0) return 0;
  if (end >= start) return end - start;
  return start - end;
}

type DriverStatusFilter = "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "SUSPENDED" | "TERMINATED";

type DriverPerformanceDriver = {
  id: string;
  name: string;
  status: string;
  employeeId: string | null;
  companyId: string;
  currentVehicles: Array<{ id: string; vehicleCode: string; vehicleName: string }>;
  assignments: Array<{ vehicle: { id: string; vehicleCode: string; vehicleName: string } }>;
  licences: Array<{ id: string; expiryDate: Date | null }>;
  passport: { expiryDate: Date | string | null; status?: string | null } | null;
};

export async function getDriverPerformanceSummary({
  companyId,
  search,
  status,
  range,
}: {
  companyId: string;
  search?: string;
  status?: string;
  range?: string;
}) {
  const allowedStatuses = new Set<DriverStatusFilter>([
    "ACTIVE",
    "INACTIVE",
    "ON_LEAVE",
    "SUSPENDED",
    "TERMINATED",
  ]);
  const normalizedStatus = status && status !== "ALL" && allowedStatuses.has(status as DriverStatusFilter)
    ? (status as DriverStatusFilter)
    : undefined;
  const { start, end } = getPerformanceRange(range);

  const drivers = (await db.driver.findMany({
    where: {
      companyId,
      ...(normalizedStatus ? { status: normalizedStatus } : {}),
      ...(search?.trim()
        ? {
            OR: [
              { name: { contains: search.trim(), mode: "insensitive" } },
              { employeeId: { contains: search.trim(), mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      currentVehicles: { take: 1, select: { id: true, vehicleCode: true, vehicleName: true } },
      assignments: {
        where: { status: "ACTIVE" },
        take: 1,
        include: { vehicle: { select: { id: true, vehicleCode: true, vehicleName: true } } },
      },
      licences: {
        where: { isCurrent: true },
        orderBy: { expiryDate: "desc" },
        take: 1,
      },
      passport: true,
    },
    orderBy: { name: "asc" },
  })) as unknown as DriverPerformanceDriver[];

  const driverIds = drivers.map((driver) => driver.id);
  if (!driverIds.length) return [];

  const tripWhere = {
    driverId: { in: driverIds },
    ...(start || end ? { startTime: { gte: start ?? undefined, lte: end ?? undefined } } : {}),
  };

  const [trips, accidents, fuelRecords] = await Promise.all([
    db.trip.findMany({
      where: tripWhere,
      select: {
        id: true,
        driverId: true,
        status: true,
        startKm: true,
        endKm: true,
        startTime: true,
        endTime: true,
        expectedReturnTime: true,
        newDamage: true,
        tyreProblem: true,
        warningLight: true,
        mechanicalProblem: true,
      },
      orderBy: { startTime: "desc" },
    }),
    db.accident.findMany({
      where: {
        driverId: { in: driverIds },
        ...(start || end ? { date: { gte: start ?? undefined, lte: end ?? undefined } } : {}),
      },
      select: { id: true, driverId: true, status: true, date: true },
      orderBy: { date: "desc" },
    }),
    db.fuelRecord.findMany({
      where: {
        driverId: { in: driverIds },
        ...(start || end ? { date: { gte: start ?? undefined, lte: end ?? undefined } } : {}),
      },
      select: { driverId: true, litres: true, date: true },
      orderBy: { date: "desc" },
    }),
  ]);

  const tripsByDriver = new Map<string, typeof trips>();
  for (const trip of trips) {
    const list = tripsByDriver.get(trip.driverId) ?? [];
    list.push(trip);
    tripsByDriver.set(trip.driverId, list);
  }

  const accidentsByDriver = new Map<string, typeof accidents>();
  for (const accident of accidents) {
    const list = accidentsByDriver.get(accident.driverId) ?? [];
    list.push(accident);
    accidentsByDriver.set(accident.driverId, list);
  }

  const fuelByDriver = new Map<string, typeof fuelRecords>();
  for (const fuel of fuelRecords) {
    const list = fuelByDriver.get(fuel.driverId ?? "") ?? [];
    list.push(fuel);
    fuelByDriver.set(fuel.driverId ?? "", list);
  }

  const records: DriverPerformanceRecord[] = drivers.map((driver) => {
    const relevantTrips = tripsByDriver.get(driver.id) ?? [];
    const relevantAccidents = accidentsByDriver.get(driver.id) ?? [];
    const relevantFuel = fuelByDriver.get(driver.id) ?? [];

    const completedTrips = relevantTrips.filter((trip) => trip.status === "COMPLETED").length;
    const cancelledTrips = relevantTrips.filter((trip) => trip.status === "CANCELLED").length;
    const activeTrips = relevantTrips.filter((trip) => trip.status === "ACTIVE" || trip.status === "IN_PROGRESS").length;
    const totalTrips = relevantTrips.length;

    const tripDistances = relevantTrips.map((trip) => distanceForTrip(trip));
    const totalDistance = tripDistances.reduce((sum, value) => sum + value, 0);
    const averageDistance = totalTrips ? totalDistance / totalTrips : 0;
    const longestTrip = tripDistances.length ? Math.max(...tripDistances) : 0;
    const shortestTrip = tripDistances.length ? Math.min(...tripDistances) : 0;

    const timedTrips = relevantTrips.filter((trip) => trip.expectedReturnTime && trip.endTime).length;
    const onTimeTrips = relevantTrips.filter((trip) => {
      if (!trip.expectedReturnTime || !trip.endTime) return false;
      return new Date(trip.endTime).getTime() <= new Date(trip.expectedReturnTime).getTime();
    }).length;
    const onTimeRate = timedTrips ? (onTimeTrips / timedTrips) * 100 : null;

    const totalFuelLitres = relevantFuel.reduce((sum, fuel) => sum + Number(fuel.litres ?? 0), 0);
    const distancePerLitre = totalFuelLitres > 0 ? totalDistance / totalFuelLitres : null;
    const fuelEfficiencyScore = distancePerLitre ? clamp((distancePerLitre / 12) * 100, 0, 100) : null;

    const vehicleCareIssues = relevantTrips.filter((trip) =>
      trip.newDamage || trip.tyreProblem || trip.warningLight || trip.mechanicalProblem,
    ).length;
    const vehicleCareScore = clamp(100 - vehicleCareIssues * 12, 0, 100);

    const safetyScore = clamp(
      100 - relevantAccidents.length * 18 - cancelledTrips * 3 - vehicleCareIssues * 4,
      0,
      100,
    );
    const tripCompletionRate = totalTrips ? (completedTrips / totalTrips) * 100 : 0;
    const cancellationRate = totalTrips ? (cancelledTrips / totalTrips) * 100 : 0;

    let weightedScore = 0;
    let totalWeight = 0;

    const addMetric = (score: number | null, weight: number) => {
      if (score === null || Number.isNaN(score)) return;
      weightedScore += score * weight;
      totalWeight += weight;
    };

    addMetric(tripCompletionRate, 0.2);
    addMetric(safetyScore, 0.3);
    addMetric(onTimeRate, 0.15);
    addMetric(fuelEfficiencyScore, 0.15);
    addMetric(vehicleCareScore, 0.1);

    const performanceScore = totalWeight ? weightedScore / totalWeight : 0;
    const performanceLevel = performanceLevelForScore(performanceScore);
    const licenceStatus = driver.licences[0] ? documentExpiryStatus(driver.licences[0].expiryDate) : "MISSING";
    const passportStatus = driver.passport ? resolvePassportStatus(driver.passport) : "MISSING";

    return {
      driverId: driver.id,
      name: driver.name,
      employeeId: driver.employeeId,
      status: driver.status,
      assignedVehicle: driver.currentVehicles[0] ?? driver.assignments[0]?.vehicle ?? null,
      totalTrips,
      completedTrips,
      cancelledTrips,
      activeTrips,
      totalDistance,
      averageDistance,
      longestTrip,
      shortestTrip,
      onTimeRate,
      accidents: relevantAccidents.length,
      recentAccidents: relevantAccidents.filter((accident) => {
        if (!accident.date) return false;
        const ageDays = (Date.now() - new Date(accident.date).getTime()) / 86400000;
        return ageDays <= 90;
      }).length,
      violations: null,
      totalFuelLitres: totalFuelLitres,
      fuelEfficiencyScore,
      fuelEfficiencyValue: distancePerLitre,
      performanceScore,
      safetyScore,
      tripCompletionRate,
      cancellationRate,
      vehicleCareScore,
      performanceLevel,
      driverStatusLabel: driver.status,
      licenceStatus,
      passportStatus,
      needsAttention: performanceLevel === "NEEDS_ATTENTION" || performanceLevel === "CRITICAL",
    };
  });

  records.sort((left, right) => right.performanceScore - left.performanceScore || left.name.localeCompare(right.name));
  return records;
}

export async function getDriverPerformanceDetail({
  companyId,
  driverId,
  range,
}: {
  companyId: string;
  driverId: string;
  range?: string;
}) {
  const { start, end } = getPerformanceRange(range);
  const driver = (await db.driver.findFirst({
    where: { id: driverId, companyId },
    include: {
      currentVehicles: { take: 1, select: { id: true, vehicleCode: true, vehicleName: true } },
      assignments: {
        where: { status: "ACTIVE" },
        take: 1,
        include: { vehicle: { select: { id: true, vehicleCode: true, vehicleName: true } } },
      },
      licences: {
        where: { isCurrent: true },
        orderBy: { expiryDate: "desc" },
        take: 1,
      },
      passport: true,
    },
  })) as unknown as DriverPerformanceDriver | null;

  if (!driver) return null;

  const trips = await db.trip.findMany({
    where: {
      driverId,
      ...(start || end ? { startTime: { gte: start ?? undefined, lte: end ?? undefined } } : {}),
    },
    select: {
      id: true,
      status: true,
      startTime: true,
      endTime: true,
      expectedReturnTime: true,
      startKm: true,
      endKm: true,
      newDamage: true,
      tyreProblem: true,
      warningLight: true,
      mechanicalProblem: true,
    },
    orderBy: { startTime: "desc" },
  });

  const accidents = await db.accident.findMany({
    where: {
      driverId,
      ...(start || end ? { date: { gte: start ?? undefined, lte: end ?? undefined } } : {}),
    },
    orderBy: { date: "desc" },
  });

  const fuelRecords = await db.fuelRecord.findMany({
    where: {
      driverId,
      ...(start || end ? { date: { gte: start ?? undefined, lte: end ?? undefined } } : {}),
    },
    orderBy: { date: "desc" },
  });

  const records = await getDriverPerformanceSummary({ companyId, range, search: driver.name });
  const primary = records.find((record) => record.driverId === driverId) ?? null;

  return {
    driver,
    trips,
    accidents,
    fuelRecords,
    summary: primary,
  };
}
