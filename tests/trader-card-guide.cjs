const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const webpackModule = require('next/dist/compiled/webpack/webpack');
webpackModule.init();
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'out', 'trader-card-qa');
async function main() {
  await new Promise((resolve, reject) => webpackModule.webpack({
    mode: 'development', devtool: false, entry: path.join(__dirname, 'trader-card-fixture.jsx'),
    output: { path: output, filename: 'guide.js' },
    resolve: { extensions: ['.js', '.jsx'], alias: { '@': root } },
    module: { rules: [{ test: /\.jsx?$/, exclude: /node_modules/, use: path.join(__dirname, 'trader-card-babel-loader.cjs') }] },
  }, (error, stats) => error || stats.hasErrors() ? reject(error || new Error(stats.toString({ all: false, errors: true }))) : resolve()));
  const server = http.createServer((request, response) => {
    if (request.url === '/guide.js') { response.setHeader('Content-Type', 'application/javascript'); response.end(fs.readFileSync(path.join(output, 'guide.js'))); }
    else if (request.url === '/broken.png') { response.writeHead(404); response.end(); }
    else { response.setHeader('Content-Type', 'text/html'); response.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script src="/guide.js"></script></body></html>'); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
  let browser;
  try {
    browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const theme of ['light', 'dark']) for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 950 });
      await page.goto(`http://127.0.0.1:${server.address().port}/?theme=${theme}`);
      await page.getByRole('button', { name: 'PVC Epson L8050', exact: true }).click();
      assert.ok(await page.getByRole('button', { name: 'Cetak Depan', exact: true }).isDisabled());
      await page.getByRole('button', { name: 'Kalibrasi Cetak', exact: true }).click();
      await page.getByRole('button', { name: 'Bantuan kalibrasi', exact: true }).click();
      assert.ok(await page.getByText('Apa itu kalibrasi? Apakah wajib?', { exact: true }).isVisible());
      await page.getByRole('button', { name: 'Bantuan kalibrasi', exact: true }).click();
      const values = { 'Lebar halaman driver (mm)': '200', 'Tinggi halaman driver (mm)': '150', 'Slot 1 - X (mm)': '5', 'Slot 1 - Y (mm)': '10', 'Slot 2 - X (mm)': '105', 'Slot 2 - Y (mm)': '10' };
      for (const [label, value] of Object.entries(values)) await page.getByRole('spinbutton', { name: label, exact: true }).fill(value);
      for (const side of ['Depan', 'Belakang']) {
        await page.getByRole('button', { name: `Cetak Uji ${side}`, exact: true }).click();
        await page.getByRole('checkbox', { name: new RegExp(`Hasil ${side.toLowerCase()}:`) }).check();
      }
      const checkAlignment = async () => {
        const measurements = await page.locator('.MuiFormControlLabel-root').evaluateAll(labels => labels.map(label => {
          const icon = label.querySelector('.MuiCheckbox-root').getBoundingClientRect();
          const text = label.querySelector('.MuiFormControlLabel-label').getBoundingClientRect();
          return { top: Math.abs(icon.top - text.top), gap: text.left - icon.right };
        }));
        assert.ok(measurements.length > 0);
        for (const item of measurements) {
          assert.ok(item.top < 1, 'Checkbox must align with the first text line');
          assert.ok(item.gap >= 8, 'Checkbox label needs safe spacing');
        }
      };
      await checkAlignment();
      await page.getByRole('button', { name: 'Tutup Kalibrasi', exact: true }).click();
      await page.getByRole('button', { name: 'Cetak Depan', exact: true }).click();
      assert.equal((await page.evaluate(() => window.lastPrint)).items.length, 2);
      assert.ok(await page.getByRole('button', { name: 'Berikutnya', exact: true }).isDisabled());
      await page.getByRole('checkbox', { name: 'Hasil depan kelompok ini sudah benar', exact: true }).check();
      await page.getByRole('button', { name: 'Cetak Belakang', exact: true }).click();
      await page.getByRole('checkbox', { name: 'Hasil belakang kelompok ini sudah benar', exact: true }).check();
      await checkAlignment();
      await page.getByRole('button', { name: 'Berikutnya', exact: true }).click();
      await page.getByRole('button', { name: 'Cetak Depan', exact: true }).click();
      assert.equal((await page.evaluate(() => window.lastPrint)).items[0].document_id, 3);
      assert.equal((await page.evaluate(() => window.lastPrint)).items.length, 1);
      assert.ok(await page.getByText('Slot 2: Kosong', { exact: true }).isVisible());
      const overflow = await page.locator('.MuiModal-root').evaluate(el => el.scrollWidth > window.innerWidth);
      assert.equal(overflow, false);
      await page.screenshot({ path: path.join(output, `guide-${theme}-${width}.png`) });
      await page.getByRole('button', { name: 'Kalibrasi Cetak', exact: true }).click();
      await page.getByRole('spinbutton', { name: 'Offset depan X (mm)', exact: true }).fill('1');
      await page.screenshot({ path: path.join(output, `calibration-${theme}-${width}.png`) });
      await page.getByRole('button', { name: 'Tutup Kalibrasi', exact: true }).click();
      assert.ok(await page.getByRole('button', { name: 'Cetak Depan', exact: true }).isDisabled());
      await page.evaluate(() => localStorage.clear());
    }
    const broken = await page.evaluate(async () => {
      const root = document.createElement('div'); const img = document.createElement('img'); img.src = '/broken.png'; root.append(img); document.body.append(root);
      try { await window.waitForTraderPrintAssets(root); return ''; } catch (error) { return error.message; } finally { root.remove(); }
    });
    assert.match(broken, /gagal dimuat/);
    const optional = await page.evaluate(async () => {
      const root = document.createElement('div'); const img = document.createElement('img'); img.src = '/broken.png'; img.dataset.printOptional = 'Pas foto tidak tersedia'; root.append(img); document.body.append(root);
      try { await window.waitForTraderPrintAssets(root); return root.textContent; } finally { root.remove(); }
    });
    assert.equal(optional, 'Pas foto tidak tersedia');
    const fit = await page.evaluate(async () => {
      const root = document.createElement('div');
      const block = document.createElement('div');
      block.dataset.cardContent = 'Uji panjang'; block.dataset.cardFit = '';
      block.style.cssText = 'font:5.6pt Arial;line-height:1;width:200px;height:14px';
      block.innerHTML = 'Baris satu<br>Baris dua'; root.append(block); document.body.append(root);
      try {
        await window.waitForTraderPrintAssets(root);
        const fitted = Number.parseFloat(block.style.fontSize);
        block.textContent = 'Data terlalu panjang '.repeat(200);
        let rejected = false;
        try { await window.waitForTraderPrintAssets(root); } catch { rejected = true; }
        return { fitted, rejected };
      } finally { root.remove(); }
    });
    assert.ok(fit.fitted >= 5 && fit.fitted <= 5.6);
    assert.equal(fit.rejected, true);
    assert.deepEqual(errors, []);
    console.log('PASS: modal light/dark 390/768/1440, calibration lock/reset, confirmations, retry groups, odd last slot, failed image.');
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
