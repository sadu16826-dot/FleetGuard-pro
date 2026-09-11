# FleetGuard Pro
## User Manual

**Audience:** Fleet administrators, fleet managers, drivers, inspectors, maintenance staff, and finance users  
**System scope:** Company-scoped fleet operations and records

> This manual describes the functionality currently implemented in FleetGuard Pro. The application currently defines four system roles: `ADMIN`, `FLEET_MANAGER`, `DRIVER`, and `EMPLOYEE`. Job titles such as Inspector, Maintenance Staff, and Finance/Accounts are operating responsibilities; they are not separate database roles today.

## 1. Introduction

FleetGuard Pro keeps vehicle, driver, trip, inspection, maintenance, tyre, fuel, expense, accident, document, and activity records in one place. It is intended to help a company operate a small fleet safely while preserving a traceable history for every vehicle.

The system is company-scoped: users, vehicles, and drivers belong to a company, and operational pages query records through the selected vehicle or driver ID. A vehicle name or registration number is displayed for convenience, but it is not the relationship key.

## 2. System overview

The main navigation contains:

- Dashboard
- Vehicle Management
- Driver Management
- Vehicle Operations
- Inspection Management
- Maintenance Management
- Tyre & Wheel Management
- Fuel Management
- Expense Management
- Document & Compliance
- Accident Management
- Reports & Analytics
- User Management
- Settings

Use the Dashboard for a quick operational view. Use the module pages when creating, reviewing, or correcting a record.

## 3. User roles and responsibilities

### Administrator (`ADMIN`)

The administrator is the broadest operational role. Use it to manage company users, fleet records, drivers, documents, and settings. Administrator users can perform protected write operations and review company-wide records.

### Fleet Manager (`FLEET_MANAGER`)

The Fleet Manager coordinates day-to-day fleet work: vehicle status, driver assignments, trips, inspections, maintenance, tyres, fuel, costs, documents, accidents, and reports. The application permits this role to perform protected fleet changes.

### Driver (`DRIVER`)

The Driver role represents a person operating a vehicle. Driver records are separate from User records. A driver may be linked to trips, vehicle assignments, fuel records, inspections, accidents, licence records, passport records, and driver documents. The current shared access helper restricts protected write operations to `ADMIN` and `FLEET_MANAGER`; confirm any driver-facing workflow against the page or action that is enabled for the account.

### Employee (`EMPLOYEE`)

Employee is an available system role for company users who do not need administrator or fleet-manager privileges. The current access helper allows authenticated reads but does not permit protected fleet writes for this role.

### Inspector, maintenance, and finance responsibilities

These are useful operating assignments, not separate roles in the current schema. An organisation can assign the work to an administrator, fleet manager, driver, or employee according to its own policy. Do not assume that a user automatically receives a special Inspector, Maintenance, or Finance permission.

## 4. Login and access

1. Open FleetGuard Pro and sign in.
2. The application checks the session cookie.
3. The signed-in user is loaded from the `User` record.
4. The user must be associated with a company to access company records.
5. Protected changes require the appropriate role.

If the database is temporarily unavailable, use the page retry action and notify the system administrator. Do not create duplicate records while retrying a submission.

## 5. Dashboard

The Dashboard shows the current company fleet overview:

- Total and available vehicles
- Active trips
- Maintenance alerts
- Expiring vehicle documents
- Vehicle status distribution
- Recent active trips
- Recent vehicle activity

The data is read from current database records. It is not sample data. If the Dashboard cannot load, retry after checking the database connection; do not treat an empty screen as proof that records are missing.

## 6. Vehicle Management

### Vehicles

Use **Vehicle Management → Vehicles** to view the fleet, open a vehicle record, edit details, and access vehicle-level records.

When registering or editing a vehicle, maintain the vehicle identity and operating information, including vehicle name, code, registration number, type, make/model, fuel type, ownership, odometer, service dates, and status.

### Vehicle Registration

Use **Vehicle Management → Vehicle Registration** to review registration fields such as registration number, registration date, RC number, owner, authority, and status. The page links each row to the actual vehicle ID.

Deactivation is not deletion. The current action preserves the vehicle and related historical records and can display inactive records separately.

### Vehicle Documents

Vehicle documents are linked to the selected vehicle. The system supports document types such as RC, insurance, pollution certificate, fitness certificate, permit, tax, warranty, finance, service, fuel, and other records. Store issue and expiry dates where applicable.

### Vehicle History

Vehicle history brings together activity and operational records associated with one vehicle. Review it after trips, inspections, repairs, tyre work, fuelling, document changes, and issue resolution.

## 7. Driver Management

Driver Management contains:

- Drivers
- Licence Management
- Passport Management
- Driver Performance

A driver is a separate `Driver` record, even when the person also has a `User` account. Driver records hold contact, employment, emergency, licence, status, assignment, trip, fuel, inspection, and accident information.

