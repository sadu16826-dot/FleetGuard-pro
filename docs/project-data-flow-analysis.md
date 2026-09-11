# FleetGuard Pro data-flow analysis

Date: 9 September 2026

## Root cause

The visible data problems did not come from incorrect Prisma relation names. The implemented schema uses `Vehicle.currentDriver`, `Vehicle.trips`, `Trip.driver`, `Trip.inspections`, `Service.vehicle`, `FuelRecord.vehicle`, and the application generally referenced those actual names.

The primary defect was inconsistent tenant and actor mapping after the proxy authenticated a request. The proxy only validated the development cookie. Many routes then queried by `id`/`vehicleId` without checking the authenticated user's `companyId`, vehicle creation hardcoded `development-company`, and audit records hardcoded `dev-admin`/`Sadu Admin`. This made creation dependent on a guessed company and allowed a valid session to address another company's vehicle-related records by changing route IDs.

Secondary confirmed defects:

- The Dashboard displayed hardcoded totals, trips, alerts, dates and activity; it had no database data flow.
- Partial vehicle PATCH requests converted omitted optional properties to `null`, which could erase unrelated saved fields.
- Issue submission accepted `currentKm` in the UI payload but stored the vehicle's previous odometer instead.
- Dashboard quick actions pointed at placeholder catch-all routes instead of existing pages.
- Driver Management additions appeared during the audit. Their Prisma schema is ahead of PostgreSQL, so default driver queries will fail until the generated additive migration is applied.

## Corrected data flow

`src/lib/access-control.ts` now resolves the existing session cookie to the persisted user, requires a company, applies ADMIN/FLEET_MANAGER write policy, and retrieves vehicles by both `Vehicle.id` and `companyId`. Implemented vehicle pages and APIs reuse it.

The corrected ownership flow is:

```text
session cookie -> persisted User -> User.companyId
                                  -> Vehicle.id + Vehicle.companyId
                                  -> child record vehicleId / tripId / serviceId / fuelRecordId
```

Vehicle creation now uses the authenticated user's company and user ID. Vehicle list/detail/edit, trip start/return/detail/photos, service, fuel, vehicle documents, issues, tyres and history validate the vehicle through this path. Child-record queries still use their real parent foreign keys after the vehicle ownership check.

The Dashboard now queries company-scoped vehicles, active trips, vehicle activities, service alerts and expiring vehicle-level documents. Service and fuel attachments remain excluded from compliance expiry counts.

Partial vehicle updates only clear an optional field when that key is explicitly present. Issue records use the submitted validated odometer and advance the vehicle odometer when appropriate.

## Database and Prisma

`.env` and `.env.local` both define `DATABASE_URL` and currently resolve to the same value. The URL itself was not printed.

Prisma validation and client generation pass. The live comparison showed:

- The additive vehicle record-document schema is present in PostgreSQL.
- `prisma/migrations/202609090002_driver_management/migration.sql` is required to align the newly present Driver profile/document/licence/passport/assignment schema with PostgreSQL. It is generated but unapplied because automatic approval review rejected the database mutation pending explicit confirmation that the target may be changed.

The Driver schema contains both legacy `Driver.licenseNumber/licenseExpiry` and a new one-to-one `DriverLicence`. That is duplicated license data and needs one authoritative write/read policy before licence-management APIs are built. The audit did not invent synchronization logic between them.

## Implemented versus placeholder modules

Database-backed and implemented: login gate, vehicle list/create/edit/detail, trip start/return with four pre/post photos and inspections, service records, fuel records, vehicle documents/attachments, issues, tyres, vehicle activity/history, and a company-scoped dashboard.

Partially implemented: driver list/create/read/update files exist and are company-scoped. The database migration is not applied, there is no driver detail page, and no assignment UI/API.

Not implemented: licence, passport, driver-document and driver-performance workflows; accident creation/edit APIs; general inspection-management pages; global trip/maintenance/fuel/expense modules. Their navigation currently falls through to the explicit Phase 3 placeholder page. These were not represented with fake data.

Two old static dashboard components remain in the source tree but are no longer imported by the Dashboard. They were left untouched to avoid deleting unrelated code.

## Verification

- `npx prisma validate`: passed.
- `npx prisma generate`: passed.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed.
- `node --test tests/*.test.cjs`: 8 tests passed.
- `npx next build --webpack`: passed after the final access-control and database-backed Dashboard edits.
- Live Chrome/PostgreSQL document suite: passed all service, fuel, vehicle-document, authorization, isolation, validation, replacement, deletion and rollback checks; fixtures cleaned up.
- Start/return trip and driver browser tests are blocked by the unapplied Driver migration because Prisma currently expects driver columns absent from PostgreSQL.

## Business logic preserved

Trip status claiming and serializable transaction behavior, required four-view photos, return distance validation, vehicle safety status transitions, service/fuel odometer rules, service/fuel cost behavior, tyre history, document expiry logic and VehicleActivity auditing remain in place. Changes were limited to actor/company mapping, explicit partial-update semantics, the ignored issue odometer, protected attachments, and replacing static Dashboard data.
