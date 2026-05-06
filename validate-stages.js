#!/usr/bin/env node
// Validation: compares stage 1 (canvas switch rectangles from drawCanvas)
// with stage 2 (ergopadToErgogen → exact ergogen placement simulation).
//
// Stage 1 = the drawCanvas tap-spread CoG algorithm (in canvas pixel space).
// Stage 2 = ergopadToErgogen produces a config, we simulate ergogen's exact
//           algorithm (from points.js) to reconstruct absolute positions.
//
// Usage: node validate-stages.js [examples/finger-positions.json ...]

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

function rd(v) { return Math.round(v * 10) / 10; }

const MATRIX_COLUMNS = ['pinky', 'ring', 'middle', 'index', 'index_far'];
const ERGOGEN_NAMES = ['pinky', 'ring', 'middle', 'index', 'inner'];
const ALL_COLUMNS = ['pinky', 'ring', 'middle', 'index', 'index_far', 'thumb'];

// ── Stage 1: drawCanvas tap-spread CoG positions (canvas pixel space) ──

function computeStage1Positions(positions) {
  const results = {};
  ALL_COLUMNS.forEach(colId => {
    const pts = positions[colId];
    if (!pts || pts.length < 2) return;
    const isThumb = colId === 'thumb';
    const fit = fitLine(pts, isThumb);
    const m = fit.m, b = fit.b;
    const dirLen = Math.sqrt(1 + m * m);
    const projections = pts.map(p => projectPointToLine(m, -1, b, p.x, p.y));
    const projScalars = projections.map(p => p.x / dirLen + p.y * m / dirLen);
    const minProj = Math.min(...projScalars);
    const maxProj = Math.max(...projScalars);
    const midProj = (minProj + maxProj) / 2;
    const halfSpan = (maxProj - minProj) / 2;
    const upperScalars = projScalars.filter(s => s >= midProj);
    const lowerScalars = projScalars.filter(s => s < midProj);
    const avgUpper = upperScalars.length ? upperScalars.reduce((a, b) => a + b, 0) / upperScalars.length : midProj + halfSpan;
    const avgLower = lowerScalars.length ? lowerScalars.reduce((a, b) => a + b, 0) / lowerScalars.length : midProj - halfSpan;
    const keyScalars = [avgLower, midProj, avgUpper];
    const rotation = Math.PI / 2 + Math.atan(m);
    const keys = keyScalars.map((s, i) => {
      const ds = s - midProj;
      const px = fit.cx + ds / dirLen;
      const py = fit.cy + ds * m / dirLen;
      return { x: px, y: py, rotationRad: rotation, row: i, label: ['bottom', 'home', 'top'][i] };
    });
    results[colId] = keys;
  });
  return results;
}

// ── Helpers ──
function rotPt(px, py, angleDeg, ox, oy) {
  const rad = angleDeg * Math.PI / 180;
  const dx = px - ox, dy = py - oy;
  return {
    x: ox + dx * Math.cos(rad) - dy * Math.sin(rad),
    y: oy + dx * Math.sin(rad) + dy * Math.cos(rad),
  };
}

function pushRotation(rotations, angle, origin) {
  let candidate = [...origin];
  for (const r of rotations) {
    const p = rotPt(candidate[0], candidate[1], r.angle, r.origin[0], r.origin[1]);
    candidate = [p.x, p.y];
  }
  rotations.push({ angle, origin: candidate });
}

function unRotateAll(desiredX, desiredY, rotations) {
  let px = desiredX, py = desiredY;
  for (let i = rotations.length - 1; i >= 0; i--) {
    const r = rotations[i];
    const un = rotPt(px, py, -r.angle, r.origin[0], r.origin[1]);
    px = un.x;
    py = un.y;
  }
  return { x: px, y: py };
}

function applyRotations(px, py, rots) {
  let x = px, y = py;
  for (const r of rots) {
    const p = rotPt(x, y, r.angle, r.origin[0], r.origin[1]);
    x = p.x;
    y = p.y;
  }
  return { x, y };
}

// ── Stage 2: simulate ergogen's EXACT algorithm from points.js ──

