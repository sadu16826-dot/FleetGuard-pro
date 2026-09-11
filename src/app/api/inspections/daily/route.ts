import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticatedUser } from "@/lib/access-control";

export async function POST(request: Request) {
  try {
    const user = await authenticatedUser({ module: "INSPECTIONS", action: "CREATE" });
    const contentType = request.headers.get("content-type") ?? "";
    const body = contentType.includes("application/json")
      ? await request.json()
      : Object.fromEntries((await request.formData()).entries());
    const vehicleId = String(body.vehicleId ?? "");
    const driverId = body.driverId ? String(body.driverId) : null;
    const currentKm = Number(body.currentKm);
    const vehicle = await db.vehicle.findFirst({ where: { id: vehicleId, companyId: user.companyId! }, select: { currentKm: true, fuelType: true } });
    if (!vehicle) return NextResponse.json({ message: "Vehicle not found." }, { status: 404 });
    if (!Number.isInteger(currentKm) || currentKm < vehicle.currentKm) return NextResponse.json({ message: "Current odometer reading cannot be lower than the vehicle reading." }, { status: 400 });
    if (driverId && !(await db.driver.findFirst({ where: { id: driverId, companyId: user.companyId!, status: "ACTIVE" }, select: { id: true } }))) return NextResponse.json({ message: "Driver is not available." }, { status: 400 });
    const checked = (key: string) => body[key] === true || body[key] === "on" || body[key] === "true";
    const failed = checked("newDamage") || body.tyresOk === false || body.tyresOk === "false" || body.tyrePressureOk === false || body.lightsOk === false;
    const inspection = await db.$transaction(async tx => {
      const row = await tx.inspection.create({ data: { vehicleId, driverId, inspectorId: user.id, companyId: user.companyId!, inspectionType: "PERIODIC", previousKm: vehicle.currentKm, currentKm, result: failed ? "FAILED" : "PASSED", status: "COMPLETED", tyreStatus: checked("tyresOk") ? "OK" : "ATTENTION", damageStatus: checked("newDamage") ? "NEW_DAMAGE" : "CLEAR", fuelLevel: Number(body.fuelLevel ?? 0), notes: body.notes ? String(body.notes) : null, photos: [], tyresOk: checked("tyresOk"), tyrePressureOk: checked("tyrePressureOk"), lightsOk: checked("lightsOk"), mechanicalProblem: failed } });
      await tx.vehicle.update({ where: { id: vehicleId }, data: { currentKm, ...(failed ? { status: "INSPECTION_REQUIRED" } : {}) } });
      await tx.vehicleActivity.create({ data: { vehicleId, userId: user.id, action: "INSPECTION_COMPLETED", description: `Daily inspection ${failed ? "failed" : "passed"}`, metadata: { inspectionId: row.id, result: row.result, currentKm } } });
      return row;
    });
    return NextResponse.json(inspection, { status: 201 });
  } catch { return NextResponse.json({ message: "Daily inspection could not be saved." }, { status: 500 }); }
}
