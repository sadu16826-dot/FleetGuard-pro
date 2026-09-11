export type DriverStatus = "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "SUSPENDED" | "TERMINATED";

export const driverStatusLabels: Record<DriverStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  ON_LEAVE: "On Leave",
  SUSPENDED: "Suspended",
  TERMINATED: "Terminated",
};

export function driverStatusClassName(status?: string | null) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700";
    case "ON_LEAVE":
      return "bg-sky-50 text-sky-700";
    case "SUSPENDED":
      return "bg-amber-50 text-amber-700";
    case "TERMINATED":
    case "INACTIVE":
      return "bg-rose-50 text-rose-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export function documentExpiryStatus(date?: Date | string | null) {
  if (!date) return "MISSING" as const;
  const expiry = new Date(date);
  const msLeft = expiry.getTime() - Date.now();
  const days = Math.ceil(msLeft / 86400000);
  if (days < 0) return "EXPIRED" as const;
  if (days <= 14) return "DUE_SOON" as const;
  return "VALID" as const;
}

export function formatShortDate(value?: Date | string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