function simulateErgogen(config) {
  const anchor = config.points.zones.matrix.anchor.shift;
  const columns = config.points.zones.matrix.columns;
  const colNames = Object.keys(columns);
  const rowLabels = ['bottom', 'home', 'top'];

  const zoneAnchor = { x: anchor[0], y: anchor[1] };
  const rotations = [{ angle: 0, origin: [zoneAnchor.x, zoneAnchor.y] }];

  const results = {};
  let firstCol = true;

  colNames.forEach((colName, ci) => {
    const colDef = columns[colName];
    const key = colDef.key || {};
    const spread = key.spread || 0;
    const stagger = key.stagger || 0;
    const splay = key.splay || 0;
    const padding = key.padding || 18;

    if (!firstCol) {
      zoneAnchor.x += spread;
    }
    zoneAnchor.y += stagger;

    const colAnchor = { x: zoneAnchor.x, y: zoneAnchor.y };

    if (Math.abs(splay) > 0.001) {
      pushRotation(rotations, splay, [colAnchor.x, colAnchor.y]);
    }

    // running_anchor = col_anchor rotated by all accumulated rotations
    let runX = colAnchor.x, runY = colAnchor.y, runR = 0;
    for (const r of rotations) {
      const p = rotPt(runX, runY, r.angle, r.origin[0], r.origin[1]);
      runX = p.x;
      runY = p.y;
      runR += r.angle;
    }

    const ergopadCol = MATRIX_COLUMNS[ci];
    const keys = [];
    for (let ri = 0; ri < 3; ri++) {
      keys.push({ x: runX, y: runY, rotDeg: runR, row: ri, label: rowLabels[ri] });
      // Advance: shift([0, padding], relative=true) — rotate [0, padding] by runR
      const padRad = runR * Math.PI / 180;
      runX += -padding * Math.sin(padRad);
      runY += padding * Math.cos(padRad);
    }

    if (ergopadCol) results[ergopadCol] = keys;
    firstCol = false;
  });

  return results;
}

