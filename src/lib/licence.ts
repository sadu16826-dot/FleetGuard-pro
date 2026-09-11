export const LICENCE_TYPES = ["LEARNER", "PERMANENT", "COMMERCIAL", "INTERNATIONAL", "OTHER"] as const;
export const RENEWAL_STATUSES = ["NOT_STARTED", "APPLICATION_SUBMITTED", "UNDER_PROCESSING", "RENEWED", "REJECTED", "CANCELLED"] as const;
export const LICENCE_WARNING_DAYS = 90;

export type LicenceStatus = "VALID" | "EXPIRING_SOON" | "EXPIRED" | "SUSPENDED" | "RENEWAL_IN_PROGRESS" | "MISSING";

export function licenceStatus(licence?: { expiryDate: Date | string; renewalStatus?: string | null; operationalStatus?: string | null } | null, now = new Date()): LicenceStatus {
  if (!licence) return "MISSING";
  if (licence.operationalStatus === "SUSPENDED") return "SUSPENDED";
  if (["APPLICATION_SUBMITTED", "UNDER_PROCESSING"].includes(licence.renewalStatus ?? "")) return "RENEWAL_IN_PROGRESS";
  const expiry = new Date(licence.expiryDate);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const expiryDay = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
  const daysRemaining = Math.round((expiryDay.getTime() - today.getTime()) / 86_400_000);
  if (daysRemaining < 0) return "EXPIRED";
  if (daysRemaining <= LICENCE_WARNING_DAYS) return "EXPIRING_SOON";
  return "VALID";
}

export function daysUntilExpiry(value: Date | string, now = new Date()) {
  const expiry = new Date(value);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate()).getTime() - today.getTime()) / 86_400_000);
}

export function validLicenceDateRange(issueDate: Date, expiryDate: Date) {
  return !Number.isNaN(issueDate.getTime()) && !Number.isNaN(expiryDate.getTime()) && expiryDate >= issueDate;
}

export function licenceStatusClass(status: LicenceStatus) {
  if (status === "VALID") return "bg-emerald-50 text-emerald-700";
  if (status === "EXPIRING_SOON" || status === "RENEWAL_IN_PROGRESS") return "bg-amber-50 text-amber-700";
  if (status === "EXPIRED" || status === "SUSPENDED") return "bg-red-50 text-red-700";
  return "bg-slate-100 text-slate-700";
}
