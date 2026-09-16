import type { UserRole } from "@/generated/prisma";

export const userRoles = [
  "ADMIN",
  "FLEET_MANAGER",
  "INSPECTOR",
  "DRIVER",
  "MAINTENANCE_STAFF",
  "FINANCE",
  "EMPLOYEE",
] as const satisfies readonly UserRole[];

export const modules = [
  "DASHBOARD",
  "VEHICLES",
  "DRIVERS",
  "TRIPS",
  "INSPECTIONS",
  "MAINTENANCE",
  "TYRES",
  "FUEL",
  "EXPENSES",
  "DOCUMENTS",
  "ACCIDENTS",
  "REPORTS",
  "USERS",
  "SETTINGS",
] as const;

export const actions = [
  "VIEW",
  "CREATE",
  "EDIT",
  "DELETE",
  "APPROVE",
  "UPLOAD",
  "ASSIGN",
  "MANAGE",
] as const;

export type PermissionModule = (typeof modules)[number];
export type PermissionAction = (typeof actions)[number];
export type Permission = `${PermissionModule}:${PermissionAction}`;

const view = (...items: PermissionModule[]): Permission[] =>
  items.map((item) => `${item}:VIEW` as Permission);
const manage = (...items: PermissionModule[]): Permission[] =>
  items.flatMap((item) =>
    actions.map((action) => `${item}:${action}` as Permission),
  );

const permissionsByRole: Record<UserRole, ReadonlySet<Permission>> = {
  ADMIN: new Set(manage(...modules)),
  FLEET_MANAGER: new Set([
    ...manage(
      "VEHICLES", "DRIVERS", "TRIPS", "INSPECTIONS", "MAINTENANCE",
      "TYRES", "FUEL", "EXPENSES", "DOCUMENTS", "ACCIDENTS",
    ),
    ...view("DASHBOARD", "REPORTS"),
  ]),
  INSPECTOR: new Set([
    ...view(
      "DASHBOARD", "VEHICLES", "TRIPS", "INSPECTIONS", "MAINTENANCE",
      "TYRES", "FUEL", "EXPENSES", "DOCUMENTS", "ACCIDENTS", "REPORTS",
    ),
    "INSPECTIONS:CREATE", "INSPECTIONS:APPROVE", "INSPECTIONS:UPLOAD",
  ]),
  DRIVER: new Set([
    ...view("DASHBOARD", "VEHICLES", "DRIVERS", "TRIPS"),
    "TRIPS:CREATE", "TRIPS:EDIT",
  ]),
  MAINTENANCE_STAFF: new Set([
    ...view("DASHBOARD", "VEHICLES", "MAINTENANCE", "TYRES", "DOCUMENTS"),
    ...manage("MAINTENANCE", "TYRES"),
    "DOCUMENTS:CREATE", "DOCUMENTS:UPLOAD",
  ]),
  FINANCE: new Set([
    ...view("DASHBOARD", "VEHICLES", "FUEL", "EXPENSES", "MAINTENANCE", "ACCIDENTS", "REPORTS"),
    "FUEL:CREATE", "FUEL:EDIT", "FUEL:UPLOAD",
    "EXPENSES:CREATE", "EXPENSES:EDIT", "EXPENSES:UPLOAD",
  ]),
  EMPLOYEE: new Set(view("DASHBOARD")),
};

export function can(role: UserRole, module: PermissionModule, action: PermissionAction = "VIEW") {
  return permissionsByRole[role].has(`${module}:${action}`);
}

export function allowedModules(role: UserRole) {
  return new Set(modules.filter((module) => can(role, module)));
}

export function roleLabel(role: UserRole) {
  return role === "ADMIN"
    ? "Super Admin"
    : role.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
