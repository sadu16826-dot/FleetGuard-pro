/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test harness. */
const test = require("node:test");
const assert = require("node:assert/strict");

const {
  driverStatusClassName,
  documentExpiryStatus,
} = require("../src/lib/driver-utils");

test("driver status classes are mapped consistently for active and suspended drivers", () => {
  assert.equal(
    driverStatusClassName("ACTIVE"),
    "bg-emerald-50 text-emerald-700",
  );
  assert.equal(
    driverStatusClassName("SUSPENDED"),
    "bg-amber-50 text-amber-700",
  );
  assert.equal(driverStatusClassName("TERMINATED"), "bg-rose-50 text-rose-700");
});

test("document expiry logic distinguishes valid, soon-expiring and expired documents", () => {
  const now = Date.now();
  assert.equal(
    documentExpiryStatus(new Date(now + 45 * 24 * 60 * 60 * 1000)),
    "VALID",
  );
  assert.equal(
    documentExpiryStatus(new Date(now + 10 * 24 * 60 * 60 * 1000)),
    "DUE_SOON",
  );
  assert.equal(
    documentExpiryStatus(new Date(now - 5 * 24 * 60 * 60 * 1000)),
    "EXPIRED",
  );
});
