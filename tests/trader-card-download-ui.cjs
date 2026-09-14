const assert = require('node:assert/strict');
const path = require('node:path');
async function main() {
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const url = 'http://localhost:3002';
  const data = { document_id: 1001, tenant_name: 'PEDAGANG UJI', administration_type: 'kkip', document_number:'1/PM/KKIP-UPJB/IX/2026', location_name:'BERSEHATI',sector_name:'BONGKAR MUAT',qr_token:'a'.repeat(43),start_date:'2026-09-01',end_date:'2027-08-31' };
  try {
    for(const theme of ['light','dark']) for(const width of [390,768,1440]) {
      const context = await browser.newContext({ viewport:{width,height:950},acceptDownloads:true });
      await context.addCookies([{name:'loggedInUser',value:JSON.stringify({id:999999,role_id:9,full_name:'UI TEST',expiresAt:Date.now()+3600000}),url}]);
      await context.addInitScript(mode=>localStorage.setItem('currentTheme',JSON.stringify({currentThemeMode:mode})),theme);
      const page = await context.newPage();
      page.on('pageerror', error => console.error('UI:', error.message));
      // All API requests are mocked; this test never reads or writes production data.
      await page.route('**/api/**',route=>route.fulfill({json:{success:true,data:route.request().url().includes('land-permit-documents')?[data]:[],eligible_applications:[]}}));
      let fail = false;
      let assets = 0;
      await page.route('**/card-export/**',async route=>{
        assets++;
        await new Promise(resolve=>setTimeout(resolve,600));
        if(fail) return route.abort();
        return route.continue();
      });
      await page.goto(url+'/land-permit-documents',{timeout:120000});
      console.log('Loaded',theme,width);
      await page.screenshot({path:path.resolve('out/card-export/ui-page.png')});
      await page.getByRole('button',{name:'Unduh kartu pedagang',exact:true}).click({timeout:30000});
      const button = page.getByRole('button',{name:'Unduh Belakang',exact:true});
      let downloads=0; page.on('download',()=>downloads++);
      const ready=page.waitForEvent('download');
      await button.evaluate(el=>{el.click();el.click();});
      await page.getByText('Membuat kartu 1 dari 1 - bagian belakang...', {exact:true}).waitFor();
      assert.ok(await button.isDisabled());
      const overlay = page.locator('.MuiBackdrop-root').last();
      await page.screenshot({path:path.resolve(`out/card-export/loading-${theme}-${width}.png`)});
      assert.ok(await overlay.isVisible());
      await ready;
      await button.waitFor();
      await page.waitForFunction(()=>![...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Unduh Belakang')?.disabled);
      assert.equal(downloads,1,'Double click creates one download');
      const before=assets;
      const repeated=page.waitForEvent('download');await button.click();await repeated;
      assert.equal(assets,before,'Repeat uses cached PNG');
      await page.getByRole('button',{name:'Kembali',exact:true}).click();
      await page.getByRole('button',{name:'Unduh kartu pedagang',exact:true}).click();
      fail=true;
      await page.getByRole('button',{name:'Unduh Depan',exact:true}).click();
      await page.getByText(/Gambar gagal dimuat/).first().waitFor({timeout:45000});
      assert.equal(await button.isDisabled(),false,'Failure restores controls');
      console.log(`PASS actual page: ${theme} ${width}, backdrop, double-click, repeat cache, image failure`);
      await context.close();
    }
  } finally { await browser.close(); }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