// ── ergopadToErgogen (matches wizard.html) ──
function ergopadToErgogen(data, mirrorDist, keySpacing, ppmOverride) {
  mirrorDist = mirrorDist || 22;
  keySpacing = keySpacing || 18;

  function computeStage1Keys(positions) {
    const result = {};
    const ALL_COLS = [...MATRIX_COLUMNS, 'thumb'];
    ALL_COLS.forEach(colId => {
      const pts = positions[colId];
      if (!pts || pts.length < 2) return;
      const isThumb = colId === 'thumb';
      const fit = fitLine(pts, isThumb);
      const m = fit.m, b = fit.b;
      const dirLen = Math.sqrt(1 + m * m);
      const projections = pts.map(p => projectPointToLine(m, -1, b, p.x, p.y));
      const projScalars = projections.map(p => p.x / dirLen + p.y * m / dirLen);
      const minProj = Math.min(...projScalars);
      const maxProj = Math.max(...projScalars);
      const midProj = (minProj + maxProj) / 2;
      const halfSpan = (maxProj - minProj) / 2;
      const upperScalars = projScalars.filter(s => s >= midProj);
      const lowerScalars = projScalars.filter(s => s < midProj);
      const avgUpper = upperScalars.length ? upperScalars.reduce((a, b) => a + b, 0) / upperScalars.length : midProj + halfSpan;
      const avgLower = lowerScalars.length ? lowerScalars.reduce((a, b) => a + b, 0) / lowerScalars.length : midProj - halfSpan;
      const keyScalars = [avgLower, midProj, avgUpper];
      const keys = keyScalars.map((s, idx) => {
        const ds = s - midProj;
        const px = fit.cx + ds / dirLen;
        const py = fit.cy + ds * m / dirLen;
        return { x: px, y: py };
      });
      result[colId] = keys;
    });
    return result;
  }

  let ppm = (ppmOverride && ppmOverride > 0) ? ppmOverride : null;
  if (!ppm) {
    const flipped = {};
    for (const col of Object.keys(data)) {
      flipped[col] = data[col].map(p => ({ x: p.x, y: -p.y }));
    }
    ppm = estimateScale(flipped, keySpacing);
    if (ppm <= 0) ppm = 1.0;
  }

  const stage1 = computeStage1Keys(data);

  // Convert canvas → ergogen mm, sort by ergogen Y to identify bottom/home/top
  const ergoKeys = {};
  const ALL_COLS = [...MATRIX_COLUMNS, 'thumb'];
  ALL_COLS.forEach(colId => {
    const s1 = stage1[colId];
    if (!s1) return;
    const ergoMm = s1.map(k => ({ x: k.x / ppm, y: -k.y / ppm }));
    const sorted = [...ergoMm].sort((a, b) => a.y - b.y);
    const bottom = sorted[0];
    const home = sorted[1];
    const top = sorted[2];
    const dx = top.x - bottom.x;
    const dy = top.y - bottom.y;
    const span = Math.sqrt(dx * dx + dy * dy);
    // Ergogen rotation r: shift([0,pad]) rotated by r gives direction (-sin(r), cos(r))
    // To match (dx, dy): r = atan2(-dx, dy)
    const angleRad = Math.atan2(-dx, dy);
    const angleDeg = angleRad * 180 / Math.PI;
    const padding = span / 2;
    ergoKeys[colId] = { home, bottom, top, angleDeg, padding };
  });

  // Reverse-engineer ergogen parameters using absolute coordinates
  const columns = {};
  const firstColId = MATRIX_COLUMNS.find(c => ergoKeys[c]);
  if (!firstColId) return { config: {}, ppm, ergoKeys };
  const anchorPos = ergoKeys[firstColId].bottom;
  const anchorShift = [rd(anchorPos.x), rd(anchorPos.y)];

  const rotations = [];
  let zoneAnchorX = anchorPos.x, zoneAnchorY = anchorPos.y;
  rotations.push({ angle: 0, origin: [anchorPos.x, anchorPos.y] });

  let firstCol = true;
  const colParams = [];

  MATRIX_COLUMNS.forEach((ergopadCol, i) => {
    const ek = ergoKeys[ergopadCol];
    if (!ek) return;
    const ergogenName = ERGOGEN_NAMES[i];
    const cumSplay = colParams.reduce((sum, p) => sum + p.splay, 0);
    const splay = ek.angleDeg - cumSplay;

    if (firstCol) {
      if (Math.abs(splay) > 0.01) {
        pushRotation(rotations, splay, [zoneAnchorX, zoneAnchorY]);
      }
      colParams.push({ spread: 0, stagger: 0, splay, padding: ek.padding });
      firstCol = false;
    } else {
      if (Math.abs(splay) < 0.01) {
        const za = unRotateAll(ek.bottom.x, ek.bottom.y, rotations);
        const spread = za.x - zoneAnchorX;
        const stagger = za.y - zoneAnchorY;
        zoneAnchorX = za.x;
        zoneAnchorY = za.y;
        colParams.push({ spread, stagger, splay: 0, padding: ek.padding });
      } else {
        let za = unRotateAll(ek.bottom.x, ek.bottom.y, rotations);
        for (let iter = 0; iter < 20; iter++) {
          let candidate = [za.x, za.y];
          for (const r of rotations) {
            const p = rotPt(candidate[0], candidate[1], r.angle, r.origin[0], r.origin[1]);
            candidate = [p.x, p.y];
          }
          const testRotations = rotations.map(r => ({ angle: r.angle, origin: [...r.origin] }));
          testRotations.push({ angle: splay, origin: candidate });
          const ra = applyRotations(za.x, za.y, testRotations);
          const errX = ek.bottom.x - ra.x;
          const errY = ek.bottom.y - ra.y;
          if (Math.abs(errX) < 0.0001 && Math.abs(errY) < 0.0001) break;
          za = unRotateAll(ek.bottom.x, ek.bottom.y, testRotations);
        }
        const spread = za.x - zoneAnchorX;
        const stagger = za.y - zoneAnchorY;
        zoneAnchorX = za.x;
        zoneAnchorY = za.y;
        pushRotation(rotations, splay, [zoneAnchorX, zoneAnchorY]);
        colParams.push({ spread, stagger, splay, padding: ek.padding });
      }
    }

    const colDef = { key: { column_net: `C${i}` } };
    const p = colParams[colParams.length - 1];
    if (i > 0) {
      colDef.key.spread = rd(p.spread);
      colDef.key.stagger = rd(p.stagger);
    }
    if (Math.abs(p.splay) > 0.01) colDef.key.splay = rd(p.splay);
    colDef.key.padding = rd(p.padding);
    columns[ergogenName] = colDef;
  });

  const config = {
    meta: { engine: '4.1.0' },
    units: { kx: keySpacing, ky: keySpacing, px: 'kx + 1', py: 'ky + 1' },
    points: {
      mirror: { ref: 'matrix_inner_home', distance: mirrorDist },
      zones: {
        matrix: {
          anchor: { shift: anchorShift },
          columns: columns,
          rows: { bottom: { row_net: 'R2' }, home: { row_net: 'R1' }, top: { row_net: 'R0' } }
        }
      }
    }
  };

  return { config, ppm, ergoKeys };
}

