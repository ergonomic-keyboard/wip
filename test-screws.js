#!/usr/bin/env node
// Load wizard with default positions, navigate to 3D preview, capture screw logs
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8091;
const DIR = __dirname;

const server = http.createServer((req, res) => {
  let fp = path.join(DIR, req.url === '/' ? 'wizard.html' : decodeURIComponent(req.url).split('?')[0]);
  if (!fs.existsSync(fp)) { res.writeHead(404); res.end('Not found: ' + req.url); return; }
  const ext = path.extname(fp);
  const ct = { '.html': 'text/html', '.js': 'application/javascript', '.json': 'application/json', '.css': 'text/css', '.yaml': 'text/yaml' }[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': ct });
  res.end(fs.readFileSync(fp));
});

(async () => {
  server.listen(PORT);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const logs = [];
  page.on('console', msg => {
    const txt = msg.text();
    logs.push(txt);
  });

  await page.goto(`http://localhost:${PORT}/wizard.html`);
  await page.waitForTimeout(2000);

  // Load the default example finger positions
  const examplePath = path.join(DIR, 'examples', 'finger-positions.json');
  const data = JSON.parse(fs.readFileSync(examplePath, 'utf8'));

  // Inject positions into the wizard's state
  await page.evaluate((posData) => {
    // The wizard stores positions as { pinky: [{x,y},...], ring: [...], ... }
    const COLUMNS = ['pinky', 'ring', 'middle', 'index', 'index_far', 'thumb'];
    COLUMNS.forEach(col => {
      if (posData.columns && posData.columns[col]) {
        positions[col] = posData.columns[col];
      }
    });
    // Set canvas dimensions for PPM calculation
    if (posData.canvasWidth) {
      const canvas = document.getElementById('tap-canvas');
      if (canvas) { canvas.width = posData.canvasWidth; canvas.height = posData.canvasHeight; }
    }
    if (posData.calibratedPPM) {
      window.calibratedPPM = posData.calibratedPPM;
    }
  }, data);

  await page.waitForTimeout(500);

  // Navigate to page 2 (3D Preview)
  await page.evaluate(() => goToPage(2));

  // Wait for ergogen processing and 3D rendering
  await page.waitForTimeout(10000);

  // Filter and print relevant logs
  console.log('=== ALL RENDER3D LOGS ===');
  const relevant = logs.filter(l =>
    l.includes('screw') || l.includes('S07') || l.includes('render3d') ||
    l.includes('columns:') || l.includes('C4') || l.includes('C3') ||
    l.includes('C0') || l.includes('C2') || l.includes('thumb') ||
    l.includes('alt ') || l.includes('bbox') || l.includes('left keys') ||
    l.includes('dist to')
  );
  relevant.forEach(l => console.log(l));
  console.log(`\n=== ${relevant.length} relevant lines out of ${logs.length} total ===`);

  // Also dump the left key positions directly
  const keyDump = await page.evaluate(() => {
    if (!window.ergogenResults || !window.ergogenResults.points) return null;
    const pts = window.ergogenResults.points;
    const result = {};
    for (const [name, pt] of Object.entries(pts)) {
      if (!name.startsWith('mirror_')) {
        result[name] = { x: pt.x.toFixed(1), y: (-pt.y).toFixed(1), col: pt.meta?.column_net, row: pt.meta?.row_net, zone: pt.meta?.zone?.name };
      }
    }
    return result;
  });
  if (keyDump) {
    console.log('\n=== LEFT HALF KEY POSITIONS (model space: x, -y) ===');
    for (const [name, info] of Object.entries(keyDump)) {
      console.log(`  ${name}: (${info.x}, ${info.y}) col=${info.col} row=${info.row} zone=${info.zone}`);
    }
  }

  await browser.close();
  server.close();
})();
