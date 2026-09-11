# Licence Management implementation

## Architecture and root cause

The sidebar already linked to `/dashboard/drivers/licences`, but the route had no concrete page and was handled by the generic dashboard placeholder. The pending driver-management schema contained `DriverLicence`, but its unique `driverId` relation allowed only one record per driver, so renewal would overwrite history. It also represented files as URLs, while the vehicle document module established PostgreSQL byte storage behind authenticated route handlers.

Licence records now relate to drivers by `Driver.id`. A driver has many licence records; `isCurrent` selects the operational record and `previousLicenceId` links renewals. Existing required `Driver.licenseNumber` and `Driver.licenseExpiry` columns remain compatibility fields and are updated in the same transaction. Licence Management uses `DriverLicence` as its authoritative record.

## Delivered behavior

- Database-backed totals for current licences, valid, expiring within 90 days, expired, and drivers missing a licence.
- Search by driver name, employee ID, or licence number; status, type, and expiry-window filters.
- Add Licence form populated only from company-scoped persisted drivers.
- Company-scoped list, detail, create, edit, renew, document upload, view, download, replace, and delete endpoints.
- Deterministic status logic in `src/lib/licence.ts`, including suspended and renewal-in-progress states.
- Renewal creates a new record, marks the former record historical, and links both records.
- Versioned document replacement. PDF/JPG/PNG/WEBP content is size, extension, MIME, and signature checked; bytes stay in PostgreSQL and are returned with private, no-store headers.
- Licence details link to the persisted driver ID, and Driver Details links back to the current licence ID.
- Existing trip and assignment policy was not changed. No separate vehicle-assignment module exists. Licence state is available for a future explicit blocking or warning policy.

## Migration

The minimum additive tables and driver fields are defined in `prisma/migrations/202609090002_driver_management/migration.sql`. This pending migration was not applied to the configured database because its environment has not been independently confirmed as development-only. No reset or destructive migration command was used.

## Verification

- `npx prisma validate`: passed
- `npx prisma generate`: passed
- `npx tsc --noEmit`: passed
- `npm run lint`: passed
- `node --test tests/*.test.cjs`: passed
- `npm run build -- --webpack`: passed

Live creation for Amal, Development Test Driver, and Trip Photo Test Driver requires applying the pending migration first. The automated tests verify status boundaries and that create, renewal, and document writes use database driver/licence IDs.
