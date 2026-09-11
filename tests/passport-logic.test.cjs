/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test harness. */
const test = require('node:test');
const assert = require('node:assert/strict');

const { resolvePassportStatus, summarisePassportRecords } = require('../src/lib/passport.js');

test('resolvePassportStatus marks near-expiry passports as expiring soon', () => {
  const now = new Date();
  const soon = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000);

  assert.equal(resolvePassportStatus({ expiryDate: soon, status: 'VALID' }), 'EXPIRING_SOON');
});

test('resolvePassportStatus marks expired passports as expired', () => {
  const now = new Date();
  const expired = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

  assert.equal(resolvePassportStatus({ expiryDate: expired, status: 'VALID' }), 'EXPIRED');
});

test('summarisePassportRecords counts valid, expiring, expired and missing values', () => {
  const now = new Date();
  const valid = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const soon = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000);
  const expired = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

  const summary = summarisePassportRecords([
    { id: 'a', expiryDate: valid, status: 'VALID' },
    { id: 'b', expiryDate: soon, status: 'VALID' },
    { id: 'c', expiryDate: expired, status: 'VALID' },
    { id: 'd', expiryDate: null, status: 'MISSING' },
  ], 5);

  assert.equal(summary.total, 4);
  assert.equal(summary.valid, 1);
  assert.equal(summary.expiringSoon, 1);
  assert.equal(summary.expired, 1);
  assert.equal(summary.missing, 1);
});
