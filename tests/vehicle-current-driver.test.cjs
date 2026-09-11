/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test harness. */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const cache = new Map();
function load(file) {
  const absolute = path.resolve(file);
  if (cache.has(absolute)) return cache.get(absolute);
  const testModule = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(absolute, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

  const calls = [];
  const db = {
    vehicle: {
      findMany: async (args) => {
        calls.push(args);
        return [
          {
            id: "vehicle-1",
            companyId: "company-1",
            vehicleCode: "V-1",
            vehicleName: "Truck A",
            registrationNumber: "ABC123",
            vehicleType: "TRUCK",
            brand: "Ford",
            model: "Transit",
            fuelType: "DIESEL",
            currentKm: 12000,
            status: "IN_USE",
            nextServiceKm: 15000,
            nextServiceDate: new Date("2027-01-01"),
            updatedAt: new Date("2026-09-09"),
            primaryPhotoUrl: null,
            currentDriver: { name: "Ava Patel" },
            documents: [],
          },
        ];
      },
    },
  };

  const context = {
    module: testModule,
    exports: testModule.exports,
    require: (name) => {
      if (name === "@/lib/db") return { db };
      if (name === "@/lib/access-control") {
        return {
          authenticatedUser: async () => ({ companyId: "company-1" }),
          accessFailure: (error, fallback) =>
            Response.json(
              { message: error instanceof Error ? error.message : fallback },
              { status: 500 },
            ),
        };
      }
      if (name === "next/server") {
        return {
          NextResponse: {
            json: (payload, init) =>
              new Response(JSON.stringify(payload), init),
          },
        };
      }
      if (name.startsWith("@/")) {
        return load(`src/${name.slice(2)}.ts`);
      }
      return require(name);
    },
    Response,
    URLSearchParams,
    Date,
    console,
  };

  vm.runInNewContext(code, context, { filename: absolute });
  cache.set(absolute, { exports: testModule.exports, calls });
  return cache.get(absolute);
}

test("vehicle list request includes the current driver relation and exposes the driver name", async () => {
  const loaded = load("src/app/api/vehicles/route.ts");
  const response = await loaded.exports.GET();
  const payload = await response.json();

  assert.equal(payload[0].currentDriver.name, "Ava Patel");
  assert.equal(
    JSON.stringify(loaded.calls[0].include.currentDriver),
    JSON.stringify({ select: { name: true } }),
  );
});
