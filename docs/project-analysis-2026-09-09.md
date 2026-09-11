# FleetGuard Pro project analysis — 9 September 2026

## Scope and outcome

Reviewed the existing Next.js App Router application, Prisma schema, connected PostgreSQL structure, driver/licence handlers, authentication, and available workflows. Continued the requested non-destructive schema synchronization. No application business logic or schema definitions were changed in this run.

The initial database inspection confirmed that `drivers.employee_id` and the driver licence tables were absent. Prisma CLI and Next.js resolve the same database URL; no credentials were changed or included in this report. No equivalent employee column or differently named licence table existed.

The repository documents `db:generate` and `db:push`, and contains SQL migration files including driver-management changes. The database had not reflected those changes at the initial inspection. The previous synchronization attempt was blocked by approval review. With the new authorization, `npx prisma db push` completed successfully, reporting that the database was already synchronized by the time it finished. A fresh Prisma diff independently confirmed an empty migration. Other workspace/database activity occurred during this review, so this run cannot claim exclusive authorship of the synchronization.

## Database changes observed

Compared with the initial inspection, the synchronized schema contains:

- New tables: `driver_documents`, `driver_licences`, `driver_licence_documents`, `driver_passports`, `driver_assignments`.
- Nullable columns on `drivers`: `address`, `date_of_birth`, `department`, `designation`, `emergency_address`, `emergency_alternate_phone`, `emergency_contact_name`, `emergency_phone`, `emergency_relationship`, `employee_id`, `employment_type`, `gender`, `joining_date`, `profile_photo_url`.
- `DriverStatus` values: `ON_LEAVE`, `TERMINATED`.
- Indexes: unique driver employee ID; driver document driver/expiry; licence driver/current and licence number; licence document licence/current and driver; unique passport driver and passport number; assignment driver/status and vehicle/status.
- Foreign keys: documents to driver/uploader; licences to driver/previous licence; licence documents to licence/driver/uploader; passports to driver; assignments to driver/vehicle.

The existing `Driver` primary key remains the relation key. Employee IDs remain nullable; no business values were invented. Company-scoped driver and licence queries remain in place. Licence list queries select document metadata rather than file bytes.

## Data preservation

No reset, drop, delete, fake driver creation, or licence backfill was executed by this run. All 18 original table row counts were retained, including 3 drivers, 6 vehicles, 8 trips, 24 trip photos, and 39 vehicle activities. All three requested driver IDs remain present.

Fingerprints of original columns matched for 16 tables. Driver and user fingerprints differed while their counts remained unchanged. One normalized licence appeared for Development Test Driver during the work; this run did not create it. Concurrent activity prevents claiming that all field values were unchanged. Amal and Trip Photo Test Driver had no normalized licence records at the final database read. This is a data-completeness issue, not a reason to manufacture issue dates or categories.

## Architecture and priority findings

1. **Authentication is development-only.** `src/lib/auth.ts` validates fixed credentials and accepts a predictable session string. `src/lib/access-control.ts` resolves a fixed admin user. Cookie flags do not make that session cryptographically authenticated. This must be replaced before using the app as a production multi-company service.

2. **Licence data has two write paths.** `src/app/api/drivers/route.ts` creates only legacy `licenseNumber`/`licenseExpiry` fields. The driver PATCH handler updates those fields without synchronizing `DriverLicence`. Licence handlers update both models transactionally. Consequently, driver creation can leave Licence Management empty, and editing a driver's legacy fields can diverge from the normalized licence. The workflow needs an explicit source-of-truth decision and real missing data before backfilling.

3. **Partial licence edits can erase omitted data.** The PATCH handler in `src/app/api/licences/[id]/route.ts` converts omitted optional authority/location/date/notes values to null and defaults omitted operational status to ACTIVE. A partial edit can therefore clear information or reactivate a suspended licence. This is an existing behavior found in review, not changed in the synchronization task.

4. **Driver profile editing is incomplete.** The schema supports employee ID, profile photo, emergency contacts and other fields, but the inspected driver POST/PATCH handlers only persist the basic legacy profile fields. There is no dedicated driver edit page in the reviewed route set. Having a column does not establish a complete UI workflow.

5. **Validation and concurrency need broader coverage.** Driver date inputs are converted to Date objects without rejecting invalid dates before Prisma. Licence duplicate checks occur before the write transaction and there is no database uniqueness constraint limiting one current licence per driver. Concurrent submissions deserve dedicated tests and an explicit invariant design.

6. **Module maturity varies.** Vehicle, driver, licence, passport and performance routes exist. The dashboard catch-all still renders a “Module prepared” placeholder for unimplemented sections. Document and assignment relations alone do not demonstrate complete driver document/upload and assignment editing workflows.

7. **Schema deployment needs discipline.** Keep generated client, deployed schema, and application restart coordinated. The current README uses db push while SQL migration files also exist; document which process each environment uses. Do not assume migration files have been deployed merely because they are present.

These are local code findings, not a dependency vulnerability audit or an exhaustive security assessment. They were left unchanged to preserve the requested scope.

## Validation

- Prisma validation: passed.
- Prisma generation: passed as part of db push; both driver and driverLicence delegates work.
- Database synchronization: command succeeded; final schema diff empty.
- Direct company-scoped driver query including licence, trip, vehicle, document and assignment relations: passed for all three existing drivers.
- Automated tests: 19 passed.
- ESLint: passed.
- Default production build: failed on Turbopack's worker-port permission restriction in this environment.
- Webpack production build: passed, including TypeScript.
- Development server: stopped before building, then restarted using `npm run dev`.

Browser checks returned HTTP 200 without application error screens for Dashboard, Vehicles, Vehicle Documents, Vehicle History, Drivers, Add Driver, Licence Management, Passports, Performance, all three driver profiles, and the existing licence detail/edit screens. Driver and licence GET APIs returned 200. The returned licence maps by database driver ID to Development Test Driver. Invalid create and edit requests for drivers and licences returned 400; unauthenticated requests to both APIs returned 401.

Successful add/edit writes were not performed against real records merely for testing. Driver-document uploads, assignment changes, and trip start/return mutations were not retested end to end. The sole authored repository file in this run is this report; generated Prisma output was refreshed through Prisma. Existing and concurrent source changes were preserved.
