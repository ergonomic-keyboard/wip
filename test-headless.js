#!/usr/bin/env node
// Headless test: runs ergopadToErgogen → ergogen.process() → checks points
// This uses the REAL ergogen library, not a simulation.
//
// Usage: node test-headless.js [examples/finger-positions.json]

const fs = require('fs');
const path = require('path');
const ergogen = require('./ergogen.js');

// ── Copy helper functions from wizard.html ──
const MATRIX_COLUMNS = ['pinky', 'ring', 'middle', 'index', 'index_far'];
const ERGOGEN_NAMES = ['pinky', 'ring', 'middle', 'index', 'inner'];

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
  const projAlongLine = projections.map(p => p.x * Math.sqrt(1 + m * m));
  projAlongLine.sort((a, b) => a - b);
  const distances = [];
  for (let i = 1; i < projAlongLine.length; i++) distances.push(Math.abs(projAlongLine[i] - projAlongLine[i - 1]));
  return { angle: Math.atan(m) * 180 / Math.PI, cx: midX, cy: m * midX + b, m, b, distances };
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

// ── Full ergopadToErgogen (copied from wizard.html) ──
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
      result[colId] = keyScalars.map((s) => {
        const ds = s - midProj;
        return { x: fit.cx + ds / dirLen, y: fit.cy + ds * m / dirLen };
      });
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
  console.log(`PPM: ${ppm.toFixed(4)}`);
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

  function rotPt(px, py, angle, ox, oy) {
    const rad = angle * Math.PI / 180;
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

  const innerHome = ergoKeys.index_far ? ergoKeys.index_far.home : null;
  let maxX = innerHome ? innerHome.x : 0;
  for (const colId of MATRIX_COLUMNS) {
    const ek = ergoKeys[colId]; if (!ek) continue;
    maxX = Math.max(maxX, ek.bottom.x, ek.home.x, ek.top.x);
  }
  if (thumbEk) maxX = Math.max(maxX, thumbEk.bottom.x, thumbEk.home.x, thumbEk.top.x);
  const minGap = 5;
  const computedMirrorDist = innerHome ? Math.max(mirrorDist, rd(2 * (maxX - innerHome.x) + keySpacing + minGap)) : mirrorDist;

  const config = {
    meta: { engine: '4.1.0' },
    units: { kx: keySpacing, ky: keySpacing, px: 'kx + 1', py: 'ky + 1' },
    points: {
      mirror: { ref: 'matrix_inner_home', distance: computedMirrorDist },
      zones: {
        matrix: { anchor: { shift: anchorShift }, columns, rows: { bottom: { row_net: 'R2' }, home: { row_net: 'R1' }, top: { row_net: 'R0' } } }
      }
    },
    outlines: {
      _keycaps: [{ what: 'rectangle', where: true, size: ['kx - 0.5', 'ky - 0.5'] }],
      board: [{ what: 'rectangle', where: true, size: ['px + 4', 'py + 4'], bound: true, fillet: 8, asym: 'source' }],
      switch_cutouts: [{ what: 'rectangle', where: true, size: [13.8, 13.8], bound: false, asym: 'source' }],
      frame: [{ what: 'rectangle', where: true, size: ['px + 8', 'py + 8'], bound: true, fillet: 8, asym: 'source' }]
    }
  };
  if (thumbZone) config.points.zones.thumb = thumbZone;
  return config;
}

