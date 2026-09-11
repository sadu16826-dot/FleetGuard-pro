/* eslint-disable @typescript-eslint/no-require-imports -- Source-level regression checks for the client/server contract. */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("edit modal never receives or returns an existing password", () => {
  const modal = fs.readFileSync("src/components/users/user-edit-modal.tsx", "utf8");
  assert.match(modal, /Leave blank to keep current password/);
  assert.match(modal, /if \(password\) body\.password = password/);
  assert.doesNotMatch(modal, /passwordHash/);
});

test("user update remains ID-scoped, permission-protected and hashes optional passwords", () => {
  const route = fs.readFileSync("src/app/api/users/[id]/route.ts", "utf8");
  assert.match(route, /requirePermission\("USERS", "MANAGE"\)/);
  assert.match(route, /where: \{ id, companyId: admin\.companyId!/);
  assert.match(route, /passwordHash: body\.password \? hashPassword\(body\.password\) : undefined/);
  assert.match(route, /A user with this email already exists/);
});

test("successful edits update the existing table row and close the modal", () => {
  const manager = fs.readFileSync("src/components/users/user-manager.tsx", "utf8");
  assert.match(manager, /user\.id === updated\.id \? \{ \.\.\.user, \.\.\.updated \} : user/);
  assert.match(manager, /setEditing\(null\)/);
  assert.match(manager, /User updated successfully/);
});
