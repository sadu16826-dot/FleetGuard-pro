/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test harness. */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const vm = require("node:vm");

const moduleExports = {};
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync("src/lib/licence.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  { exports: moduleExports, Date },
);
const { licenceStatus, validLicenceDateRange } = moduleExports;
const now = new Date("2026-09-09T12:00:00Z");

test("licence status has one deterministic source for valid, warning, expired and missing records", () => {
  assert.equal(licenceStatus(null, now), "MISSING");
  assert.equal(licenceStatus({ expiryDate: "2027-09-09" }, now), "VALID");
  assert.equal(licenceStatus({ expiryDate: "2026-09-30" }, now), "EXPIRING_SOON");
  assert.equal(licenceStatus({ expiryDate: "2026-08-01" }, now), "EXPIRED");
  assert.equal(licenceStatus({ expiryDate: "2027-09-09", operationalStatus: "SUSPENDED" }, now), "SUSPENDED");
  assert.equal(licenceStatus({ expiryDate: "2027-09-09", renewalStatus: "UNDER_PROCESSING" }, now), "RENEWAL_IN_PROGRESS");
});

test("licence date validation rejects expiry before issue", () => {
  assert.equal(validLicenceDateRange(new Date("2026-01-01"), new Date("2031-01-01")), true);
  assert.equal(validLicenceDateRange(new Date("2026-01-02"), new Date("2026-01-01")), false);
});

test("licence APIs map records by database driver id and preserve renewals", () => {
  const create = fs.readFileSync("src/app/api/licences/route.ts", "utf8");
  const renew = fs.readFileSync("src/app/api/licences/[id]/renew/route.ts", "utf8");
  const document = fs.readFileSync("src/app/api/licences/[id]/documents/route.ts", "utf8");
  assert.match(create, /id: driverId, companyId: user\.companyId/);
  assert.match(renew, /previousLicenceId: id/);
  assert.match(document, /licenceId: id, driverId: licence\.driverId/);
});
