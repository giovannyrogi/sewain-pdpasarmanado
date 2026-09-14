const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const sharp = require('sharp');
const webpack = require('next/dist/compiled/webpack/webpack');
webpack.init();
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'out/card-export');
async function main() {
  await new Promise((resolve,reject) => webpack.webpack({ mode:'development',devtool:false,
    entry:path.join(__dirname,'trader-card-export-fixture.jsx'),output:{path:output,filename:'fixture.js'},
    resolve:{extensions:['.js','.jsx'],alias:{'@':root}},
    plugins:[new webpack.webpack.DefinePlugin({'process.env.NEXT_PUBLIC_APP_BASE_URL':JSON.stringify('http://localhost:3000')})],
    module:{rules:[{test:/\.jsx?$/,exclude:/node_modules/,use:path.join(__dirname,'trader-card-babel-loader.cjs')}]},
  },(error,stats)=>error||stats.hasErrors()?reject(error||Error(stats.toString({all:false,errors:true}))):resolve()));
  const requests=[];
  const server=http.createServer((req,res)=>{
    const url=new URL(req.url,'http://localhost');
    requests.push(url.pathname+url.search);
    if(url.pathname==='/') {res.setHeader('Content-Type','text/html');res.end('<div id="root"></div><script src="/fixture.js"></script>');return;}
    const file=url.pathname==='/fixture.js'?path.join(output,'fixture.js'):path.join(root,'public',url.pathname);
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return;}
    res.setHeader('Content-Type',file.endsWith('.png')?'image/png':'application/javascript');
    res.setHeader('Cache-Control','public, max-age=3600'); res.end(fs.readFileSync(file));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
  let browser;
  const timings=[];
  try {
    browser=await chromium.launch({channel:'chrome',headless:true});
    for(const count of [1,2,10]) for(const mode of ['back','front','both']) {
      const page=await browser.newPage();
      page.on('pageerror', error => console.error('Browser:', error.message));
      await page.goto(`http://127.0.0.1:${server.address().port}`);
      await page.waitForFunction(()=>window.exportCardTest);
      await page.evaluate(()=>window.testCardCache());
      requests.length=0;
      const first=await page.evaluate(([n,s])=>window.exportCardTest(n,s),[count,mode]);
      assert.ok(first.dimensions.every(([w,h])=>w===1016&&h===638));
      if(mode==='back') assert.ok(!requests.some(url=>url.includes('front')||url.includes('depan')));
      assert.ok(!requests.some(url=>url.includes('?')),'No time-based cache busting');
      const repeat=await page.evaluate(([n,s])=>window.exportCardTest(n,s),[count,mode]);
      assert.equal(repeat.rendered,0,'Repeated PNGs reuse session cache');
      const bytes=await page.evaluate(async()=>Array.from(new Uint8Array(await window.lastCardBlob.arrayBuffer())));
      const png=Buffer.from(bytes);
      assert.equal((await sharp(png).metadata()).density,300);
      fs.writeFileSync(path.join(output,`${count}-${mode}.png`),png);
      await page.close();
      const baseline=await browser.newPage();
      await baseline.goto(`http://127.0.0.1:${server.address().port}`);
      await baseline.waitForFunction(()=>window.exportCardTest);
      const before=await baseline.evaluate(([n,s])=>window.exportCardTest(n,s,true),[count,mode]);
      timings.push({count,mode,beforeMs:before.ms,afterMs:first.ms,repeatMs:repeat.ms});
      console.log(JSON.stringify(timings.at(-1)));
      await baseline.close();
    }
    fs.writeFileSync(path.join(output,'timings.json'),JSON.stringify(timings,null,2));
    console.log('PASS: real PNG render, DPI, side-only network, LRU, repeated export and baseline comparison');
  } finally {if(browser) await browser.close();await new Promise(resolve=>server.close(resolve));}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
