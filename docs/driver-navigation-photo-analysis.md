# Driver details navigation and profile-photo analysis

Date: 9 September 2026

## Root cause

The Drivers list already navigated with the correct database identifier:

```tsx
href={`/dashboard/drivers/${driver.id}`}
```

No list link or router call used `profilePhotoUrl`, a filename, driver name, array index or frontend-generated identifier. The actual navigation failure was the absence of `src/app/dashboard/drivers/[id]/page.tsx`. Requests for `/dashboard/drivers/{driverId}` therefore fell through to the generic `src/app/dashboard/[...section]/page.tsx` Phase 3 placeholder instead of loading a driver record.

The Prisma field for the image is `Driver.profilePhotoUrl`. There was no Driver Details image component and no driver photo upload/storage code. No CSS rotation, image transformation, EXIF processing library or `next/image` mapping existed, so an orientation defect could not be reproduced or attributed to this repository.

## Fix

- Added the missing specific Driver Details route under the existing `/dashboard/drivers/[id]` architecture.
- The route reads the path `id`, resolves the authenticated user's company, and queries `Driver` with both `id` and `companyId`.
- `driver.profilePhotoUrl` is used only as `<img src>`. It never controls navigation and is not wrapped in a link.
- An initials placeholder appears when the selected driver has no profile photo.
- Existing driver information, assignment relations and recent trip relations are rendered from the selected driver record.
- Extended the existing `GET /api/drivers/[id]` response with the selected driver's current/primary vehicles and trips. The API remains scoped by driver ID and company ID.

## Data flow

```text
driver row/name
  -> /dashboard/drivers/{driver.id}
  -> route params.id
  -> authenticated User.companyId
  -> Driver where { id, companyId }
  -> driver.profilePhotoUrl
  -> profile <img src>
```

## Database state

A read-only query confirmed that an `amal` driver record exists. PostgreSQL does not currently contain `drivers.profile_photo_url`; the Prisma schema and generated client do. The prepared additive driver migration remains unapplied after automatic approval review rejected the database mutation. No driver record was modified.

Because this column mismatch makes Prisma's Driver queries fail at runtime, the live Amal/second-driver browser validation is blocked until `prisma/migrations/202609090002_driver_management/migration.sql` is explicitly approved and applied.

## Files changed for this fix

- `src/app/dashboard/drivers/[id]/page.tsx`
- `src/app/api/drivers/[id]/route.ts`
- `tests/driver-navigation.test.cjs`
- This report.

## Verification

- Static regression checks confirm list navigation uses `driver.id`, the detail query uses `id + companyId`, the profile photo is only an image source, and no fixed rotation/flip is present.
- Full project unit suite: 11 tests passed, including three navigation/photo mapping regressions.
- Prisma validation: passed.
- TypeScript and lint: passed.
- Production build with Webpack: passed and includes `/dashboard/drivers/[id]` as a dynamic route.
- Live browser navigation and image correctness: blocked by the unapplied Driver migration.

Existing driver creation/editing/status, licence/passport/performance placeholders, vehicle assignment relations, trips, authentication, permissions, sidebar and visual system were not redesigned by this fix.
