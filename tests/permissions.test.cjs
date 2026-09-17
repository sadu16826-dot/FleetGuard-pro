/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const vm = require("node:vm");

const source = ts.transpileModule(fs.readFileSync("src/lib/permissions.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const moduleExports = {};
vm.runInNewContext(source, { exports: moduleExports, require: () => ({}) });

test("admin can manage every module", () => {
  for (const permissionModule of moduleExports.modules) assert.equal(moduleExports.can("ADMIN", permissionModule, "MANAGE"), true);
});

test("fleet manager cannot manage users or settings", () => {
  assert.equal(moduleExports.can("FLEET_MANAGER", "USERS", "VIEW"), false);
  assert.equal(moduleExports.can("FLEET_MANAGER", "SETTINGS", "VIEW"), false);
});

test("specialist roles are constrained to their responsibilities", () => {
  assert.equal(moduleExports.can("INSPECTOR", "INSPECTIONS", "APPROVE"), true);
  assert.equal(moduleExports.can("INSPECTOR", "EXPENSES", "VIEW"), true);
  assert.equal(moduleExports.can("DRIVER", "USERS", "VIEW"), false);
  assert.equal(moduleExports.can("DRIVER", "DRIVERS", "VIEW"), true);
  assert.equal(moduleExports.can("DRIVER", "DRIVERS", "EDIT"), false);
  assert.equal(moduleExports.can("DRIVER", "INSPECTIONS", "VIEW"), false);
  assert.equal(moduleExports.can("DRIVER", "INSPECTIONS", "CREATE"), false);
  assert.equal(moduleExports.can("DRIVER", "ACCIDENTS", "VIEW"), false);
  assert.equal(moduleExports.can("DRIVER", "ACCIDENTS", "CREATE"), false);
  assert.equal(moduleExports.can("MAINTENANCE_STAFF", "MAINTENANCE", "EDIT"), true);
  assert.equal(moduleExports.can("FINANCE", "EXPENSES", "CREATE"), true);
  assert.equal(moduleExports.can("FINANCE", "DRIVERS", "EDIT"), false);
});

test("inspector can view the requested operational modules without mutation access", () => {
  const viewable = [
    "MAINTENANCE", "FUEL", "EXPENSES", "DOCUMENTS", "ACCIDENTS", "REPORTS",
  ];
  for (const permissionModule of viewable) {
    assert.equal(moduleExports.can("INSPECTOR", permissionModule, "VIEW"), true);
    for (const action of ["CREATE", "EDIT", "DELETE", "MANAGE"])
      assert.equal(moduleExports.can("INSPECTOR", permissionModule, action), false);
  }
  assert.equal(moduleExports.can("INSPECTOR", "USERS", "VIEW"), false);
  assert.equal(moduleExports.can("INSPECTOR", "SETTINGS", "VIEW"), false);
});

test("maintenance navigation and pages share the existing maintenance view permission", () => {
  for (const role of ["ADMIN", "FLEET_MANAGER", "INSPECTOR", "MAINTENANCE_STAFF", "FINANCE"])
    assert.equal(moduleExports.can(role, "MAINTENANCE", "VIEW"), true, `${role} should view maintenance`);

  for (const role of ["DRIVER", "EMPLOYEE"])
    assert.equal(moduleExports.can(role, "MAINTENANCE", "VIEW"), false, `${role} should not view maintenance`);

  const navigation = fs.readFileSync("src/components/dashboard/navigation.ts", "utf8");
  const layout = fs.readFileSync("src/app/dashboard/maintenance/layout.tsx", "utf8");
  assert.match(navigation, /module: "MAINTENANCE"[^\n]+href: "\/dashboard\/maintenance"/);
  assert.match(layout, /requirePagePermission\("MAINTENANCE"\)/);
});