// ── Main ──
async function main() {
  const file = process.argv[2] || path.join(__dirname, 'examples', 'finger-positions.json');
  console.log(`=== Headless Ergogen Test ===`);
  console.log(`Input: ${path.basename(file)}`);

  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const positions = data.positions;
  const config = ergopadToErgogen(positions, 22, 18);

  console.log(`\nGenerated config anchor shift: [${config.points.zones.matrix.anchor.shift}]`);
  console.log(`Mirror distance: ${config.points.mirror.distance}`);
  console.log(`Units: kx=${config.units.kx}, ky=${config.units.ky}`);
  console.log(`Config columns: ${Object.keys(config.points.zones.matrix.columns).join(', ')}`);
  if (config.points.zones.thumb) {
    console.log(`Thumb zone: anchor ref=${config.points.zones.thumb.anchor.ref}, shift=[${config.points.zones.thumb.anchor.shift}]`);
    console.log(`Thumb columns: ${Object.keys(config.points.zones.thumb.columns).join(', ')}`);
  }

  // Run ergogen
  // Remove pcbs/cases/outlines to avoid footprint errors, keep only points
  delete config.cases;
  delete config.pcbs;
  delete config.outlines;

  console.log(`\nRunning ergogen.process()...`);
  let results;
  try {
    results = await ergogen.process(config, true, () => {});
  } catch (e) {
    console.error(`ergogen.process() failed: ${e.message}`);
    console.error(`Config: ${JSON.stringify(config, null, 2)}`);
    return;
  }
  console.log(`Result keys: ${Object.keys(results).join(', ')}`);

  // Check points
  const points = results.points;
  if (!points || Object.keys(points).length === 0) { console.error('No points in results!'); return; }
  const pointNames = Object.keys(points);
  console.log(`\nErgogen returned ${pointNames.length} points.`);

  // Separate left/right
  const leftKeys = [], rightKeys = [];
  for (const [name, pt] of Object.entries(points)) {
    const entry = { name, x: pt.x, y: pt.y, r: pt.r, zone: pt.meta?.zone?.name, col: pt.meta?.col?.name, row: pt.meta?.row?.name, mirrored: !!pt.meta?.mirrored };
    if (pt.meta?.mirrored) rightKeys.push(entry);
    else leftKeys.push(entry);
  }

  console.log(`\nLeft keys (${leftKeys.length}):`);
  leftKeys.forEach(k => console.log(`  ${k.name}: (${k.x.toFixed(2)}, ${k.y.toFixed(2)}) r=${k.r.toFixed(2)}° zone=${k.zone} col=${k.col} row=${k.row}`));

  console.log(`\nRight keys (${rightKeys.length}):`);
  rightKeys.forEach(k => console.log(`  ${k.name}: (${k.x.toFixed(2)}, ${k.y.toFixed(2)}) r=${k.r.toFixed(2)}° zone=${k.zone} col=${k.col} row=${k.row}`));

  // Bounding boxes
  const lxMin = Math.min(...leftKeys.map(k => k.x)), lxMax = Math.max(...leftKeys.map(k => k.x));
  const lyMin = Math.min(...leftKeys.map(k => k.y)), lyMax = Math.max(...leftKeys.map(k => k.y));
  console.log(`\nLeft keys bbox: X=[${lxMin.toFixed(1)}, ${lxMax.toFixed(1)}] Y=[${lyMin.toFixed(1)}, ${lyMax.toFixed(1)}]`);
  console.log(`Left keys span: ${(lxMax - lxMin).toFixed(1)} x ${(lyMax - lyMin).toFixed(1)}`);

  // Thumb-to-matrix analysis
  const matKeys = leftKeys.filter(k => k.zone === 'matrix');
  const tKeys = leftKeys.filter(k => k.zone === 'thumb');
  if (tKeys.length && matKeys.length) {
    console.log(`\nMatrix keys: ${matKeys.length}, Thumb keys: ${tKeys.length}`);
    let minD = Infinity, closest = null;
    tKeys.forEach(t => matKeys.forEach(m => {
      const d = Math.sqrt((t.x - m.x) ** 2 + (t.y - m.y) ** 2);
      if (d < minD) { minD = d; closest = { thumb: t.name, matrix: m.name }; }
    }));
    console.log(`Min thumb-to-matrix distance: ${minD.toFixed(1)}mm (${closest.thumb} ↔ ${closest.matrix})`);
  }

  // Convex hull check
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

  function rectCorners(cx, cy, w, h, angleDeg) {
    const rad = angleDeg * Math.PI / 180;
    const cos = Math.cos(rad), sin = Math.sin(rad);
    const hw = w / 2, hh = h / 2;
    return [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(([dx, dy]) => [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos]);
  }

  function pointInPolygon(x, y, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0], yi = polygon[i][1];
      const xj = polygon[j][0], yj = polygon[j][1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  const kx = 18, ky = 18;
  const padX = kx + 1 + 4, padY = ky + 1 + 4; // px + 4 = 23
  const allCorners = [];
  leftKeys.forEach(k => {
    rectCorners(k.x, k.y, padX, padY, k.r).forEach(c => allCorners.push(c));
  });
  const hull = convexHull2D(allCorners);
  console.log(`\nConvex hull: ${hull.length} vertices from ${allCorners.length} corner points`);

  let allInside = true;
  leftKeys.forEach(k => {
    if (!pointInPolygon(k.x, k.y, hull)) {
      console.log(`  OUTSIDE HULL: ${k.name} at (${k.x.toFixed(1)}, ${k.y.toFixed(1)})`);
      allInside = false;
    }
  });
  if (allInside) console.log(`  All left keys inside hull ✓`);

  // Check what render3d.js would compute
  console.log(`\n=== render3d.js simulation ===`);
  console.log(`Board shape would use padX=${padX}, padY=${padY}, fillet=8`);
  console.log(`Switch instances would be placed at these exact positions:`);
  leftKeys.forEach(k => {
    console.log(`  ${k.name}: translate(${k.x.toFixed(2)}, ${k.y.toFixed(2)}, Z_SWITCH_BASE) * rotateZ(${k.r.toFixed(2)}°)`);
  });
  console.log(`\nCutout shapes (13.8x13.8) would be centered at same positions.`);
  console.log(`Board convex hull min/max: X=[${Math.min(...hull.map(p => p[0])).toFixed(1)}, ${Math.max(...hull.map(p => p[0])).toFixed(1)}] Y=[${Math.min(...hull.map(p => p[1])).toFixed(1)}, ${Math.max(...hull.map(p => p[1])).toFixed(1)}]`);

  // KEY DIAGNOSTIC: check if switch positions match cutout positions
  console.log(`\n=== ALIGNMENT CHECK ===`);
  console.log(`If board shape, cutouts, and switches all use the same (x,y,r) from leftKeys,`);
  console.log(`they MUST be aligned. If they're not, the issue is in Three.js matrix math.`);
  console.log(`\nPossible issues:`);
  console.log(`1. Matrix4.makeTranslation().multiply(rotationZ) — is this T*R or R*T?`);
  console.log(`   T*R applied to point p = T(R(p)) = rotate then translate. Correct for centered geometry.`);
  console.log(`2. ExtrudeGeometry from Shape places geometry at Shape's world coords.`);
  console.log(`   So extruded board is at world (x,y). Switches via InstancedMesh at same (x,y).`);
  console.log(`   Both in boardGroup. No offset should exist.`);
  console.log(`3. UNLESS the InstancedMesh world matrix introduces an offset.`);
  console.log(`   InstancedMesh.position defaults to (0,0,0). boardGroup.position defaults to (0,0,0).`);
  console.log(`4. Check: does boardGroup have any transform applied?`);
  console.log(`   In render3d.js, boardGroup = new THREE.Group() — no transform.`);
  console.log(`   leftHalf.add(boardGroup) — leftHalf also new Group, no transform.`);
  console.log(`\n5. ACTUAL ISSUE: The right half is cloned from boardGroup.`);
  console.log(`   rightContent = boardGroup.clone(true) — this deep clones all children.`);
  console.log(`   The BOARD GEOMETRY is extruded at world coords, so it sits at absolute position.`);
  console.log(`   The SWITCH INSTANCES are also at absolute positions.`);
  console.log(`   After mirroring: translate(-hingeX) → scale(-1,1,1) → translate(+hingeX)`);
  console.log(`   This should mirror both board and switches identically.`);
  console.log(`\n6. BUT WAIT: the switches on the LEFT half — are they also offset?`);
  console.log(`   Looking at the user's image: YES, both halves have keys shifted outward.`);
  console.log(`   Left keys too far left, right keys too far right.`);
  console.log(`   This means the LEFT half's keys are NOT aligned with its board.`);
  console.log(`   The mirroring then doubles the effect.`);
  console.log(`\n7. HYPOTHESIS: Matrix4 multiplication order.`);
  console.log(`   m4.makeTranslation(sx, sy, z) sets m4 = Translation matrix.`);
  console.log(`   m4.multiply(rotMatrix) → m4 = m4 * rotMatrix = T * R`);
  console.log(`   When rendering: position = T * R * vertex`);
  console.log(`   For vertex at origin: T * R * (0,0,0) = T * (0,0,0) = (sx, sy, z). Correct.`);
  console.log(`   So the center of the switch IS at (sx, sy, z). The switch is centered at origin.`);
  console.log(`\n8. The switchGeo ExtrudeGeometry uses roundedRectShape(14.2, 12.8).`);
  console.log(`   roundedRectShape creates a shape centered at origin (-w/2 to w/2).`);
  console.log(`   ExtrudeGeometry extrudes in +Z direction, depth 3.5.`);
  console.log(`   So geometry extends from z=0 to z=3.5, centered in XY at origin.`);
  console.log(`   After instance transform T(sx,sy,Z_SWITCH_BASE) * R(sr), the switch center`);
  console.log(`   is at (sx, sy, Z_SWITCH_BASE + 3.5/2). This looks correct.`);
  console.log(`\n9. REMAINING HYPOTHESIS: The board shape geometry is NOT where we think.`);
  console.log(`   The boardShape is a THREE.Shape with curves and lines at hull coordinates.`);
  console.log(`   ExtrudeGeometry creates geometry at those coordinates.`);
  console.log(`   The Mesh is at position.z = zOffset.`);
  console.log(`   So the board face is in XY plane at the hull coordinates. Correct.`);
  console.log(`\n10. WAIT — bevel on ExtrudeGeometry can SHIFT the geometry.`);
  console.log(`    bevelEnabled: true, bevelSize: 0.3 on the bottom plate.`);
  console.log(`    Bevel EXPANDS the shape outward by bevelSize. So the board is 0.3mm larger.`);
  console.log(`    But this would make the board BIGGER, not shift it. Shouldn't cause offset.`);
  console.log(`\n11. IS THE EXTRUDEGEOMETRY XY POSITION BEING SHIFTED BY BEVEL?`);
  console.log(`    In Three.js, ExtrudeGeometry with bevel: the bevel ADDS material around the edges.`);
  console.log(`    The shape outline stays at the shape's coordinates. Bevel extends outward.`);
  console.log(`    The geometry center point stays at the shape's center. No shift.`);

  // Check SVG outlines from ergogen for comparison
  if (results.outlines) {
    console.log(`\n=== Ergogen outline SVGs ===`);
    for (const [name, svg] of Object.entries(results.outlines)) {
      if (typeof svg === 'string') {
        // Extract viewBox
        const vb = svg.match(/viewBox="([^"]+)"/);
        console.log(`Outline "${name}": viewBox=${vb ? vb[1] : 'none'}`);
        // Count paths
        const paths = svg.match(/<path/g);
        console.log(`  Paths: ${paths ? paths.length : 0}`);
      }
    }
  }

  console.log(`\n=== Done ===`);
}

main().catch(e => { console.error(e); process.exit(1); });
