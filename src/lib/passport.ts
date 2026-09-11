export const PASSPORT_WARNING_DAYS = 30;

export type PassportStatus = "VALID" | "EXPIRING_SOON" | "EXPIRED" | "CANCELLED" | "RENEWAL_IN_PROGRESS" | "MISSING";

export function resolvePassportStatus(passport?: { expiryDate?: Date | string | null; status?: string | null } | null, now = new Date()): PassportStatus {
  if (!passport) return "MISSING";
  if (!passport.expiryDate) return "MISSING";

  const explicit = passport.status?.trim().toUpperCase().replace(/\s+/g, "_");
  if (explicit === "CANCELLED") return "CANCELLED";
  if (explicit === "RENEWAL_IN_PROGRESS") return "RENEWAL_IN_PROGRESS";

  const expiry = new Date(passport.expiryDate);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const expiryDay = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
  const daysRemaining = Math.ceil((expiryDay.getTime() - today.getTime()) / 86_400_000);

  if (Number.isNaN(expiry.getTime())) return "MISSING";
  if (daysRemaining < 0) return "EXPIRED";
  if (daysRemaining <= PASSPORT_WARNING_DAYS) return "EXPIRING_SOON";
  return "VALID";
}

export function passportStatusClassName(status: PassportStatus) {
  switch (status) {
    case "VALID":
      return "bg-emerald-50 text-emerald-700";
    case "EXPIRING_SOON":
    case "RENEWAL_IN_PROGRESS":
      return "bg-amber-50 text-amber-700";
    case "EXPIRED":
    case "CANCELLED":
      return "bg-red-50 text-red-700";
    case "MISSING":
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export function passportStatusLabel(status: PassportStatus) {
  return {
    VALID: "Valid",
    EXPIRING_SOON: "Expiring soon",
    EXPIRED: "Expired",
    CANCELLED: "Cancelled",
    RENEWAL_IN_PROGRESS: "Renewal in progress",
    MISSING: "Missing",
  }[status] ?? "Unknown";
}

export function summarisePassportRecords(passports: Array<{ expiryDate?: Date | string | null; status?: string | null }>, warningDays = PASSPORT_WARNING_DAYS) {
  const total = passports.length;
  let valid = 0;
  let expiringSoon = 0;
  let expired = 0;
  let missing = 0;

  for (const passport of passports) {
    const status = resolvePassportStatus(passport);
    if (status === "VALID") valid += 1;
    else if (status === "EXPIRING_SOON") expiringSoon += 1;
    else if (status === "EXPIRED") expired += 1;
    else if (status === "MISSING") missing += 1;
  }

  return { total, valid, expiringSoon, expired, missing, warningDays };
}
