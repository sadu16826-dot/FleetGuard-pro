const driverStatusLabels = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  ON_LEAVE: 'On Leave',
  SUSPENDED: 'Suspended',
  TERMINATED: 'Terminated',
};

function driverStatusClassName(status) {
  switch (status) {
    case 'ACTIVE':
      return 'bg-emerald-50 text-emerald-700';
    case 'ON_LEAVE':
      return 'bg-sky-50 text-sky-700';
    case 'SUSPENDED':
      return 'bg-amber-50 text-amber-700';
    case 'TERMINATED':
    case 'INACTIVE':
      return 'bg-rose-50 text-rose-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

function documentExpiryStatus(date) {
  if (!date) return 'MISSING';
  const expiry = new Date(date);
  const msLeft = expiry.getTime() - Date.now();
  const days = Math.ceil(msLeft / 86400000);
  if (days < 0) return 'EXPIRED';
  if (days <= 14) return 'DUE_SOON';
  return 'VALID';
}

function formatShortDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

module.exports = {
  driverStatusLabels,
  driverStatusClassName,
  documentExpiryStatus,
  formatShortDate,
};