Licence records support current licences, renewal history, licence documents, issue/expiry dates, category, authority, and operational status. Passport records and driver documents are linked to the driver ID.

## 8. Vehicle Operations

Vehicle Operations manages the trip lifecycle:

1. Select the vehicle and driver.
2. Enter the trip purpose, start location, destination, date, and expected return where applicable.
3. Record the starting odometer reading.
4. Complete the pre-trip vehicle photo set when requested.
5. Start the trip.
6. On return, record the ending odometer reading and return condition.
7. Add post-trip photos and return remarks when required.
8. Record new damage, an accident, tyre trouble, warning lights, or mechanical problems when applicable.
9. Complete the trip and review the vehicle history.

Trip records retain the vehicle ID and driver ID. Trip photos retain the trip, vehicle, driver, uploader, phase, and photo type.

## 9. Inspection Management

### Vehicle Details

Inspection Management loads existing vehicles from Vehicle Management. An inspection can record vehicle and driver context, inspection type, odometer readings, fuel level, tyre condition, damage condition, lights, indicators, mirrors, warning lights, mechanical problems, notes, and photos.

### Daily inspection workflow

1. Open **Inspection Management → Vehicle Details**.
2. Select the vehicle.
3. Review the vehicle's previous history.
4. Check tyres, pressure, lights, indicators, mirrors, warning lights, and visible damage.
5. Record the odometer and fuel level.
6. Choose the result/status and add notes.
7. If there is evidence, upload the available photos/files.
8. Submit the inspection.

An approved inspection records the result and remarks. An issue inspection records the issue details and evidence for follow-up. Each submission creates a separate `Inspection` record; previous inspections are not overwritten.

### Vehicle History

Use **Inspection Management → Vehicle History** to review vehicle, date/time, inspector, status, remarks, and evidence. Inspection evidence is linked by inspection ID and vehicle ID.

## 10. Maintenance Management

Maintenance Management contains Service Schedule, Service History, and Repair Management.

A service record belongs to a vehicle and includes service type, date, odometer, cost, provider/service centre, parts and labour cost, notes, status, and next service date or odometer. Service attachments are linked to the service and vehicle.

Use the schedule to identify due work, the history to review completed services, and repairs to record work required for a vehicle. Update the next service information after the work is completed.

## 11. Tyre & Wheel Management

The Tyre & Wheel area contains:

- Tyre Inventory
- Vehicle Tyres
- Tyre Inspection
- Tyre History
- Wheel Alignment
- Wheel Balancing

Tyre records are linked to a vehicle and include position, brand, model/size, serial number, installation date and odometer, pressure, condition, status, replacement date/odometer, and cost. Tyre history records actions and descriptions against the tyre ID.

For a tyre problem: inspect the tyre, record pressure/condition/damage, update the status, perform alignment or balancing where required, and record replacement details. Keep the old tyre history rather than replacing it with a new unrelated record.

## 12. Fuel Management

Fuel Entry records the vehicle, optional driver, date, current odometer, litres, amount, fuel type, price per unit, station, payment method, receipt, and notes. Fuel History preserves entries for the selected vehicle. Fuel Analytics uses the stored fuel records for consumption and cost review.

## 13. Expense Management

Expense Management contains Expenses, Bills, and Cost Analysis. An expense is associated with a vehicle and records category, amount, date, and optional invoice link. Use the vehicle ID selected by the application; do not associate an expense by typing a vehicle name into a free-text field.

The Reports page also totals recorded fuel, maintenance, and other fleet expenses. Approval and payment-status workflows are not represented as fields in the current `Expense` model and should not be promised as system functionality.

## 14. Document & Compliance

Document & Compliance contains vehicle documents, driver documents, and expiry alerts.

1. Open the correct vehicle or driver record.
2. Choose the document type.
3. Enter the document name/number and issue/expiry dates where available.
4. Upload the file through the relevant record.
5. Review the document and expiry alert list.
6. When renewed, upload the new document and retain the previous record according to company policy.

Expiry alerts identify vehicle and driver documents by expiry date and show whether they are valid, expiring soon, or expired.

## 15. Accident Management

Accident records require a vehicle, driver, description, location, date, and status. Use Accident Reports to record the event and Damage Reports or related maintenance records for follow-up. The current schema supports `REPORTED`, `INVESTIGATING`, and `RESOLVED` statuses.

The operational sequence is:

1. Report the accident immediately.
2. Record the correct vehicle and driver.
3. Add the location, date, and description.
4. Review damage and create the required maintenance work.
5. Track the record until it is resolved.

Insurance claim tracking is present in navigation terminology but is not represented by a separate claim model in the current Prisma schema. Do not treat it as a fully implemented workflow without a corresponding screen or record.

## 16. Reports & Analytics

