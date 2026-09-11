/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test harness. */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const vm = require("node:vm");

const source = ts.transpileModule(fs.readFileSync("src/lib/db.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;

function load(globalState, datamodel) {
  class PrismaClient {
    driverLicence = { findMany() {} };
    async $disconnect() { this.disconnected = true; }
  }
  const exports = {};
  vm.runInNewContext(source, {
    exports,
    globalThis: globalState,
    process: { env: { NODE_ENV: "development" } },
    console,
    require: () => ({ PrismaClient, Prisma: { dmmf: { datamodel } } }),
  });
  return exports.db;
}

test("replaces a pre-regeneration global client without licence delegates", () => {
  const stale = { async $disconnect() { this.disconnected = true; } };
  const state = { prisma: stale };
  const current = load(state, { models: [{ name: "DriverLicence" }] });
  assert.notEqual(current, stale);
  assert.equal(typeof current.driverLicence.findMany, "function");
  assert.equal(stale.disconnected, true);
  assert.equal(state.prisma, current);
});

test("reuses the connection across refreshes and replaces it on schema change", () => {
  const state = {};
  const schema = { models: [{ name: "DriverLicence" }] };
  const first = load(state, schema);
  assert.equal(load(state, schema), first);
  const next = load(state, { models: [{ name: "DriverLicence", fields: ["documents"] }] });
  assert.notEqual(next, first);
  assert.equal(first.disconnected, true);
});
