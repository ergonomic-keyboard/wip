#!/usr/bin/env node
// Validation: compares stage 1 (canvas switch rectangles) with stage 2
// (ergopadToErgogen → ergogen key positions) to ensure they match.
//
// Usage: node validate-stages.js examples/finger-positions.json

const fs = require('fs');
const path = require('path');

// ── Math functions (copied from wizard.html) ──

function leastSquaresLine(points, invertXY = false) {
  const n = points.length;
  let xs = points.map(p => p.x), ys = points.map(p => p.y);
  if (invertXY) { [xs, ys] = [ys, xs]; }
  const sx = xs.reduce((a, b) => a + b, 0);
  const sy = ys.reduce((a, b) => a + b, 0);
  const sxx = xs.reduce((a, x) => a + x * x, 0);
  const sxy = xs.reduce((a, x, i) => a + x * ys[i], 0);
  const denom = n * sxx - sx * sx;
  if (Math.abs(denom) < 1e-12) return { m: 0, b: sy / n };
  const slope = (n * sxy - sx * sy) / denom;
  const intercept = (sy - slope * sx) / n;
  if (invertXY) {
    if (Math.abs(slope) < 1e-12) return { m: 0, b: intercept };
    return { m: 1 / slope, b: -intercept / slope };
  }
  return { m: slope, b: intercept };
}

function projectPointToLine(a, b, c, px, py) {
  const denom = a * a + b * b;
  return {
    x: (b * (b * px - a * py) - a * c) / denom,
    y: (a * (-b * px + a * py) - b * c) / denom,
  };
}

function fitLine(points, isThumb = false) {
  const n = points.length;
  if (n === 0) return { angle: 0, cx: 0, cy: 0, m: 0, b: 0, distances: [] };
  if (n === 1) return { angle: 0, cx: points[0].x, cy: points[0].y, m: 0, b: 0, distances: [] };
  const { m, b } = leastSquaresLine(points, !isThumb);
  const projections = points.map(p => projectPointToLine(m, -1, b, p.x, p.y));
  const projXs = projections.map(p => p.x);
  const minX = Math.min(...projXs), maxX = Math.max(...projXs);
  const midX = (minX + maxX) / 2;
  const cx = midX;
  const cy = m * midX + b;
  const angle = Math.atan(m) * 180 / Math.PI;
  const projAlongLine = projections.map(p => p.x * Math.sqrt(1 + m * m));
  projAlongLine.sort((a, b) => a - b);
  const distances = [];
  for (let i = 1; i < projAlongLine.length; i++) distances.push(Math.abs(projAlongLine[i] - projAlongLine[i - 1]));
  return { angle, cx, cy, m, b, distances };
}

function analyzeColumn(points, isThumb = false) {
  if (!points || !points.length) return null;
  const { angle, cx, cy, distances } = fitLine(points, isThumb);
  const padding = distances.length ? distances.reduce((a, b) => a + b, 0) / distances.length : 18.0;
  return { center: [cx, cy], angle, padding, nKeys: points.length };
}

function estimateScale(data, keySpacing) {
  const allDist = [];
  for (const col of Object.keys(data)) {
    if (data[col].length < 2) continue;
    const { distances } = fitLine(data[col], col === 'thumb');
    allDist.push(...distances);
  }
  if (!allDist.length) return 1.0;
  const avg = allDist.reduce((a, b) => a + b, 0) / allDist.length;
  return avg < 0.01 ? 1.0 : avg / keySpacing;
}

const MATRIX_COLUMNS = ['pinky', 'ring', 'middle', 'index', 'index_far'];
const ALL_COLUMNS = ['pinky', 'ring', 'middle', 'index', 'index_far', 'thumb'];

// ── Stage 1: Canvas switch rectangle positions ──
// This replicates the drawCanvas() logic: Y-flip, scale to mm, analyzeColumn,
// place 3 keys using center+padding along axis, convert back to canvas space.
// This is now the SAME algorithm as stage 2.

