import { PrismaClient } from "../src/generated/prisma/client.js";

if (process.env.CONFIRM_FLEETGUARD_DATA_PURGE !== "yes") {
  throw new Error(
    "Refusing to purge data. Set CONFIRM_FLEETGUARD_DATA_PURGE=yes for this command only.",
  );
}

const db = new PrismaClient();

const countRecords = () => Promise.all([
  db.company.count(),
  db.user.count(),
  db.vehicle.count(),
  db.driver.count(),
  db.trip.count(),
  db.tripVehiclePhoto.count(),
  db.inspection.count(),
  db.inspectionEvidence.count(),
  db.service.count(),
  db.tyre.count(),
  db.fuelRecord.count(),
  db.vehicleIssue.count(),
  db.expense.count(),
  db.accident.count(),
  db.vehicleDocument.count(),
  db.vehicleActivity.count(),
  db.driverDocument.count(),
  db.driverLicence.count(),
  db.driverLicenceDocument.count(),
  db.driverPassport.count(),
  db.driverAssignment.count(),
  db.tyreHistory.count(),
  db.notification.count(),
]).then(([
  companies, users, vehicles, drivers, trips, tripVehiclePhotos, inspections,
  inspectionEvidence, services, tyres, fuelRecords, vehicleIssues, expenses,
  accidents, vehicleDocuments, vehicleActivities, driverDocuments, driverLicences,
  driverLicenceDocuments, driverPassports, driverAssignments, tyreHistory,
  notifications,
]) => ({
  companies, users, vehicles, drivers, trips, tripVehiclePhotos, inspections,
  inspectionEvidence, services, tyres, fuelRecords, vehicleIssues, expenses,
  accidents, vehicleDocuments, vehicleActivities, driverDocuments, driverLicences,
  driverLicenceDocuments, driverPassports, driverAssignments, tyreHistory,
  notifications,
}));

try {
  const bootstrapAdmin = await db.user.findFirst({
    where: { active: true, role: "ADMIN", companyId: { not: null } },
    orderBy: { createdAt: "asc" },
    select: { id: true, companyId: true },
  });

  if (!bootstrapAdmin?.companyId)
    throw new Error("No active ADMIN account with a Company is available to preserve.");

  const before = await countRecords();

  await db.$transaction(async (tx) => {
    await tx.notification.deleteMany();
    await tx.tripVehiclePhoto.deleteMany();
    await tx.inspectionEvidence.deleteMany();
    await tx.vehicleDocument.deleteMany();
    await tx.driverLicenceDocument.deleteMany();
    await tx.driverPassport.deleteMany();
    await tx.driverLicence.updateMany({ data: { previousLicenceId: null } });
    await tx.driverLicence.deleteMany();
    await tx.driverDocument.deleteMany();
    await tx.vehicleActivity.deleteMany();
    await tx.tyreHistory.deleteMany();
    await tx.driverAssignment.deleteMany();
    await tx.inspection.deleteMany();
    await tx.trip.deleteMany();
    await tx.service.deleteMany();
    await tx.tyre.deleteMany();
    await tx.fuelRecord.deleteMany();
    await tx.vehicleIssue.deleteMany();
    await tx.expense.deleteMany();
    await tx.accident.deleteMany();
    await tx.vehicle.deleteMany();
    await tx.driver.deleteMany();
    await tx.user.deleteMany({ where: { id: { not: bootstrapAdmin.id } } });
    await tx.company.deleteMany({ where: { id: { not: bootstrapAdmin.companyId } } });
  }, { maxWait: 10000, timeout: 30000 });

  const after = await countRecords();
  console.log(JSON.stringify({ before, after, bootstrapAdminPreserved: true }));
} finally {
  await db.$disconnect();
}
