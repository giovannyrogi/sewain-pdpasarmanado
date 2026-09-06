const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const babel = require('next/dist/compiled/babel/core');
const root = path.resolve(__dirname, '..');
let row;
const query = async (sql, params) => {
  assert.match(sql, /LEFT JOIN land_stalls/);
  assert.match(sql, /identity\.street_address/);
  assert.deepEqual(params, ['a'.repeat(43)]);
  return { rowCount: 1, rows: [row] };
};
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (request === 'server-only') return {};
  if (request === '@/lib/dbConfig') return { query };
  if (request.startsWith('@/')) request = path.join(root, request.slice(2));
  return originalLoad.call(this, request, parent, isMain);
};
const originalJs = require.extensions['.js'];
require.extensions['.js'] = (module, filename) => {
  if (!filename.startsWith(path.join(root, 'app'))) return originalJs(module, filename);
  const { code } = babel.transformSync(fs.readFileSync(filename, 'utf8'), { filename, babelrc: false, configFile: false, plugins: [require('next/dist/compiled/babel/plugin-transform-modules-commonjs')] });
  module._compile(code, filename);
};
async function main() {
  const { getLandPermitVerificationByToken } = require('../app/utils/landPermitVerificationService');
  for (const administration_type of ['kip', 'kkip']) {
    row = { administration_type, document_status: 'printed', tenant_name: 'Pedagang Contoh', tenant_nik: '1234567890123456', street_address: 'Jalan Contoh', rt: '001', city: 'Manado', stall_number: '3', stall_length: 2, stall_width: 3, stall_area: 6 };
    const result = await getLandPermitVerificationByToken('a'.repeat(43));
    assert.equal(result.tenant_address, 'Jalan Contoh, RT 001 / RW -, Manado');
    assert.equal(result.administration_type, administration_type);
    assert.notEqual(result.tenant_nik_masked, row.tenant_nik);
    for (const field of ['stall_number', 'stall_length', 'stall_width', 'stall_area']) assert.equal(Object.hasOwn(result, field), administration_type === 'kip');
    assert.ok(!Object.hasOwn(result, 'tenant_nik'));
  }
  assert.equal(await getLandPermitVerificationByToken('invalid'), null);
  console.log('PASS: KIP/KKIP public mapping, address, omitted KKIP stall fields, masked NIK, invalid token. No database connection used.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