function computeStage1Positions(positions, ppm) {
  const results = {};

  ALL_COLUMNS.forEach(colId => {
    const pts = positions[colId];
    if (!pts || pts.length < 2) return;
    const isThumb = colId === 'thumb';

    // Y-flip and scale to mm (same as ergopadToErgogen)
    const scaledPts = pts.map(p => ({ x: p.x / ppm, y: -p.y / ppm }));
    const info = analyzeColumn(scaledPts, isThumb);
    if (!info) return;
    const nRows = Math.min(info.nKeys, 3);
    const rad = info.angle * Math.PI / 180;
    const axX = Math.sin(rad), axY = Math.cos(rad);

    const keys = [];
    for (let r = 0; r < nRows; r++) {
      const offset = r - (nRows - 1) / 2;
      const ex = info.center[0] + axX * offset * info.padding; // mm
      const ey = info.center[1] + axY * offset * info.padding; // mm
      // Convert back to canvas space
      const canvasX = ex * ppm;
      const canvasY = -ey * ppm;
      keys.push({
        x: canvasX, y: canvasY,
        angleDeg: info.angle,
        row: r, label: ['bottom', 'home', 'top'][r],
      });
    }

    // Compute rotation in canvas space from key positions
    if (keys.length >= 2) {
      const first = keys[0], last = keys[keys.length - 1];
      const rotRad = Math.atan2(last.y - first.y, last.x - first.x);
      keys.forEach(k => k.rotationRad = rotRad);
    } else {
      keys.forEach(k => k.rotationRad = 0);
    }

    results[colId] = keys;
  });

  return results;
}

// ── Stage 2: ergopadToErgogen → ergogen key positions (in canvas space) ──
// This replicates computeErgogenPreview() which mirrors ergopadToErgogen's logic.

function computeStage2Positions(positions, ppm) {
  const results = {};

  // Flip Y and scale to mm (same as ergopadToErgogen)
  const flipped = {};
  for (const col of Object.keys(positions)) {
    flipped[col] = positions[col].map(p => ({ x: p.x, y: -p.y }));
  }
  const scaled = {};
  for (const col of Object.keys(flipped)) {
    scaled[col] = flipped[col].map(p => ({ x: p.x / ppm, y: p.y / ppm }));
  }

  // Analyze matrix columns
  const analyses = {};
  for (const col of MATRIX_COLUMNS) {
    if (scaled[col] && scaled[col].length) analyses[col] = analyzeColumn(scaled[col]);
  }

  // Matrix columns
  MATRIX_COLUMNS.forEach(colId => {
    const info = analyses[colId];
    if (!info) return;
    const nRows = Math.min(info.nKeys, 3);
    const rad = info.angle * Math.PI / 180;
    const axX = Math.sin(rad), axY = Math.cos(rad);

    const keys = [];
    for (let r = 0; r < nRows; r++) {
      const offset = r - (nRows - 1) / 2;
      const ex = info.center[0] + axX * offset * info.padding; // mm
      const ey = info.center[1] + axY * offset * info.padding; // mm
      // Convert back to canvas space
      const canvasX = ex * ppm;
      const canvasY = -ey * ppm;
      keys.push({
        x: canvasX,
        y: canvasY,
        angleDeg: info.angle,
        rotationRad: info.angle * Math.PI / 180,
        row: r,
        label: ['bottom', 'home', 'top'][r],
      });
    }
    results[colId] = keys;
  });

  // Thumb
  const thumbPts = scaled.thumb || [];
  if (thumbPts.length >= 2) {
    const thumbInfo = analyzeColumn(thumbPts, true);
    const nRows = Math.min(thumbInfo.nKeys, 3);
    const rad = thumbInfo.angle * Math.PI / 180;
    const axX = Math.sin(rad), axY = Math.cos(rad);
    const keys = [];
    for (let r = 0; r < nRows; r++) {
      const offset = r - (nRows - 1) / 2;
      const ex = thumbInfo.center[0] + axX * offset * thumbInfo.padding;
      const ey = thumbInfo.center[1] + axY * offset * thumbInfo.padding;
      keys.push({
        x: ex * ppm, y: -ey * ppm,
        angleDeg: thumbInfo.angle,
        rotationRad: thumbInfo.angle * Math.PI / 180,
        row: r, label: ['bottom', 'home', 'top'][r],
      });
    }
    results.thumb = keys;
  }

  return results;
}

