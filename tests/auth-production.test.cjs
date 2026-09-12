/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const vm = require("node:vm");

function loadAuth(environment) {
  const source = ts.transpileModule(fs.readFileSync("src/lib/auth.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports = {};
  vm.runInNewContext(source, {
    exports,
    require: require,
    process: { env: environment },
    Buffer,
  });
  return exports;
}

test("development credentials are unavailable in production", () => {
  const auth = loadAuth({ NODE_ENV: "production", DATABASE_URL: "configured", SESSION_SECRET: "configured" });
  assert.equal(auth.validateDevelopmentCredentials("sadu", "sadu1234"), null);
});

test("production authentication reports only required missing variable names", () => {
  assert.equal(loadAuth({ NODE_ENV: "production" }).missingAuthenticationEnvironmentVariable(), "DATABASE_URL");
  assert.equal(loadAuth({ NODE_ENV: "production", DATABASE_URL: "configured" }).missingAuthenticationEnvironmentVariable(), "SESSION_SECRET");
  assert.equal(loadAuth({ NODE_ENV: "production", DATABASE_URL: "configured", SESSION_SECRET: "configured" }).missingAuthenticationEnvironmentVariable(), null);
});

test("login keeps secure cookie policy and safe diagnostic event codes", () => {
  const route = fs.readFileSync("src/app/api/auth/login/route.ts", "utf8");
  assert.match(route, /AUTH_ENVIRONMENT_ERROR/);
  assert.match(route, /AUTH_DATABASE_URL_MISSING/);
  assert.match(route, /AUTH_SESSION_SECRET_MISSING/);
  assert.match(route, /AUTH_LOGIN_DATABASE_ERROR/);
  assert.match(route, /AUTH_SESSION_ERROR/);
  assert.match(route, /httpOnly: true/);
  assert.match(route, /sameSite: "lax"/);
  assert.match(route, /secure: process\.env\.NODE_ENV === "production"/);
  assert.doesNotMatch(route, /console\.(?:log|warn|error)\([^\n]*(?:password|passwordHash|SESSION_SECRET|DATABASE_URL)/);
});

test("client diagnostics report only status and safe authentication code", () => {
  const form = fs.readFileSync("src/components/auth/login-form.tsx", "utf8");
  assert.match(form, /FleetGuard login request failed/);
  assert.match(form, /status: response\.status/);
  assert.match(form, /code: result\.code/);
  assert.doesNotMatch(form, /console\.(?:log|warn|error)\([^\n]*(?:username|password|FormData)/);
});
