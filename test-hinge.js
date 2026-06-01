#!/usr/bin/env node
// Quick test: verify hinge mechanism renders and fold animation works.
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DIR = __dirname;

const server = http.createServer((req, res) => {
  let fp = path.join(DIR, req.url === '/' ? 'wizard.html' : req.url);
  if (fp.includes('..')) { res.writeHead(403); res.end(); return; }
  const ext = path.extname(fp);
  const types = {'.html':'text/html','.js':'application/javascript','.css':'text/css',
    '.json':'application/json','.png':'image/png','.yaml':'text/yaml'};
  const mime = types[ext] || 'application/octet-stream';
  try {
    const data = fs.readFileSync(fp);
    res.writeHead(200, {'Content-Type': mime});
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not found: ' + req.url);
  }
});

server.listen(9234, async () => {
  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });

    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('http://localhost:9234/wizard.html');
    await page.waitForTimeout(2000);

    // Load example data
    const example = fs.readFileSync(path.join(DIR, 'examples/finger-positions.json'), 'utf8');
    await page.evaluate(data => {
      const parsed = JSON.parse(data);
      if (window.loadFingerData) window.loadFingerData(parsed);
    }, example);
    await page.waitForTimeout(1000);

    // Navigate to 3D preview
    await page.evaluate(() => { if (typeof goToPage === 'function') goToPage(2); });
    await page.waitForTimeout(5000);

    if (errors.length > 0) {
      console.log('JS ERRORS:');
      errors.forEach(e => console.log('  ' + e.substring(0, 200)));
    } else {
      console.log('OK: No JS errors during scene build.');
    }

    // Flat
    await page.screenshot({ path: path.join(DIR, 'runtime-screenshots/hinge-flat.png') });
    console.log('Screenshot: hinge-flat.png');

    // Tented (45°)
    await page.evaluate(() => { window._newSceneCtrl.applyFold(135); });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(DIR, 'runtime-screenshots/hinge-tented.png') });
    console.log('Screenshot: hinge-tented.png');

    // Closed (180°)
    await page.evaluate(() => { window._newSceneCtrl.applyFold(0); });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(DIR, 'runtime-screenshots/hinge-closed.png') });
    console.log('Screenshot: hinge-closed.png');

    // Get hardware selection info
    const info = await page.evaluate(() => {
      const ctrl = window._newSceneCtrl;
      const sel = ctrl.getHardwareSelection();
      return {
        foldHinge: sel.foldHinge,
        butterflyJoint: sel.butterflyJoint,
        bracket: sel.bracket,
        meshCount: (() => {
          let n = 0;
          ctrl.scene.traverse(o => { if (o.isMesh) n++; });
          return n;
        })(),
      };
    });
    console.log('Hardware:', JSON.stringify(info, null, 2));

    // Test switching to all 6 configurations
    const configs = [
      { foldHinge: 'pha-8mm', butterflyJoint: 'hirth-24t' },
      { foldHinge: 'pha-8mm', butterflyJoint: 'curvic-36t' },
      { foldHinge: 'pha-8mm', butterflyJoint: 'serrated-72t' },
      { foldHinge: 'bearing-pivot', butterflyJoint: 'hirth-24t' },
      { foldHinge: 'bearing-pivot', butterflyJoint: 'curvic-36t' },
      { foldHinge: 'bearing-pivot', butterflyJoint: 'serrated-72t' },
    ];

    for (const cfg of configs) {
      const result = await page.evaluate((c) => {
        const ctrl = window._newSceneCtrl;
        const sel = ctrl.getHardwareSelection();
        sel.foldHinge = c.foldHinge;
        sel.butterflyJoint = c.butterflyJoint;
        try {
          ctrl.rebuildHardware(sel);
          ctrl.applyFold(180); // flat
          ctrl.applyFold(135); // tent
          ctrl.applyFold(0);   // closed
          ctrl.applyFold(180); // back to flat
          return 'OK';
        } catch (e) {
          return 'ERROR: ' + e.message;
        }
      }, cfg);
      const label = cfg.foldHinge + ' + ' + cfg.butterflyJoint;
      console.log(label + ': ' + result);

      // Screenshot
      const fname = cfg.foldHinge + '-' + cfg.butterflyJoint + '.png';
      await page.screenshot({ path: path.join(DIR, 'runtime-screenshots/' + fname) });
    }

    console.log('\nDone. Check runtime-screenshots/ for visual verification.');
  } catch (e) {
    console.error('Test failed:', e.message);
  } finally {
    if (browser) await browser.close();
    server.close();
  }
});
