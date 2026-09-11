/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test harness. */
// Run against a local built app with DOCUMENT_TEST_URL set. Uses temporary records only.
const assert = require('node:assert/strict');
process.loadEnvFile('.env');
const { PrismaClient } = require('../src/generated/prisma');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/tmp/fleetguard-document-tests/node_modules/playwright');
const db = new PrismaClient({ transactionOptions: { timeout: 20000 } });
const base = process.env.DOCUMENT_TEST_URL || 'http://localhost:3107';
const stamp = `doc-test-${Date.now()}`;
const pdf = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF');
const vehicles = [];
let otherCompany, browser;
const cookie = 'fleetguard_session=dev-session:dev-admin';
async function api(path, options = {}) { return fetch(`${base}${path}`, { ...options, headers: { Cookie: cookie, ...options.headers } }); }
function docForm(file = pdf, mime = 'application/pdf', name = 'insurance.pdf') {
  const form = new FormData();
  for (const [key, value] of Object.entries({ documentName: 'Test insurance', documentType: 'INSURANCE', documentNumber: 'TEST-001', issueDate: '2026-09-01', expiryDate: '2027-09-01', notes: 'Keep these details' })) form.set(key, value);
  form.set('file', new Blob([file], { type: mime }), name); return form;
}
async function expectStatus(response, status) { assert.equal(response.status, status, await response.clone().text()); return response; }
async function main() {
  const user = await db.user.findUniqueOrThrow({ where: { id: 'dev-admin' } });
  otherCompany = await db.company.create({ data: { name: stamp } });
  for (const [i, companyId] of [user.companyId, user.companyId, otherCompany.id].entries()) vehicles.push(await db.vehicle.create({ data: { companyId, vehicleName: `${stamp}-${i}`, vehicleCode: `${stamp}-${i}`, registrationNumber: `${stamp}-${i}`, vehicleType: 'CAR', brand: 'Test', model: 'Electric', fuelType: 'ELECTRIC', currentKm: 100 } }));
  const [vehicle, second, foreign] = vehicles;
  const root = `/api/vehicles/${vehicle.id}`;
  browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const context = await browser.newContext();
  await context.addCookies([{ name: 'fleetguard_session', value: 'dev-session:dev-admin', url: base }]);
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  await page.goto(`${base}/vehicles/${vehicle.id}`);
  await page.getByRole('button', { name: 'Add service', exact: true }).click();
  await page.locator('[name=serviceType]').selectOption('GENERAL_SERVICE');
  await page.locator('[name=serviceDate]').fill('2026-09-09');
  await page.locator('[name=provider]').fill('Test garage');
  await page.locator('[name=serviceCost]').fill('8500.50');
  await page.getByRole('button', { name: '+ Upload document', exact: true }).click();
  await page.locator('[name=attachment]').setInputFiles({ name: 'service-invoice.pdf', mimeType: 'application/pdf', buffer: pdf });
  await page.getByRole('button', { name: '+ Upload document', exact: true }).click();
  await page.locator('[name=attachmentType]').nth(1).selectOption('SERVICE_REPORT');
  await page.locator('[name=attachment]').nth(1).setInputFiles({ name: 'service-report.pdf', mimeType: 'application/pdf', buffer: pdf });
  const serviceSaved = page.waitForResponse(r => r.url().endsWith(`${root}/services`) && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  assert.equal((await serviceSaved).status(), 201);
  await page.getByText('Service record added successfully.', { exact: true }).waitFor();
  await page.getByRole('link', { name: 'Maintenance', exact: true }).click();
  await page.getByText('service-invoice.pdf', { exact: true }).waitFor();
  await page.getByText('service-report.pdf', { exact: true }).waitFor();
  const service = await db.service.findFirstOrThrow({ where: { vehicleId: vehicle.id }, include: { attachments: true } });
  assert.equal(service.attachments.length, 2);
  assert.ok(service.attachments.every(d => d.vehicleId === vehicle.id && d.serviceId === service.id && !d.fuelRecordId && d.uploadedById === user.id));
  const serviceDoc = service.attachments[0];
  const serviceUrl = `${root}/documents/${serviceDoc.id}?serviceId=${service.id}`;
  assert.deepEqual(Buffer.from(await (await expectStatus(await api(serviceUrl), 200)).arrayBuffer()), pdf);
  console.log('PASS browser service upload (two files), Maintenance display, record relationship and file bytes');

  await page.getByRole('button', { name: 'Add fuel', exact: true }).click();
  await page.locator('[name=quantity]').fill('42.5');
  await page.locator('[name=pricePerUnit]').fill('12.25');
  await page.locator('[name=date]').fill('2026-09-09');
  await page.getByRole('button', { name: '+ Upload document', exact: true }).click();
  await page.locator('[name=attachmentType]').selectOption('CHARGING_RECEIPT');
  await page.locator('[name=attachment]').setInputFiles({ name: 'charging-receipt.pdf', mimeType: 'application/pdf', buffer: pdf });
  const fuelSaved = page.waitForResponse(r => r.url().endsWith(`${root}/fuel`) && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  assert.equal((await fuelSaved).status(), 201);
  await page.getByText('Fuel record added successfully.', { exact: true }).waitFor();
  await page.getByRole('link', { name: 'Operations', exact: true }).click();
  await page.getByText('charging-receipt.pdf', { exact: true }).waitFor();
  const fuel = await db.fuelRecord.findFirstOrThrow({ where: { vehicleId: vehicle.id }, include: { attachments: true } });
  assert.equal(fuel.attachments[0].fuelRecordId, fuel.id);
  assert.equal(fuel.attachments[0].serviceId, null);
  const fuelUrl = `${root}/documents/${fuel.attachments[0].id}?fuelRecordId=${fuel.id}`;
  assert.deepEqual(Buffer.from(await (await expectStatus(await api(fuelUrl), 200)).arrayBuffer()), pdf);
  console.log('PASS browser charging upload, Operations history, fuel relationship and view');

  await page.getByRole('button', { name: 'Upload document', exact: true }).click();
  await page.locator('[name=documentName]').fill('Test insurance');
  await page.locator('[name=documentType]').selectOption('INSURANCE');
  await page.locator('[name=documentNumber]').fill('TEST-001');
  await page.locator('[name=issueDate]').fill('2026-09-01');
  await page.locator('[name=expiryDate]').fill('2027-09-01');
  await page.locator('[name=notes]').fill('Keep these details');
  await page.locator('[name=file]').setInputFiles({ name: 'insurance.pdf', mimeType: 'application/pdf', buffer: pdf });
  const documentSaved = page.waitForResponse(r => r.url().endsWith(`${root}/documents`) && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  assert.equal((await documentSaved).status(), 201);
  await page.getByText('Document uploaded successfully.', { exact: true }).waitFor();
  await page.getByRole('link', { name: 'Documents', exact: true }).click();
  await page.getByText('insurance.pdf', { exact: true }).waitFor();
  assert.equal(await page.getByText('service-invoice.pdf', { exact: true }).count(), 0);
  assert.equal(await page.getByText('charging-receipt.pdf', { exact: true }).count(), 0);
  const before = await db.vehicleDocument.findFirstOrThrow({ where: { vehicleId: vehicle.id, serviceId: null, fuelRecordId: null } });
  const docUrl = `${root}/documents/${before.id}`;
  const download = await api(`${docUrl}?download=1`);
  assert.match(download.headers.get('content-disposition'), /^attachment;/);
  assert.deepEqual(Buffer.from(await download.arrayBuffer()), pdf);
  await page.getByRole('button', { name: 'Replace', exact: true }).click();
  assert.equal(await page.locator('[name=issueDate]').count(), 0);
  const replacement = Buffer.concat([pdf, Buffer.from('\n% replacement')]);
  await page.locator('[name=file]').setInputFiles({ name: 'insurance-replaced.pdf', mimeType: 'application/pdf', buffer: replacement });
  const replaced = page.waitForResponse(r => r.url().endsWith(docUrl) && r.request().method() === 'PATCH');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  assert.equal((await replaced).status(), 200);
  await page.getByText('insurance-replaced.pdf', { exact: true }).waitFor();
  const after = await db.vehicleDocument.findUniqueOrThrow({ where: { id: before.id } });
  for (const key of ['vehicleId', 'documentType', 'documentName', 'documentNumber', 'notes']) assert.equal(after[key], before[key]);
  assert.equal(after.issueDate.toISOString(), before.issueDate.toISOString());
  assert.equal(after.expiryDate.toISOString(), before.expiryDate.toISOString());
  assert.deepEqual(Buffer.from(await (await api(docUrl)).arrayBuffer()), replacement);
  await page.reload();
  await page.getByText('insurance-replaced.pdf', { exact: true }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Upload document', exact: true }).click();
  assert.ok(await page.locator('[name=file]').isVisible());
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  console.log('PASS browser vehicle document upload, view/download, replacement preserving metadata, reload and mobile form');

  await expectStatus(await api(`/api/vehicles/${second.id}/documents/${before.id}`), 404);
  await expectStatus(await api(`${root}/documents/${serviceDoc.id}`), 404);
  await expectStatus(await api(`${root}/documents/${serviceDoc.id}?serviceId=wrong-record`), 404);
  await expectStatus(await api(`${root}/documents/${serviceDoc.id}?serviceId=${service.id}&fuelRecordId=${fuel.id}`), 400);
  for (const method of ['GET', 'PATCH', 'DELETE']) await expectStatus(await api(`/api/vehicles/${foreign.id}/documents/${before.id}`, { method }), 404);
  await expectStatus(await api(`/api/vehicles/${foreign.id}/documents`, { method: 'POST', body: docForm() }), 404);
  await expectStatus(await fetch(`${base}${docUrl}`), 401);
  await page.goto(`${base}/vehicles/${second.id}?tab=Maintenance`);
  assert.equal(await page.getByText('service-invoice.pdf', { exact: true }).count(), 0);
  console.log('PASS cross-vehicle, cross-company, wrong-record and unauthenticated access denied');

  const countBefore = await db.vehicleDocument.count({ where: { vehicleId: vehicle.id } });
  await expectStatus(await api(`${root}/documents`, { method: 'POST', body: docForm(Buffer.from('<html>'), 'application/pdf') }), 400);
  await expectStatus(await api(`${root}/documents`, { method: 'POST', body: docForm(pdf, 'application/pdf', 'invalid.exe') }), 400);
  await expectStatus(await api(`${root}/documents`, { method: 'POST', body: docForm(Buffer.alloc(10 * 1024 * 1024 + 1), 'application/pdf') }), 400);
  assert.equal(await db.vehicleDocument.count({ where: { vehicleId: vehicle.id } }), countBefore);
  // Force a database failure inside a transaction after the file insert; ensure both roll back.
  const rollbackId = `${stamp}-rollback`;
  await assert.rejects(db.$transaction(async tx => {
    await tx.vehicleDocument.create({ data: { id: rollbackId, vehicleId: vehicle.id, documentType: 'OTHER', fileName: 'rollback.pdf', fileUrl: '', data: pdf, uploadedBy: user.name, uploadedById: user.id } });
    await tx.vehicle.update({ where: { id: `${stamp}-missing` }, data: { currentKm: 100 } });
  }));
  assert.equal(await db.vehicleDocument.findUnique({ where: { id: rollbackId } }), null);
  await assert.rejects(db.vehicleDocument.create({ data: { vehicleId: second.id, serviceId: service.id, documentType: 'SERVICE_INVOICE', fileName: 'wrong.pdf', fileUrl: '', uploadedBy: user.name } }));
  await assert.rejects(db.vehicleDocument.create({ data: { vehicleId: vehicle.id, serviceId: service.id, fuelRecordId: fuel.id, documentType: 'OTHER', fileName: 'ambiguous.pdf', fileUrl: '', uploadedBy: user.name } }));
  console.log('PASS invalid/oversized upload rejection, rollback, composite FK and ambiguous-context constraints');

  await page.goto(`${base}/vehicles/${vehicle.id}?tab=Documents`);
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Delete document' }).click();
  await page.getByText('No vehicle documents found.', { exact: true }).waitFor();
  assert.equal(await db.vehicleDocument.findUnique({ where: { id: before.id } }), null);
  await expectStatus(await api(serviceUrl, { method: 'DELETE' }), 200);
  assert.ok(await db.service.findUnique({ where: { id: service.id } }));
  assert.equal(await db.vehicleDocument.findUnique({ where: { id: serviceDoc.id } }), null);
  const activities = await db.vehicleActivity.findMany({ where: { vehicleId: vehicle.id } });
  assert.equal(activities.filter(a => a.action === 'SERVICE_ADDED').length, 1);
  assert.equal(activities.find(a => a.action === 'SERVICE_ADDED').metadata.attachmentCount, 2);
  assert.ok(activities.some(a => a.action === 'DOCUMENT_REPLACED'));
  console.log('PASS confirmed document deletion, attachment removal preserving parent and existing audit history');
  console.log('ALL DOCUMENT FLOW CHECKS PASSED');
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close();
  const ids = vehicles.map(v => v.id);
  if (ids.length) {
    await db.vehicleDocument.deleteMany({ where: { vehicleId: { in: ids } } });
    await db.fuelRecord.deleteMany({ where: { vehicleId: { in: ids } } });
    await db.vehicle.deleteMany({ where: { id: { in: ids } } });
  }
  if (otherCompany) await db.company.delete({ where: { id: otherCompany.id } });
  await db.$disconnect();
  console.log('Temporary test records cleaned up.');
});