Reports & Analytics is a read-only management overview of current records. It currently reports vehicle and driver counts, active and maintained vehicles, trip counts, inspection counts and statuses, open accidents, expiring documents, fuel totals, maintenance totals, other expenses, and total recorded costs.

The current Reports page does not expose a general date-range filter or verified PDF/Excel/CSV export action. Those should not be listed as available features until implemented.

## 17. User Management

User Management lists company users, email, role, account state as authentication-managed, and creation date. A **system user** authenticates into FleetGuard Pro and has a `User` ID, company, and role. A **driver** is an operational person with a `Driver` ID and driver-specific records. They can refer to the same person, but the records are not interchangeable.

## 18. Settings

Settings is available from the dashboard navigation and is company-scoped. Use it for settings exposed by the current Settings page. Do not use Settings as a substitute for creating vehicles, trips, inspections, services, or expenses; operational records belong in their own modules.

## 19. Daily operating procedure

### Morning inspection

1. Log in.
2. Open Inspection Management.
3. Select the vehicle.
4. Review previous history.
5. Perform the checks.
6. Approve the vehicle or report an issue.
7. Upload evidence when needed.
8. Submit and confirm the inspection appears in history.

### Before a trip

1. Select the assigned vehicle and driver.
2. Enter the trip details.
3. Record starting kilometres.
4. Complete the pre-trip photos.
5. Start the trip.

### After a trip

1. Open the active trip.
2. Record ending kilometres and return condition.
3. Upload return photos.
4. Record damage or other problems.
5. Complete the return.

### When a problem occurs

1. Stop using the vehicle if it is unsafe.
2. Report the issue or inspection finding.
3. Attach clear evidence.
4. Notify the Fleet Manager.
5. Create or update the maintenance record.
6. Record the resolution and preserve the vehicle history.

## 20. Vehicle lifecycle

```text
Vehicle Registration
        ↓
Driver Assignment
        ↓
Daily Inspection
        ↓
Start Trip
        ↓
Trip and Vehicle Photos
        ↓
Return Vehicle
        ↓
Post-trip Condition
        ↓
Issue, Damage, or Accident (if applicable)
        ↓
Maintenance / Tyre / Fuel / Expense Records
        ↓
Documents and Compliance
        ↓
Reports and Vehicle Activity History
```

Every step should use the existing vehicle ID. This keeps the vehicle's operational history connected even when its status changes.

## 21. Issue handling

### Tyre problem

Report the issue → inspect the tyre → record pressure, damage, and status → perform maintenance or replacement → update tyre history.

### Vehicle damage

Report it during inspection or return → upload evidence → record a vehicle issue or accident when appropriate → arrange maintenance → record resolution.

### Accident

Create an accident report → record vehicle, driver, date, location, and description → assess damage → arrange repair → update accident status.

### Document expiry

Open Expiry Alerts → identify the vehicle or driver → renew the document → upload the new document → confirm the new expiry date.

## 22. Vehicle history and data relationships

The primary relationship chain is:

```text
Company
  ├─ Users ── authentication, roles, uploaded records, activity
  ├─ Vehicles ── trips, inspections, services, tyres, fuel, expenses,
  │              documents, issues, accidents, activity, photos
  └─ Drivers ── assignments, trips, inspections, fuel, accidents,
                licences, passports, documents, performance data
```

The database uses IDs and foreign-key relationships:

- `Vehicle.id` links vehicle operations and history.
- `Driver.id` links assignments, trips, fuel, inspections, and accidents.
- `Trip.id` links trip photos and optional inspections.
- `Inspection.id` links inspection evidence.
- `Service.id` and `FuelRecord.id` can link related vehicle documents.
- `Tyre.id` links tyre history.
- `User.id` identifies the authenticated user, uploader, inspector, and activity actor.

Do not create a second vehicle record because a registration number changed. Edit the existing vehicle when the application provides an edit workflow.

## 23. Troubleshooting

### “Unable to load” or database connection error

Retry once. If the problem continues, notify the administrator. The application uses a shared Prisma client, but it still requires the configured Neon PostgreSQL endpoint to be reachable. Do not reset the database or create replacement records.

### A vehicle is not listed

Check the company context, vehicle status filter, and whether the record was deactivated. Vehicle deactivation preserves historical records.

### A driver or vehicle appears duplicated

Do not create another record. Check whether you are viewing a `User` and a `Driver`, or an active record and its history. Ask an administrator to verify IDs and relationships.

### A document is missing from alerts

Check that it is linked to the correct vehicle or driver and that an expiry date was entered.

### A trip cannot be completed

Confirm that the vehicle and driver are the intended records and that the required return details are present. Preserve any error message for the administrator.

## 24. Support

When requesting help, provide:

- Your name and role
- The page and action you were using
- Vehicle or driver name and visible identifier
- Approximate date and time
- The message shown by the application
- Whether the action was a new record, edit, upload, trip, inspection, or return

Never send passwords, database URLs, API keys, or private document contents in a support request.

