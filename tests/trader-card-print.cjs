const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const babel = require('next/dist/compiled/babel/core');
const root = path.resolve(__dirname, '..');
const originalJs = require.extensions['.js'];
function compile(module, filename) {
  if (!filename.startsWith(path.join(root, 'app'))) return originalJs(module, filename);
  const source = fs.readFileSync(filename, 'utf8').replace(/(['"])@\//g, `$1${root.replace(/\\/g, '/')}/`);
  const { code } = babel.transformSync(source, { filename, babelrc: false, configFile: false,
    presets: [[require('next/dist/compiled/babel/preset-react'), { runtime: 'automatic' }]],
    plugins: [require('next/dist/compiled/babel/plugin-transform-modules-commonjs')] });
  module._compile(code, filename);
}
require.extensions['.jsx'] = compile;
require.extensions['.js'] = compile;
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const util = require('../app/utils/traderCardPrinting');
const Bundle = require('../app/components/documents/TraderCardPrintBundle').default;
const fixture = { document_id: 1, document_number: '01/PM/KTP-UPJB/VI/2026', administration_type: 'kip', tenant_name: 'ALDO FERNANDO PIOH', birth_place: 'NOONGAN', birth_date: '2002-08-06', street_address: 'Lingk III, RT 000 / RW 000, Kakaskasen Satu', district: 'Tomohon Utara', city: 'Kota Tomohon', province: 'Sulawesi Utara', location_name: 'BERSEHATI', sector_name: 'BONGKAR MUAT', stall_number: 'BM 18 Sayur', start_date: '2026-06-24', end_date: '2027-06-23', qr_token: 'a'.repeat(43) };
const profile = { ...util.emptyPrinterProfile(), pageWidth: 200, pageHeight: 150, slots: [{ x: 5, y: 10 }, { x: 105, y: 10 }], confirmedFront: true, confirmedBack: true };
for (const count of [1, 2, 3, 8, 10]) {
  const items = Array.from({ length: count }, (_, i) => ({ ...fixture, document_id: i + 1 }));
  assert.equal(util.chunkCards(items, 2).length, Math.ceil(count / 2));
  assert.equal(util.chunkCards(items, 8).length, Math.ceil(count / 8));
  const mirrored = util.mirrorCardSlots(items);
  for (let i = 0; i < count; i++) assert.equal(mirrored[i % 2 ? i - 1 : i + 1].document_id, i + 1);
}
assert.equal(util.validatePrinterProfile(profile, true), '');
assert.ok(util.validatePrinterProfile(util.emptyPrinterProfile(), true));
assert.ok(util.validatePrinterProfile({ ...profile, confirmedBack: false }, true));
assert.ok(util.validatePrinterProfile({ ...profile, slots: [{ x: 5, y: 10 }, { x: 10, y: 10 }] }));
assert.equal(util.administrationLabel('Kartu Khusus Identitas Pedagang (KKIP)'), 'KKIP');
assert.equal(util.administrationLabel(null), '-');
assert.equal(util.landDocumentPrefix('kip'), 'SIL');
assert.equal(util.landDocumentPrefix('kkip'), 'KTP');
assert.equal(util.formatLandDocumentNumber('123/PM/SIL-UPJB/IX/2026', 'kkip'), '123/PM/KTP-UPJB/IX/2026');
assert.equal(util.formatLandDocumentNumber('123/PM/KTP-UPJB/IX/2026', 'kip'), '123/PM/SIL-UPJB/IX/2026');
const output = path.join(root, 'out', 'trader-card-qa');
fs.mkdirSync(output, { recursive: true });
// Simulate the application's universal font selector; print typography must stay isolated.
const pageHtml = props => '<!doctype html><html><head><meta charset="utf-8"><style>*{font-family:monospace}html,body{margin:0;padding:0;background:white}@page{size:A4;margin:0}</style></head><body>' + renderToStaticMarkup(React.createElement(Bundle, props)) + '</body></html>';
async function main() {
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
  const server = http.createServer((request, response) => {
    const name = path.basename(new URL(request.url, 'http://localhost').pathname);
    if (!['template-id-card-pedagang-depan.png', 'template-id-card-pedagang-belakang.png', 'logo-pm-red-transparent.png', 'logo-pemerintah-kota-manado.png', 'logo-perumda-pasar-manado.png'].includes(name)) { response.end(''); return; }
    response.setHeader('Content-Type', 'image/png'); response.end(fs.readFileSync(path.join(root, 'public', name)));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
    const page = await browser.newPage({ viewport: { width: 1100, height: 1200 }, deviceScaleFactor: 2 });
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    for (const count of [1, 2, 3, 8, 10]) {
      const items = Array.from({ length: count }, (_, i) => ({ ...fixture, document_id: i + 1 }));
      await page.setContent(pageHtml({ documents: items }));
      await page.evaluate(async () => { await Promise.all([...document.images].map(image => image.decode())); await document.fonts.ready; });
      assert.equal(await page.locator('.trader-card-sheet').count(), Math.ceil(count / 8) * 2);
      const overflow = await page.locator('[data-card-content]').evaluateAll(elements => elements.filter(el => el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1).map(el => ({ text: el.textContent, height: el.clientHeight, scroll: el.scrollHeight })));
      assert.deepEqual(overflow, [], 'Card content must fit: ' + JSON.stringify(overflow));
      assert.match(await page.locator('[data-card-content]').first().evaluate(el => getComputedStyle(el.firstElementChild).fontFamily), /Arial/);
      const size = await page.locator('.trader-card').first().boundingBox();
      assert.ok(Math.abs(size.width - 85.6 * 96 / 25.4) < 1);
      assert.ok(Math.abs(size.height - 54 * 96 / 25.4) < 1);
      const qrMetrics = await page.locator('[data-card-qr]').first().evaluate(el => {
        const svg = el.querySelector('svg');
        const box = svg.getBoundingClientRect();
        const parent = el.getBoundingClientRect();
        return { modules: svg.viewBox.baseVal.width, width: box.width, height: box.height, margin: Math.min(box.x - parent.x, box.y - parent.y, parent.right - box.right, parent.bottom - box.bottom) };
      });
      assert.ok(Math.abs(qrMetrics.width - qrMetrics.height) < 1, 'QR must remain square');
      assert.ok(qrMetrics.margin + 0.1 >= qrMetrics.width / qrMetrics.modules * 4, 'QR needs four-module quiet zone: ' + JSON.stringify(qrMetrics));
      if (count === 2) {
        await page.locator('.trader-card').first().screenshot({ path: path.join(output, 'front.png') });
        await page.locator('.trader-card').nth(2).screenshot({ path: path.join(output, 'back.png') });
      }
      await page.pdf({ path: path.join(output, `a4-${count}.pdf`), preferCSSPageSize: true, printBackground: true });
    }
    for (const administration_type of ['kip', 'kkip']) {
      await page.setContent(pageHtml({ documents: [{ ...fixture, administration_type, document_number: '123/PM/SIL-UPJB/IX/2026' }], cardSide: 'front' }));
      assert.ok((await page.locator('.trader-card').textContent()).includes(`123/PM/${administration_type === 'kip' ? 'SIL' : 'KTP'}-UPJB/IX/2026`));
      assert.equal(await page.locator('[data-card-content]').evaluateAll(elements => elements.some(el => el.scrollHeight > el.clientHeight + 1)), false);
      assert.ok(!(await page.locator('.trader-card').textContent()).includes(fixture.street_address));
    }
    await page.setContent(pageHtml({ documents: [{ ...fixture, start_date: '2026-09-24', end_date: '2027-09-23' }], cardSide: 'back' }));
    assert.equal(await page.locator('[data-card-content]').evaluateAll(elements => elements.some(el => el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1)), false);
    for (const includeCards of [false, true]) {
      const html = pageHtml({ documents: [fixture], includePermit: true, includeCards });
      fs.writeFileSync(path.join(output, includeCards ? 'bundle.html' : 'permit.html'), html);
      await page.setContent(html);
      await page.evaluate(async () => { await Promise.all([...document.images].map(image => image.decode())); });
      assert.equal(await page.locator('.land-permit-document').count(), 1);
      assert.ok(await page.locator('.land-permit-document svg').count() > 0);
      assert.deepEqual(await page.locator('[data-card-content]').evaluateAll(elements => elements.filter(el => el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1).map(el => el.textContent)), [], 'Combined permit/card content must fit');
    }
    await page.setContent(pageHtml({ documents: [{ ...fixture, tenant_name: 'Nama sangat panjang '.repeat(80) }], cardSide: 'front' }));
    assert.ok(await page.locator('[data-card-content]').evaluateAll(elements => elements.some(el => el.scrollHeight > el.clientHeight + 1)));
    for (const count of [1, 2]) for (const side of ['front', 'back']) {
      await page.setContent(pageHtml({ documents: Array.from({ length: count }, (_, i) => ({ ...fixture, tenant_name: `Slot ${i + 1}`, document_id: i + 1 })), cardSide: side, media: 'pvc', printerProfile: profile }));
      const positions = await page.locator('.trader-card').evaluateAll(elements => elements.map(el => el.getBoundingClientRect().x));
      assert.ok(Math.abs(positions[0] - 5 * 96 / 25.4) < 1);
      if (count === 2) assert.ok(Math.abs(positions[1] - 105 * 96 / 25.4) < 1);
    }
    console.log('PASS: counts, mirrored A4, PVC slots, size, text overflow, administration types, profile validation. Artifacts:', output);
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
