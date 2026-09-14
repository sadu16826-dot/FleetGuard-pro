/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test harness. */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const removedFields = [
  "vin",
  "engineCapacity",
  "vehicleWeight",
  "batteryType",
  "batteryCapacity",
  "purchasePrice",
  "currentEstimatedValue",
  "financeStatus",
  "financeCompany",
  "registrationAuthority",
  "vehicleClass",
  "serviceInterval",
];

test("vehicle form and write APIs do not map removed vehicle fields", () => {
  const files = [
    "src/components/vehicles/vehicle-form.tsx",
    "src/types/vehicle.ts",
    "src/app/api/vehicles/route.ts",
    "src/app/api/vehicles/[id]/route.ts",
    "src/app/vehicles/[id]/edit/page.tsx",
  ];

  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    for (const field of removedFields)
      assert.doesNotMatch(source, new RegExp(`\\b${field}\\b`), `${field} remains in ${file}`);
  }
});

test("vehicle overview does not render removed detail labels", () => {
  const source = fs.readFileSync("src/app/vehicles/[id]/page.tsx", "utf8");
  for (const label of ["VIN", "Purchase price", "Finance company", "Authority", "Vehicle class", "Service interval"])
    assert.doesNotMatch(source, new RegExp(`\\["${label}"`), `${label} remains in the vehicle overview`);
});
