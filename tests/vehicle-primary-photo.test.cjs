/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test harness. */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("vehicle photo upload uses the authenticated persistent photo route", () => {
  const form = fs.readFileSync("src/components/vehicles/vehicle-form.tsx", "utf8");
  const route = fs.readFileSync("src/app/api/vehicles/[id]/primary-photo/route.ts", "utf8");
  const schema = fs.readFileSync("prisma/schema.prisma", "utf8");

  assert.match(form, /primaryVehiclePhotoError/);
  assert.match(form, /FormData\(\)/);
  assert.match(form, /primary-photo/);
  assert.match(form, /photoPreview/);
  assert.match(form, /Remove photo/);
  assert.match(route, /accessibleVehicle\(id, true\)/);
  assert.match(route, /request\.formData\(\)/);
  assert.match(route, /primaryPhotoData/);
  assert.match(route, /primaryPhotoUrl/);
  assert.match(schema, /primaryPhotoData\s+Bytes\?/);
});

test("vehicle photo endpoint validates files and does not use local storage", () => {
  const route = fs.readFileSync("src/app/api/vehicles/[id]/primary-photo/route.ts", "utf8");
  const validation = fs.readFileSync("src/lib/vehicle-photo.ts", "utf8");

  assert.match(validation, /MAX_PRIMARY_VEHICLE_PHOTO_SIZE/);
  assert.match(validation, /documentSignatureValid/);
  assert.match(validation, /VehiclePhotoError/);
  assert.match(route, /multipart\/form-data/);
  assert.doesNotMatch(route, /writeFile|mkdir|public\//);
});
