/* eslint-disable @typescript-eslint/no-require-imports -- Source-level route regression test. */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const listSource = fs.readFileSync(
  "src/app/dashboard/drivers/page.tsx",
  "utf8",
);
const detailsSource = fs.readFileSync(
  "src/app/dashboard/drivers/[id]/page.tsx",
  "utf8",
);
const apiSource = fs.readFileSync("src/app/api/drivers/[id]/route.ts", "utf8");

test("driver navigation uses the database id and never the profile photo", () => {
  assert.match(listSource, /href=\{`\/dashboard\/drivers\/\$\{driver\.id\}`\}/);
  assert.doesNotMatch(listSource, /href=\{driver\.profilePhotoUrl\}/);
  assert.doesNotMatch(listSource, /router\.(push|replace)\([^)]*profilePhoto/);
});

test("driver details keeps profilePhotoUrl as image data", () => {
  assert.match(detailsSource, /where: \{ id, companyId: user\.companyId! \}/);
  assert.match(detailsSource, /<img\s+src=\{driver\.profilePhotoUrl\}/);
  assert.doesNotMatch(detailsSource, /href=\{driver\.profilePhotoUrl\}/);
  assert.doesNotMatch(detailsSource, /rotate|scaleX\(-1\)|scaleY\(-1\)/i);
});

test("driver details API retrieves the driver by id and company", () => {
  assert.match(apiSource, /where: \{ id, companyId: user\.companyId! \}/);
});
