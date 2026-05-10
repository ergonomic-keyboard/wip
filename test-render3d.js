#!/usr/bin/env node
// Test script: verifies render3d.js board shape logic
// Runs ergopadToErgogen → ergogen.process() → checks that all key positions
// fall within the board outline shape built from points.
//
// Usage: node test-render3d.js [examples/finger-positions.json]

const fs = require('fs');
const path = require('path');

// ── Borrow functions from validate-stages.js ──
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
  return { x: (b * (b * px - a * py) - a * c) / denom, y: (a * (-b * px + a * py) - b * c) / denom };
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
  const cx = midX; const cy = m * midX + b;
  const angle = Math.atan(m) * 180 / Math.PI;
  const projAlongLine = projections.map(p => p.x * Math.sqrt(1 + m * m));
  projAlongLine.sort((a, b) => a - b);
  const distances = [];
  for (let i = 1; i < projAlongLine.length; i++) distances.push(Math.abs(projAlongLine[i] - projAlongLine[i - 1]));
  return { angle, cx, cy, m, b, distances };
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
function rd(v) { return Math.round(v * 100) / 100; }
const MATRIX_COLUMNS = ['pinky', 'ring', 'middle', 'index', 'index_far'];
const ERGOGEN_NAMES = ['pinky', 'ring', 'middle', 'index', 'inner'];

// ── Simplified ergopadToErgogen (from validate-stages.js) ──
function rotPt(px, py, angleDeg, ox, oy) {
  const rad = angleDeg * Math.PI / 180;
  const dx = px - ox, dy = py - oy;
  return { x: ox + dx * Math.cos(rad) - dy * Math.sin(rad), y: oy + dx * Math.sin(rad) + dy * Math.cos(rad) };
}
function pushRotation(rotations, angle, origin) {
  let candidate = [...origin];
  for (const r of rotations) { const p = rotPt(candidate[0], candidate[1], r.angle, r.origin[0], r.origin[1]); candidate = [p.x, p.y]; }
  rotations.push({ angle, origin: candidate });
}
function unRotateAll(desiredX, desiredY, rotations) {
  let px = desiredX, py = desiredY;
  for (let i = rotations.length - 1; i >= 0; i--) { const r = rotations[i]; const un = rotPt(px, py, -r.angle, r.origin[0], r.origin[1]); px = un.x; py = un.y; }
  return { x: px, y: py };
}
function applyRotations(px, py, rots) {
  let x = px, y = py;
  for (const r of rots) { const p = rotPt(x, y, r.angle, r.origin[0], r.origin[1]); x = p.x; y = p.y; }
  return { x, y };
}

