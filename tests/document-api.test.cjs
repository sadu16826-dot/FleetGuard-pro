/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test harness. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { createHmac } = require('node:crypto');
const user = { id: 'dev-admin', companyId: 'company-a', name: 'Admin', role: 'ADMIN', active: true };
const testSession = (id) => {
  const payload = Buffer.from(id).toString('base64url');
  const signature = createHmac('sha256', 'fleetguard-development-session-secret').update(payload).digest('base64url');
  return `${payload}.${signature}`;
};
let session = testSession('dev-admin');
let stored, failWrite = false;
const activities = [];
const db = {
  user: { findUnique: async () => user },
  vehicle: { findFirst: async ({ where }) => where.id === 'vehicle-a' && where.companyId === user.companyId ? { id: 'vehicle-a' } : null },
  vehicleDocument: {
    findFirst: async ({ where }) => stored && ['id', 'vehicleId', 'serviceId', 'fuelRecordId'].every(key => stored[key] === where[key]) ? stored : null,
    create: async ({ data }) => { if (failWrite) throw new Error('Simulated storage/database failure'); stored = { serviceId: null, fuelRecordId: null, ...data, id: 'document-a' }; return stored; },
    updateMany: async ({ data }) => { Object.assign(stored, data); return { count: 1 }; },
    deleteMany: async () => { stored = null; return { count: 1 }; },
  },
  vehicleActivity: { create: async args => activities.push(args.data) },
  $transaction: async callback => callback(db),
};
const cache = new Map();
function load(file) {
  const absolute = path.resolve(file);
  if (cache.has(absolute)) return cache.get(absolute);
  const testModule = { exports: {} }; cache.set(absolute, testModule.exports);
  const code = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, {
    module: testModule, exports: testModule.exports, Request, Response, FormData, File, Blob, URL, URLSearchParams, Uint8Array, Date, Buffer, process, console,
    require: name => name === '@/lib/db' ? { db } : name === '@/generated/prisma' ? require(path.resolve('src/generated/prisma')) : name === 'next/headers' ? { cookies: async () => ({ get: () => ({ value: session }) }) } : name.startsWith('@/') ? load(`src/${name.slice(2)}.ts`) : require(name),
  }, { filename: absolute });
  return testModule.exports;
}
const collection = load('src/app/api/vehicles/[id]/documents/route.ts');
const item = load('src/app/api/vehicles/[id]/documents/[documentId]/route.ts');
const helpers = load('src/lib/document-server.ts');
const context = { params: Promise.resolve({ id: 'vehicle-a', documentId: 'document-a' }) };
const url = 'http://localhost/api/vehicles/vehicle-a/documents/document-a';
const pdf = Buffer.from('%PDF-1.4\n%%EOF');
function form() {
  const body = new FormData();
  for (const [key, value] of Object.entries({ documentName: 'Insurance', documentType: 'INSURANCE', documentNumber: '123', issueDate: '2026-09-01', expiryDate: '2027-09-01', notes: 'Preserve' })) body.set(key, value);
  body.set('file', new File([pdf], 'insurance.pdf', { type: 'application/pdf' }));
  return body;
}
test('actual document handlers validate context, bytes, replacement and authorization with a mocked database', async () => {
  assert.equal((await collection.POST(new Request(url, { method: 'POST', body: form() }), context)).status, 201);
  assert.equal(stored.vehicleId, 'vehicle-a'); assert.equal(stored.uploadedById, user.id);
  assert.equal(stored.fileSize, pdf.length); assert.equal(stored.originalFileName, 'insurance.pdf');
  const response = await item.GET(new Request(url + '?download=1'), context);
  assert.equal(response.status, 200); assert.match(response.headers.get('content-disposition'), /^attachment;/);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), pdf);
  const old = { ...stored };
  const replacement = new FormData(); replacement.set('file', new File([pdf], 'new.pdf', { type: 'application/pdf' }));
  assert.equal((await item.PATCH(new Request(url, { method: 'PATCH', body: replacement }), context)).status, 200);
  for (const key of ['documentName', 'documentType', 'vehicleId', 'documentNumber', 'notes', 'issueDate', 'expiryDate']) assert.equal(stored[key], old[key]);
  assert.equal(stored.fileName, 'new.pdf');
  assert.equal((await item.GET(new Request(url + '?serviceId=wrong'), context)).status, 404);
  assert.equal((await item.GET(new Request(url), { params: Promise.resolve({ id: 'vehicle-b', documentId: 'document-a' }) })).status, 404);
  stored.serviceId = 'service-a';
  assert.equal((await item.GET(new Request(url), context)).status, 404);
  assert.equal((await item.GET(new Request(url + '?serviceId=service-a'), context)).status, 200);
  assert.equal((await item.GET(new Request(url + '?serviceId=service-a&fuelRecordId=fuel-a'), context)).status, 400);
  stored.serviceId = null;
  session = '';
  assert.equal((await item.GET(new Request(url), context)).status, 401);
  session = testSession('dev-admin'); user.role = 'DRIVER';
  assert.equal((await item.DELETE(new Request(url, { method: 'DELETE' }), context)).status, 403);
  user.role = 'ADMIN';
  assert.equal((await item.DELETE(new Request(url, { method: 'DELETE' }), context)).status, 200);
  assert.equal(stored, null);
  assert.deepEqual(activities.map(a => a.action), ['DOCUMENT_UPLOADED', 'DOCUMENT_REPLACED', 'DOCUMENT_DELETED']);
});
test('upload validation and database failures return safe errors without storing a document', async () => {
  stored = null;
  const invalid = form(); invalid.set('file', new File(['<html>'], 'fake.pdf', { type: 'application/pdf' }));
  assert.equal((await collection.POST(new Request(url, { method: 'POST', body: invalid }), context)).status, 400);
  assert.equal(stored, null);
  failWrite = true;
  const failed = await collection.POST(new Request(url, { method: 'POST', body: form() }), context);
  assert.equal(failed.status, 500); assert.doesNotMatch(await failed.text(), /Simulated|Prisma/);
  assert.equal(stored, null); failWrite = false;
});
test('record parser preserves separate document types and rejects mismatched contexts', async () => {
  const body = new FormData(); body.set('serviceType', 'GENERAL_SERVICE'); body.set('totalCost', '');
  body.append('attachmentType', 'SERVICE_INVOICE'); body.append('attachment', new File([pdf], 'invoice.pdf', { type: 'application/pdf' }));
  body.append('attachmentType', 'SERVICE_REPORT'); body.append('attachment', new File([pdf], 'report.pdf', { type: 'application/pdf' }));
  const parsed = await helpers.readRecordInput(new Request(url, { method: 'POST', body }), 'service');
  assert.equal(parsed.attachments.length, 2); assert.equal(parsed.input.totalCost, undefined);
  await assert.rejects(helpers.readRecordInput(new Request(url, { method: 'POST', body }), 'fuel'));
  body.set('attachmentType', 'CHARGING_RECEIPT'); body.delete('attachment'); body.append('attachment', new File([pdf], 'charging.pdf', { type: 'application/pdf' }));
  assert.equal((await helpers.readRecordInput(new Request(url, { method: 'POST', body }), 'fuel')).attachments[0].documentType, 'CHARGING_RECEIPT');
});
