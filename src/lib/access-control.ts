import { cookies } from "next/headers";
import { forbidden } from "next/navigation";
import { db } from "@/lib/db";
import { sessionUserId, SESSION_COOKIE } from "@/lib/auth";
import { can, type PermissionAction, type PermissionModule } from "@/lib/permissions";
import { databaseErrorCategory, logServerError } from "@/lib/database-errors";

export class AccessError extends Error {
  constructor(
    message: string,
    public status: 401 | 403 | 404,
  ) {
    super(message);
  }
}

export async function authenticatedUser(
  requirement: boolean | { module: PermissionModule; action?: PermissionAction } = false,
) {
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  const userId = sessionUserId(session);
  if (!userId)
    throw new AccessError("Authentication is required.", 401);

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user?.companyId || !user.active)
    throw new AccessError(
      user && !user.active
        ? "This account is inactive."
        : "Your account is not associated with a company.",
      403,
    );
  const allowed = typeof requirement === "boolean"
    ? !requirement || ["ADMIN", "FLEET_MANAGER"].includes(user.role)
    : can(user.role, requirement.module, requirement.action);
  if (!allowed)
    throw new AccessError(
      "You do not have permission to perform this action.",
      403,
    );
  return user;
}

export function requirePermission(
  module: PermissionModule,
  action: PermissionAction = "VIEW",
) {
  return authenticatedUser({ module, action });
}

export async function requirePagePermission(
  module: PermissionModule,
  action: PermissionAction = "VIEW",
) {
  try {
    return await requirePermission(module, action);
  } catch (error) {
    if (error instanceof AccessError && error.status === 403) forbidden();
    throw error;
  }
}

export async function accessibleVehicle(
  id: string,
  requirement: boolean | { module: PermissionModule; action?: PermissionAction } = { module: "VEHICLES" },
) {
  const user = await authenticatedUser(requirement);
  const vehicle = await db.vehicle.findFirst({
    where: { id, companyId: user.companyId! },
  });
  if (!vehicle) throw new AccessError("Vehicle not found.", 404);
  return { user, vehicle };
}

export async function driverForUser(user: Awaited<ReturnType<typeof authenticatedUser>>) {
  if (user.role !== "DRIVER") return null;
  const candidates = await db.driver.findMany({
    where: {
      companyId: user.companyId!,
      status: "ACTIVE",
      OR: [
        { email: { equals: user.email, mode: "insensitive" } },
        { name: { equals: user.name, mode: "insensitive" } },
      ],
    },
    select: { id: true, email: true, name: true },
  });
  const normalizedEmail = user.email.toLowerCase();
  const normalizedName = user.name.toLowerCase();
  const exactEmail = candidates.filter((driver) => driver.email?.toLowerCase() === normalizedEmail);
  const matches = exactEmail.length
    ? exactEmail
    : candidates.filter((driver) => driver.name.toLowerCase() === normalizedName);
  const driver = matches.length === 1 ? matches[0] : null;
  if (process.env.NODE_ENV !== "production")
    console.info("Driver identity resolution", {
      userId: user.id,
      userRole: user.role,
      resolvedDriverId: driver?.id ?? null,
      candidateDriverIds: candidates.map((candidate) => candidate.id),
    });
  return driver;
}

export function accessFailure(
  error: unknown,
  fallback = "Unable to complete this request.",
) {
  if (!(error instanceof AccessError)) {
    const category = databaseErrorCategory(error);
    logServerError("protected request", error);
    if (category === "unavailable")
      return Response.json(
        { message: "The database is temporarily unavailable. Please try again." },
        { status: 503 },
      );
    if (category === "schema")
      return Response.json(
        { message: "The database schema is not ready for this request." },
        { status: 503 },
      );
  }
  return Response.json(
    { message: error instanceof AccessError ? error.message : fallback },
    { status: error instanceof AccessError ? error.status : 500 },
  );
}
