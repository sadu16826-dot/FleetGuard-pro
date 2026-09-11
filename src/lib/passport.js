const PASSPORT_WARNING_DAYS = 30;

function cleanStatus(value) {
  return typeof value === 'string' ? value.trim().toUpperCase().replace(/\s+/g, '_') : '';
}

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getDaysRemaining(expiryDate, now = new Date()) {
  if (!expiryDate) return null;
  const expiry = toDate(expiryDate);
  if (!expiry) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const expiryDay = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
  return Math.ceil((expiryDay.getTime() - today.getTime()) / 86_400_000);
}

function resolvePassportStatus(passport, now = new Date()) {
  if (!passport) return 'MISSING';
  if (!passport.expiryDate) return 'MISSING';

  const explicitStatus = cleanStatus(passport.status);
  if (explicitStatus === 'CANCELLED') return 'CANCELLED';
  if (explicitStatus === 'RENEWAL_IN_PROGRESS') return 'RENEWAL_IN_PROGRESS';

  const daysRemaining = getDaysRemaining(passport.expiryDate, now);
  if (daysRemaining === null) return 'MISSING';
  if (daysRemaining < 0) return 'EXPIRED';
  if (daysRemaining <= PASSPORT_WARNING_DAYS) return 'EXPIRING_SOON';

  return 'VALID';
}

function passportStatusClassName(status) {
  switch (status) {
    case 'VALID':
      return 'bg-emerald-50 text-emerald-700';
    case 'EXPIRING_SOON':
    case 'RENEWAL_IN_PROGRESS':
      return 'bg-amber-50 text-amber-700';
    case 'EXPIRED':
    case 'CANCELLED':
      return 'bg-red-50 text-red-700';
    case 'MISSING':
      return 'bg-slate-100 text-slate-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

function passportStatusLabel(status) {
  return {
    VALID: 'Valid',
    EXPIRING_SOON: 'Expiring soon',
    EXPIRED: 'Expired',
    CANCELLED: 'Cancelled',
    RENEWAL_IN_PROGRESS: 'Renewal in progress',
    MISSING: 'Missing',
  }[status] ?? 'Unknown';
}

function summarisePassportRecords(passports, warningDays = PASSPORT_WARNING_DAYS) {
  const total = passports.length;
  let valid = 0;
  let expiringSoon = 0;
  let expired = 0;
  let missing = 0;

  for (const passport of passports) {
    const status = resolvePassportStatus(passport);
    if (status === 'VALID') valid += 1;
    else if (status === 'EXPIRING_SOON') expiringSoon += 1;
    else if (status === 'EXPIRED') expired += 1;
    else if (status === 'MISSING') missing += 1;
  }

  return {
    total,
    valid,
    expiringSoon,
    expired,
    missing,
    warningDays,
  };
}

module.exports = {
  PASSPORT_WARNING_DAYS,
  resolvePassportStatus,
  passportStatusClassName,
  passportStatusLabel,
  summarisePassportRecords,
};
