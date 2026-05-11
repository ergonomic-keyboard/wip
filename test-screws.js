#!/usr/bin/env node
// Load wizard with default positions, navigate to 3D preview, capture screw logs + screenshot
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8091;
const DIR = __dirname;

const server = http.createServer((req, res) => {
  let fp = path.join(DIR, decodeURIComponent(req.url).split('?')[0]);
  if (req.url === '/') fp = path.join(DIR, 'wizard.html');
  if (!fs.existsSync(fp)) { res.writeHead(404); res.end('Not found: ' + req.url); return; }
  const ext = path.extname(fp);
  const ct = { '.html': 'text/html', '.js': 'application/javascript', '.json': 'application/json', '.css': 'text/css', '.yaml': 'text/yaml' }[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': ct });
  res.end(fs.readFileSync(fp));
});

(async () => {
  server.listen(PORT);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  const logs = [];
  page.on('console', msg => logs.push(msg.text()));

  await page.goto(`http://localhost:${PORT}/wizard.html`);
  await page.waitForTimeout(2000);

  // Load example finger positions
  const examplePath = path.join(DIR, 'examples', 'finger-positions.json');
  const data = JSON.parse(fs.readFileSync(examplePath, 'utf8'));
  await page.evaluate((posData) => {
    const COLUMNS = ['pinky', 'ring', 'middle', 'index', 'index_far', 'thumb'];
    COLUMNS.forEach(col => {
      if (posData.columns && posData.columns[col]) positions[col] = posData.columns[col];
    });
    if (posData.canvasWidth) {
      const canvas = document.getElementById('tap-canvas');
      if (canvas) { canvas.width = posData.canvasWidth; canvas.height = posData.canvasHeight; }
    }
    if (posData.calibratedPPM) window.calibratedPPM = posData.calibratedPPM;
  }, data);

  await page.waitForTimeout(500);
  await page.evaluate(() => goToPage(2));
  await page.waitForTimeout(12000);

  // Print relevant logs
  console.log('=== SCREW PLACEMENT LOGS ===');
  logs.filter(l =>
    l.includes('screw') || l.includes('S07') || l.includes('alt') ||
    l.includes('WARNING') || l.includes('dist to') || l.includes('altKey') ||
    l.includes('retKey') || l.includes('thumb key') || l.includes('Key') ||
    l.includes('C4 keys') || l.includes('C0 keys') || l.includes('mKeys') ||
    l.includes('thumbScrew') || l.includes('label:')
  ).forEach(l => console.log(l));

  // Enable outlines for testing
  await page.evaluate(() => {
    const cb = document.getElementById('show-outlines');
    if (cb && !cb.checked) { cb.checked = true; cb.dispatchEvent(new Event('change')); }
  });
  await page.waitForTimeout(500);

  // Take screenshot of the 3D viewport
  const screenshotPath = path.join(DIR, 'screw-verification.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`\nScreenshot saved: ${screenshotPath}`);

  await browser.close();
  server.close();
})();
