/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test harness. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
const moduleExports = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/document-upload.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: moduleExports });
const { documentFileError, documentSignatureValid, MAX_DOCUMENT_SIZE } = moduleExports;
test('file validation rejects empty, oversized and mismatched files', () => {
  assert.equal(documentFileError({ name: 'invoice.PDF', type: 'application/pdf', size: 100 }), null);
  assert.ok(documentFileError({ name: 'invoice.pdf', type: 'application/pdf', size: 0 }));
  assert.ok(documentFileError({ name: 'invoice.pdf', type: 'application/pdf', size: MAX_DOCUMENT_SIZE + 1 }));
  assert.ok(documentFileError({ name: 'invoice.exe', type: 'application/pdf', size: 100 }));
  assert.ok(documentFileError({ name: 'invoice.pdf', type: 'text/html', size: 100 }));
});
test('server signature checks cover all accepted formats and reject disguised HTML', () => {
  for (const [type, data] of [['application/pdf', [37,80,68,70,45]], ['image/jpeg', [255,216,255]], ['image/png', [137,80,78,71,13,10,26,10]], ['image/webp', [82,73,70,70,0,0,0,0,87,69,66,80]]]) {
    assert.equal(documentSignatureValid(Uint8Array.from(data), type), true);
    assert.equal(documentSignatureValid(Buffer.from('<script>alert(1)</script>'), type), false);
    assert.equal(documentSignatureValid(new Uint8Array(), type), false);
  }
});