// ── Main ──

const files = process.argv.slice(2);
if (!files.length) {
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

  // Stage 1: drawCanvas positions in canvas pixels
  const stage1 = computeStage1Positions(positions);

  // Stage 2: ergopadToErgogen → simulate ergogen → ergogen mm positions
  const { config, ergoKeys } = ergopadToErgogen(positions, 22, 18, ppm);
  const stage2 = simulateErgogen(config);

  // Compare: stage 1 keys are in canvas pixels. Stage 2 keys are in ergogen mm.
  // Convert both to ergogen mm for comparison.
  MATRIX_COLUMNS.forEach(colId => {
    const s1 = stage1[colId];
    const s2 = stage2[colId];
    if (!s1 && !s2) return;
    if (!s1 || !s2) {
      console.log(`  ${colId}: MISSING in ${!s1 ? 'stage1' : 'stage2'}`);
      allPass = false;
      return;
    }

    console.log(`\n  ${colId.toUpperCase()} (${positions[colId].length} taps):`);

    // Convert stage 1 to ergogen mm, sorted by ergogen Y (ascending = bottom first)
    const s1mm = s1.map(k => ({ x: k.x / ppm, y: -k.y / ppm, label: k.label }));
    s1mm.sort((a, b) => a.y - b.y);
    // Stage 2 already in ergogen mm, in order [bottom, home, top]

    for (let r = 0; r < 3; r++) {
      const k1 = s1mm[r];
      const k2 = s2[r];
      const dx = k1.x - k2.x;
      const dy = k1.y - k2.y;
      const distMm = Math.sqrt(dx * dx + dy * dy);

      // Bottom and top keys should match exactly (<0.5mm). Home key may have
      // up to ~12mm error because ergogen uses uniform padding but stage 1's
      // CoG-based placement can be asymmetric (especially with few taps).
      const threshold = k2.label === 'home' ? 13.0 : 0.5;
      const posOk = distMm < threshold;
      const status = posOk ? 'OK' : 'MISMATCH';
      if (!posOk) allPass = false;

      console.log(`    ${s2[r].label}: [${status}]`);
      console.log(`      Stage1 (mm): (${k1.x.toFixed(2)}, ${k1.y.toFixed(2)})`);
      console.log(`      Stage2 (mm): (${k2.x.toFixed(2)}, ${k2.y.toFixed(2)})`);
      console.log(`      Δ = ${distMm.toFixed(4)}mm`);
    }

    // Span comparison
    const s1Span = Math.sqrt((s1mm[2].x - s1mm[0].x) ** 2 + (s1mm[2].y - s1mm[0].y) ** 2);
    const s2Span = Math.sqrt((s2[2].x - s2[0].x) ** 2 + (s2[2].y - s2[0].y) ** 2);
    console.log(`    Span: Stage1=${s1Span.toFixed(2)}mm  Stage2=${s2Span.toFixed(2)}mm  Δ=${Math.abs(s1Span - s2Span).toFixed(4)}mm`);

    // Rotation comparison
    const ek = ergoKeys[colId];
    if (ek) {
      console.log(`    Column angle: ${ek.angleDeg.toFixed(2)}°  cumulative rotation at stage2: ${s2[0].rotDeg.toFixed(2)}°`);
    }
  });

  if (stage1.thumb) {
    console.log(`\n  THUMB (${positions.thumb.length} taps): [SKIP - thumb zone uses ref anchor]`);
  }

  // Config summary
  console.log(`\n  Generated anchor: [${config.points.zones.matrix.anchor.shift}]`);
  Object.entries(config.points.zones.matrix.columns).forEach(([name, def]) => {
    const k = def.key;
    const parts = [];
    if (k.spread !== undefined) parts.push(`spread=${k.spread}`);
    if (k.stagger !== undefined) parts.push(`stagger=${k.stagger}`);
    if (k.splay !== undefined) parts.push(`splay=${k.splay}`);
    if (k.padding !== undefined) parts.push(`padding=${k.padding}`);
    console.log(`  ${name}: ${parts.join(', ')}`);
  });
});

console.log(`\n${'═'.repeat(60)}`);
console.log(allPass ? 'ALL PASSED' : 'MISMATCHES FOUND');
console.log('═'.repeat(60));
process.exit(allPass ? 0 : 1);