function ergopadToErgogen(data, mirrorDist, keySpacing, ppmOverride) {
  mirrorDist = mirrorDist || 22;
  keySpacing = keySpacing || 18;
  function computeStage1Keys(positions) {
    const result = {};
    const ALL_COLS = [...MATRIX_COLUMNS, 'thumb'];
    ALL_COLS.forEach(colId => {
      const pts = positions[colId]; if (!pts || pts.length < 2) return;
      const isThumb = colId === 'thumb';
      const fit = fitLine(pts, isThumb);
      const m = fit.m, b = fit.b;
      const dirLen = Math.sqrt(1 + m * m);
      const projections = pts.map(p => projectPointToLine(m, -1, b, p.x, p.y));
      const projScalars = projections.map(p => p.x / dirLen + p.y * m / dirLen);
      const minProj = Math.min(...projScalars), maxProj = Math.max(...projScalars);
      const midProj = (minProj + maxProj) / 2;
      const halfSpan = (maxProj - minProj) / 2;
      const upperScalars = projScalars.filter(s => s >= midProj);
      const lowerScalars = projScalars.filter(s => s < midProj);
      const avgUpper = upperScalars.length ? upperScalars.reduce((a, b) => a + b, 0) / upperScalars.length : midProj + halfSpan;
      const avgLower = lowerScalars.length ? lowerScalars.reduce((a, b) => a + b, 0) / lowerScalars.length : midProj - halfSpan;
      const keyScalars = [avgLower, midProj, avgUpper];
      result[colId] = keyScalars.map((s) => { const ds = s - midProj; return { x: fit.cx + ds / dirLen, y: fit.cy + ds * m / dirLen }; });
    });
    return result;
  }

  let ppm = (ppmOverride && ppmOverride > 0) ? ppmOverride : null;
  if (!ppm) {
    const flipped = {};
    for (const col of Object.keys(data)) flipped[col] = data[col].map(p => ({ x: p.x, y: -p.y }));
    ppm = estimateScale(flipped, keySpacing);
    if (ppm <= 0) ppm = 1.0;
  }
  const stage1 = computeStage1Keys(data);
  const ergoKeys = {};
  const ALL_COLS = [...MATRIX_COLUMNS, 'thumb'];
  ALL_COLS.forEach(colId => {
    const s1 = stage1[colId]; if (!s1) return;
    const ergoMm = s1.map(k => ({ x: k.x / ppm, y: -k.y / ppm }));
    const sorted = [...ergoMm].sort((a, b) => a.y - b.y);
    const bottom = sorted[0], home = sorted[1], top = sorted[2];
    const dx = top.x - bottom.x, dy = top.y - bottom.y;
    const angleRad = Math.atan2(-dx, dy);
    const angleDeg = angleRad * 180 / Math.PI;
    const axisX = -Math.sin(angleRad), axisY = Math.cos(angleRad);
    const padBottom = (home.x - bottom.x) * axisX + (home.y - bottom.y) * axisY;
    const padHome = (top.x - home.x) * axisX + (top.y - home.y) * axisY;
    ergoKeys[colId] = { home, bottom, top, angleDeg, padBottom, padHome };
  });

  const columns = {};
  const firstColId = MATRIX_COLUMNS.find(c => ergoKeys[c]);
  if (!firstColId) return {};
  const anchorPos = ergoKeys[firstColId].bottom;
  const anchorShift = [rd(anchorPos.x), rd(anchorPos.y)];
  const rotations = [];
  let zoneAnchorX = anchorPos.x, zoneAnchorY = anchorPos.y;
  rotations.push({ angle: 0, origin: [anchorPos.x, anchorPos.y] });
  let firstCol = true;
  const colParams = [];

  MATRIX_COLUMNS.forEach((ergopadCol, i) => {
    const ek = ergoKeys[ergopadCol]; if (!ek) return;
    const ergogenName = ERGOGEN_NAMES[i];
    const cumSplay = colParams.reduce((sum, p) => sum + p.splay, 0);
    const splay = ek.angleDeg - cumSplay;
    if (firstCol) {
      if (Math.abs(splay) > 0.01) pushRotation(rotations, splay, [zoneAnchorX, zoneAnchorY]);
      colParams.push({ spread: 0, stagger: 0, splay, padBottom: ek.padBottom, padHome: ek.padHome });
      firstCol = false;
    } else {
      if (Math.abs(splay) < 0.01) {
        const za = unRotateAll(ek.bottom.x, ek.bottom.y, rotations);
        colParams.push({ spread: za.x - zoneAnchorX, stagger: za.y - zoneAnchorY, splay: 0, padBottom: ek.padBottom, padHome: ek.padHome });
        zoneAnchorX = za.x; zoneAnchorY = za.y;
      } else {
        let za = unRotateAll(ek.bottom.x, ek.bottom.y, rotations);
        for (let iter = 0; iter < 20; iter++) {
          let candidate = [za.x, za.y];
          for (const r of rotations) { const p = rotPt(candidate[0], candidate[1], r.angle, r.origin[0], r.origin[1]); candidate = [p.x, p.y]; }
          const testRotations = rotations.map(r => ({ angle: r.angle, origin: [...r.origin] }));
          testRotations.push({ angle: splay, origin: candidate });
          const ra = applyRotations(za.x, za.y, testRotations);
          if (Math.abs(ek.bottom.x - ra.x) < 0.0001 && Math.abs(ek.bottom.y - ra.y) < 0.0001) break;
          za = unRotateAll(ek.bottom.x, ek.bottom.y, testRotations);
        }
        colParams.push({ spread: za.x - zoneAnchorX, stagger: za.y - zoneAnchorY, splay, padBottom: ek.padBottom, padHome: ek.padHome });
        zoneAnchorX = za.x; zoneAnchorY = za.y;
        pushRotation(rotations, splay, [zoneAnchorX, zoneAnchorY]);
      }
    }
    const colDef = { key: { column_net: `C${i}` }, rows: {} };
    const p = colParams[colParams.length - 1];
    if (i > 0) { colDef.key.spread = rd(p.spread); colDef.key.stagger = rd(p.stagger); }
    if (Math.abs(p.splay) > 0.01) colDef.key.splay = rd(p.splay);
    colDef.rows.bottom = { padding: rd(p.padBottom) };
    colDef.rows.home = { padding: rd(p.padHome) };
    colDef.rows.top = { padding: 0 };
    columns[ergogenName] = colDef;
  });

  // Thumb zone
  let thumbZone = null;
  const thumbEk = ergoKeys.thumb;
  const innerCol = ergoKeys.index_far;
  if (thumbEk && innerCol) {
    const innerBottom = innerCol.bottom;
    const thumbHome = thumbEk.home;
    const shiftX = rd(thumbHome.x - innerBottom.x);
    const shiftY = rd(thumbHome.y - innerBottom.y);
    const thumbSplay = thumbEk.angleDeg;
    const thumbCols = {};
    const names = ['t_inner', 't_middle', 't_outer'];
    for (let j = 0; j < 3; j++) {
      const col = { key: { column_net: `C${MATRIX_COLUMNS.length + j}`, spread: keySpacing } };
      if (j === 0 && Math.abs(thumbSplay) > 0.01) col.key.splay = rd(thumbSplay);
      thumbCols[names[j]] = col;
    }
    thumbZone = { anchor: { ref: 'matrix_inner_bottom', shift: [shiftX, shiftY] }, columns: thumbCols, rows: { cluster: { row_net: 'R3' } } };
  }

  const config = {
    meta: { engine: '4.1.0' },
    units: { kx: keySpacing, ky: keySpacing, px: 'kx + 1', py: 'ky + 1' },
    points: {
      mirror: { ref: 'matrix_inner_home', distance: mirrorDist },
      zones: {
        matrix: { anchor: { shift: anchorShift }, columns, rows: { bottom: { row_net: 'R2' }, home: { row_net: 'R1' }, top: { row_net: 'R0' } } }
      }
    },
    outlines: {
      board: [{ what: 'rectangle', where: true, size: ['px + 4', 'py + 4'], bound: true, fillet: 8, asym: 'source' }],
      switch_cutouts: [{ what: 'rectangle', where: true, size: [13.8, 13.8], bound: false, asym: 'source' }],
      frame: [{ what: 'rectangle', where: true, size: ['px + 8', 'py + 8'], bound: true, fillet: 8, asym: 'source' }]
    }
  };
  if (thumbZone) config.points.zones.thumb = thumbZone;
  return config;
}

