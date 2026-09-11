# Vehicle record documents — implementation report

Status: vehicle service, fuel and compliance-document attachment flows are implemented and passed the live browser/database acceptance suite on 9 September 2026.

| Area | Result |
| --- | --- |
| Architecture inspected | Next.js App Router, Prisma/PostgreSQL, vehicle actions, record editors, detail tabs, fleet Documents/History pages, API routes, proxy, development authentication, activity logging and SQL migration files. |
| Existing storage | Trip photos already use PostgreSQL `Bytes` and authenticated response endpoints. General documents previously accepted manually entered URLs; no external object-storage provider is configured. |
| Existing models | Extended `VehicleDocument`; reused `Vehicle`, `Service`, `FuelRecord`, `User` and `VehicleActivity`. No competing attachment model or storage provider. |
| Root causes | No service attachment relationship, fuel receipt URL only, manual document URL/MIME/size input, static fleet Documents/History pages, and replacement PATCH could clear omitted dates. |
| Database / Prisma changes | Nullable service/fuel relationships, original filename, MIME, size, bytes and uploader FK; additional document types. Composite parent/vehicle FKs prevent cross-vehicle mappings. SQL CHECK prevents both service and fuel being populated. Existing records remain intact. |
| Migration | `202609090001_record_documents/migration.sql` was compared against the live schema and applied using `prisma db execute`, consistent with this repository's SQL/db-push setup. No reset or data deletion. It was not registered through `migrate deploy`; the repository does not have a complete baseline migration history. |
| APIs | Extended existing service/fuel POSTs to accept multipart forms while retaining JSON input. Existing document collection/item endpoints now support real uploads, protected GET preview/download, metadata editing, file replacement and deletion. Service/fuel attachment requests require their matching context query parameter. |
| UI | Reusable selectors with preview/replace/remove, per-file types, up to five service/fuel attachments, service links in Maintenance, fuel links in Operations/Expenses, compliance documents kept separate, responsive existing forms and router refresh. |
| Storage changes | File bytes save in the same transaction as the parent record and activity. Stored URLs point to protected application endpoints with record context. List projections exclude bytes. Replacement overwrites bytes in the same document; the existing system has no versioning. |
| Validation | Client/server extension, MIME and 10 MB per-file limits; server magic-byte checks; five-file limit; context-specific types; document date ordering. Next proxy buffer raised to 52 MB for valid multipart batches; malformed/oversized forms return friendly errors. |
| Authorization | Validates the existing development session against its persisted user and company. Read queries check vehicle ownership and the document's exact vehicle/service/fuel context. Upload/edit/remove require ADMIN or FLEET_MANAGER. Existing login remains development-only, not production authentication. |
| Service relationship | `VehicleDocument.vehicleId` plus `serviceId`; `fuelRecordId` null. Parent and attachment writes are transactional. |
| Fuel relationship | `VehicleDocument.vehicleId` plus `fuelRecordId`; `serviceId` null. Supports fuel bills and electric charging receipts/invoices. |
| Vehicle relationship | `VehicleDocument.vehicleId`; both business-record IDs null. Only these appear in compliance document lists and summary queries. |
| History | Reuses VehicleActivity. Service/fuel creation includes attachment count and parent ID in metadata, without a separate event per initial file. Explicit document edit/replace/delete uses existing audit actions. Fleet History now reads actual company activity. |
| File metadata | Document ID, sanitized/original filename, MIME, byte size, protected URL, document type, uploader ID/name and creation time. Existing `createdAt` records initial upload time; replacement retains the record's original creation time and updates `updatedAt`. |

## Modified files

- `next.config.ts`
- `prisma/schema.prisma`
- `prisma/migrations/202609090001_record_documents/migration.sql`
- `src/lib/document-upload.ts`, `src/lib/document-server.ts`
- `src/app/api/vehicles/route.ts`, `src/app/api/vehicles/[id]/route.ts`
- `src/app/api/vehicles/[id]/documents/route.ts`, `src/app/api/vehicles/[id]/documents/[documentId]/route.ts`
- `src/app/api/vehicles/[id]/services/route.ts`, `src/app/api/vehicles/[id]/services/[serviceId]/route.ts`
- `src/app/api/vehicles/[id]/fuel/route.ts`
- `src/app/vehicles/page.tsx`, `src/app/vehicles/[id]/page.tsx`
- `src/app/vehicles/documents/page.tsx`, `src/app/vehicles/history/page.tsx`
- `src/components/vehicles/vehicle-actions.tsx`, `src/components/vehicles/vehicle-record-actions.tsx`
- `src/components/vehicles/document-file-fields.tsx`, `src/components/vehicles/record-attachments.tsx`
- `tests/document-upload.test.cjs`, `tests/document-api.test.cjs`, `tests/document-flow.cjs`
- This report. Prisma Client regenerated in the existing ignored output directory.

## Verification

- `npx prisma validate`: passed.
- `npx prisma generate`: passed.
- Live schema comparison and additive SQL execution: succeeded.
- `node --test tests/document-upload.test.cjs tests/document-api.test.cjs`: five groups passed. Covers file validation, actual document handlers with mocked database/cookies, metadata-preserving replacement, byte-correct download, unauthorized and wrong-context requests, deletion/auditing, safe failure handling, and service/fuel parsing.
- `npm run lint`, `npx tsc --noEmit`: passed.
- `npx next build --webpack`: passed. Default Turbopack build failed because its CSS worker could not bind a port in this environment, including on an escalated retry.
- `node tests/document-flow.cjs`: passed after the transient Neon connection recovered. Chrome created service records with two attachments, an electric charging record with a receipt, and a vehicle insurance document. It verified Maintenance/Operations/Documents rendering, exact stored/downloaded bytes, metadata-preserving replacement, reload persistence, mobile form visibility, cross-vehicle/cross-company/wrong-context/unauthenticated denial, invalid and oversized file rejection, transaction rollback, relational constraints, confirmed deletion and activity metadata. All temporary fixtures were removed.

## Remaining acceptance work

The saved suite can be rerun against a reachable development database and built local app. It creates isolated vehicles and a second company and removes its own fixtures afterward.

Temporary test tools were installed under `/tmp/fleetguard-document-tests` without changing application dependencies. The suite accepts `PLAYWRIGHT_MODULE` to specify another Playwright installation and `DOCUMENT_TEST_URL` for the running app (default `http://localhost:3107`). Its Chrome executable path currently targets this Mac's installed Google Chrome.

```sh
npm run start -- --port 3107
# In another terminal with database network access:
node tests/document-flow.cjs
```

Legacy URL-only records retain their metadata and original URL in the database. Their bytes cannot be served through the protected endpoint until a file is uploaded using Replace; no untrusted server-side URL fetching or public-URL bypass was introduced. Legacy `FuelRecord.receiptUrl` values remain untouched and are not automatically migrated into attachments.

For other databases, apply the additive SQL once against the existing schema. A plain `prisma db push` does not install the custom CHECK constraint; preserve that constraint when provisioning or migrating. Existing development-only authentication remains a separate limitation.