// ── Main ──

const files = process.argv.slice(2);
if (!files.length) {
  // Default: run all examples
  const exDir = path.join(__dirname, 'examples');
  if (fs.existsSync(exDir)) {
    fs.readdirSync(exDir).filter(f => f.endsWith('.json')).forEach(f => files.push(path.join(exDir, f)));
  }
}

if (!files.length) {
  console.error('Usage: node validate-stages.js [file1.json] [file2.json] ...');
  process.exit(1);
}

let allPass = true;

files.forEach(file => {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`FILE: ${path.basename(file)}`);
  console.log('═'.repeat(60));

  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const positions = data.positions;
  const ppm = data.calibratedPPM || 1.0;

  console.log(`  PPM: ${ppm}`);

  const stage1 = computeStage1Positions(positions, ppm);
  const stage2 = computeStage2Positions(positions, ppm);

  ALL_COLUMNS.forEach(colId => {
    const s1 = stage1[colId];
    const s2 = stage2[colId];
    if (!s1 && !s2) return;
    if (!s1 || !s2) {
      console.log(`  ${colId}: MISSING in ${!s1 ? 'stage1' : 'stage2'}`);
      allPass = false;
      return;
    }

    console.log(`\n  ${colId.toUpperCase()} (${positions[colId].length} taps):`);

    // Compare center (home key)
    const nCompare = Math.min(s1.length, s2.length);
    for (let r = 0; r < nCompare; r++) {
      const k1 = s1[r], k2 = s2[r];
      const dx = k1.x - k2.x;
      const dy = k1.y - k2.y;
      const distPx = Math.sqrt(dx * dx + dy * dy);
      const distMm = distPx / ppm;

      // Both stages now use the same analyzeColumn algorithm, so angleDeg should match
      const angleDiff = Math.abs((k1.angleDeg || 0) - (k2.angleDeg || 0));

      const posOk = distMm < 0.01;  // < 0.01mm tolerance (should be exact)
      const rotOk = angleDiff < 0.01;
      const status = (posOk && rotOk) ? 'OK' : 'MISMATCH';
      if (!posOk || !rotOk) allPass = false;

      console.log(`    ${k1.label}: [${status}]`);
      console.log(`      Stage1: (${k1.x.toFixed(1)}, ${k1.y.toFixed(1)}) angle=${(k1.angleDeg||0).toFixed(2)}°`);
      console.log(`      Stage2: (${k2.x.toFixed(1)}, ${k2.y.toFixed(1)}) angle=${(k2.angleDeg||0).toFixed(2)}°`);
      console.log(`      Δpos=${distMm.toFixed(4)}mm (${distPx.toFixed(2)}px)  Δangle=${angleDiff.toFixed(4)}°`);
    }

    // Check row spacing
    if (s1.length >= 2 && s2.length >= 2) {
      const s1Spacing = Math.sqrt((s1[2].x - s1[0].x) ** 2 + (s1[2].y - s1[0].y) ** 2) / ppm;
      const s2Spacing = Math.sqrt((s2[2].x - s2[0].x) ** 2 + (s2[2].y - s2[0].y) ** 2) / ppm;
      const spacingDiff = Math.abs(s1Spacing - s2Spacing);
      console.log(`    Span (bottom→top): Stage1=${s1Spacing.toFixed(2)}mm  Stage2=${s2Spacing.toFixed(2)}mm  Δ=${spacingDiff.toFixed(2)}mm`);
    }
  });
});

console.log(`\n${'═'.repeat(60)}`);
console.log(allPass ? 'ALL PASSED' : 'MISMATCHES FOUND');
console.log('═'.repeat(60));
process.exit(allPass ? 0 : 1);