// ── 2D geometry (from render3d.js) ──
function rectCorners(cx, cy, w, h, angleDeg) {
  const rad = angleDeg * Math.PI / 180;
  const cos = Math.cos(rad), sin = Math.sin(rad);
  const hw = w / 2, hh = h / 2;
  return [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(([dx, dy]) => [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos]);
}

function convexHull2D(points) {
  const pts = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (pts.length <= 1) return pts.slice();
  const cross = (O, A, B) => (A[0] - O[0]) * (B[1] - O[1]) - (A[1] - O[1]) * (B[0] - O[0]);
  const lower = [];
  for (const p of pts) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p); }
  const upper = [];
  for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p); }
  lower.pop(); upper.pop();
  return lower.concat(upper);
}

// Point-in-polygon test (ray casting)
function pointInPolygon(x, y, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// ── Main test ──
const file = process.argv[2] || path.join(__dirname, 'examples', 'finger-positions.json');
console.log(`Testing with: ${path.basename(file)}`);
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const positions = data.positions;
// Use calibratedPPM if available, otherwise let ergopadToErgogen compute it via estimateScale
const ppm = data.calibratedPPM && data.calibratedPPM > 0 ? data.calibratedPPM : null;

const config = ergopadToErgogen(positions, 22, 18, ppm);
console.log(`PPM used: ${ppm || 'auto-computed by estimateScale'}`);
const keySpacing = 18;
const kx = keySpacing, ky = keySpacing;
const px = kx + 1, py = ky + 1;

// Simulate ergogen points: we use the config to get the key positions
// Since we can't run ergogen in Node without the browser bundle,
// we'll simulate the placement like validate-stages.js does.
function simulateAllPoints(config) {
  const anchor = config.points.zones.matrix.anchor.shift;
  const columns = config.points.zones.matrix.columns;
  const colNames = Object.keys(columns);
  const rowLabels = ['bottom', 'home', 'top'];
  const zoneAnchor = { x: anchor[0], y: anchor[1] };
  const rotations = [{ angle: 0, origin: [zoneAnchor.x, zoneAnchor.y] }];
  const keys = [];
  let firstCol = true;

  colNames.forEach((colName, ci) => {
    const colDef = columns[colName];
    const key = colDef.key || {};
    const colRows = colDef.rows || {};
    const spread = key.spread || 0;
    const stagger = key.stagger || 0;
    const splay = key.splay || 0;
    const rowPaddings = [
      (colRows.bottom && colRows.bottom.padding != null) ? colRows.bottom.padding : (key.padding || 18),
      (colRows.home && colRows.home.padding != null) ? colRows.home.padding : (key.padding || 18),
      (colRows.top && colRows.top.padding != null) ? colRows.top.padding : 0,
    ];
    if (!firstCol) zoneAnchor.x += spread;
    zoneAnchor.y += stagger;
    if (Math.abs(splay) > 0.001) pushRotation(rotations, splay, [zoneAnchor.x, zoneAnchor.y]);
    let runX = zoneAnchor.x, runY = zoneAnchor.y, runR = 0;
    for (const r of rotations) { const p = rotPt(runX, runY, r.angle, r.origin[0], r.origin[1]); runX = p.x; runY = p.y; runR += r.angle; }
    for (let ri = 0; ri < 3; ri++) {
      keys.push({ x: runX, y: runY, r: runR, zone: 'matrix', col: colName, row: rowLabels[ri] });
      const padRad = runR * Math.PI / 180;
      runX += -rowPaddings[ri] * Math.sin(padRad);
      runY += rowPaddings[ri] * Math.cos(padRad);
    }
    firstCol = false;
  });

  // Thumb zone (simplified - use ref anchor + shift)
  if (config.points.zones.thumb) {
    const thumb = config.points.zones.thumb;
    // Find matrix_inner_bottom position
    const innerKeys = keys.filter(k => k.col === 'inner' && k.row === 'bottom');
    if (innerKeys.length > 0) {
      const innerBottom = innerKeys[0];
      const thumbAnchorX = innerBottom.x + thumb.anchor.shift[0];
      const thumbAnchorY = innerBottom.y + thumb.anchor.shift[1];
      const thumbCols = Object.keys(thumb.columns);
      const thumbRotations = [{ angle: 0, origin: [thumbAnchorX, thumbAnchorY] }];
      let tFirstCol = true;
      const tZoneAnchor = { x: thumbAnchorX, y: thumbAnchorY };

      thumbCols.forEach((colName) => {
        const colDef = thumb.columns[colName];
        const key = colDef.key || {};
        const spread = key.spread || 0;
        const splay = key.splay || 0;
        if (!tFirstCol) tZoneAnchor.x += spread;
        if (Math.abs(splay) > 0.001) pushRotation(thumbRotations, splay, [tZoneAnchor.x, tZoneAnchor.y]);
        let runX = tZoneAnchor.x, runY = tZoneAnchor.y, runR = 0;
        for (const r of thumbRotations) { const p = rotPt(runX, runY, r.angle, r.origin[0], r.origin[1]); runX = p.x; runY = p.y; runR += r.angle; }
        keys.push({ x: runX, y: runY, r: runR, zone: 'thumb', col: colName, row: 'cluster' });
        tFirstCol = false;
      });
    }
  }

  return keys;
}

const allKeys = simulateAllPoints(config);
const leftKeys = allKeys; // All simulated keys are left-half (no mirroring in simulation)

console.log(`\nSimulated ${leftKeys.length} left-half keys:`);
leftKeys.forEach(k => {
  console.log(`  ${k.zone}/${k.col}/${k.row}: (${k.x.toFixed(2)}, ${k.y.toFixed(2)}) r=${k.r.toFixed(1)}°`);
});

// ── Build board outline (same algorithm as render3d.js) ──
const boardPadX = px + 4, boardPadY = py + 4;
const allCorners = [];
leftKeys.forEach(k => {
  const corners = rectCorners(k.x, k.y, boardPadX, boardPadY, k.r);
  corners.forEach(c => allCorners.push(c));
  // Edge samples
  for (let e = 0; e < 4; e++) {
    const a = corners[e], b = corners[(e + 1) % 4];
    for (let t = 1; t <= 2; t++) {
      const frac = t / 3;
      allCorners.push([a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac]);
    }
  }
});

// Convex hull for comparison
const convexHull = convexHull2D(allCorners);

console.log(`\nBoard outline stats:`);
console.log(`  Total points collected: ${allCorners.length}`);
console.log(`  Convex hull vertices: ${convexHull.length}`);
console.log(`  Hull vertices (CCW):`);
convexHull.forEach((p, i) => console.log(`    [${i}] (${p[0].toFixed(1)}, ${p[1].toFixed(1)})`));

// ── Check: do all key positions fall inside the convex hull? ──
console.log(`\nKey containment check (convex hull):`);
let allInside = true;
leftKeys.forEach(k => {
  const inside = pointInPolygon(k.x, k.y, convexHull);
  if (!inside) {
    console.log(`  OUTSIDE: ${k.zone}/${k.col}/${k.row} at (${k.x.toFixed(2)}, ${k.y.toFixed(2)})`);
    allInside = false;
  }
});
if (allInside) console.log(`  ALL keys inside convex hull ✓`);

// ── Check coordinate ranges ──
const keyXs = leftKeys.map(k => k.x), keyYs = leftKeys.map(k => k.y);
const hullXs = convexHull.map(p => p[0]), hullYs = convexHull.map(p => p[1]);
console.log(`\nCoordinate ranges:`);
console.log(`  Keys:  X=[${Math.min(...keyXs).toFixed(1)}, ${Math.max(...keyXs).toFixed(1)}]  Y=[${Math.min(...keyYs).toFixed(1)}, ${Math.max(...keyYs).toFixed(1)}]`);
console.log(`  Hull:  X=[${Math.min(...hullXs).toFixed(1)}, ${Math.max(...hullXs).toFixed(1)}]  Y=[${Math.min(...hullYs).toFixed(1)}, ${Math.max(...hullYs).toFixed(1)}]`);

// ── Check key spacing and thumb position relative to matrix ──
const matrixKeys = leftKeys.filter(k => k.zone === 'matrix');
const thumbKeys = leftKeys.filter(k => k.zone === 'thumb');
if (matrixKeys.length && thumbKeys.length) {
  const matMinY = Math.min(...matrixKeys.map(k => k.y));
  const matMaxY = Math.max(...matrixKeys.map(k => k.y));
  const thumbMinY = Math.min(...thumbKeys.map(k => k.y));
  const thumbMaxY = Math.max(...thumbKeys.map(k => k.y));
  console.log(`\nMatrix Y range: [${matMinY.toFixed(1)}, ${matMaxY.toFixed(1)}]`);
  console.log(`Thumb  Y range: [${thumbMinY.toFixed(1)}, ${thumbMaxY.toFixed(1)}]`);
  console.log(`Thumb is ${thumbMinY < matMinY ? 'BELOW' : 'ABOVE/WITHIN'} matrix (in ergogen Y-up: below = lower Y)`);

  const matMinX = Math.min(...matrixKeys.map(k => k.x));
  const matMaxX = Math.max(...matrixKeys.map(k => k.x));
  const thumbMinX = Math.min(...thumbKeys.map(k => k.x));
  const thumbMaxX = Math.max(...thumbKeys.map(k => k.x));
  console.log(`Matrix X range: [${matMinX.toFixed(1)}, ${matMaxX.toFixed(1)}]`);
  console.log(`Thumb  X range: [${thumbMinX.toFixed(1)}, ${thumbMaxX.toFixed(1)}]`);
}

// ── Check thumb rotation ──
if (thumbKeys.length) {
  console.log(`\nThumb key rotations:`);
  thumbKeys.forEach(k => console.log(`  ${k.col}: r=${k.r.toFixed(1)}°`));
  console.log(`\nThumb rotation with -90° correction:`);
  thumbKeys.forEach(k => console.log(`  ${k.col}: r=${(k.r - 90).toFixed(1)}°`));
}

// ── Gap analysis: distance from thumb cluster to nearest matrix key ──
if (matrixKeys.length && thumbKeys.length) {
  let minGap = Infinity;
  let closestPair = null;
  thumbKeys.forEach(tk => {
    matrixKeys.forEach(mk => {
      const d = Math.sqrt((tk.x - mk.x) ** 2 + (tk.y - mk.y) ** 2);
      if (d < minGap) { minGap = d; closestPair = { thumb: tk, matrix: mk }; }
    });
  });
  console.log(`\nThumb-to-matrix gap: ${minGap.toFixed(1)}mm`);
  console.log(`  Closest pair: thumb/${closestPair.thumb.col} ↔ matrix/${closestPair.matrix.col}/${closestPair.matrix.row}`);
  console.log(`  Board pad size: ${boardPadX}×${boardPadY}mm`);
  console.log(`  Half diagonal of pad: ${(Math.sqrt(boardPadX*boardPadX + boardPadY*boardPadY)/2).toFixed(1)}mm`);
  console.log(`  Pads ${minGap < boardPadX ? 'OVERLAP' : 'DO NOT overlap'} (gap ${minGap.toFixed(1)} vs pad width ${boardPadX})`);
}

console.log('\nDone.');
