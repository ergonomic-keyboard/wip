#!/usr/bin/env node
// fitting.js — Standalone fitting algorithm module
// Extracts and consolidates the tap→switch position computation from wizard.html/test-headless.js
// This is the SINGLE SOURCE OF TRUTH for the fitting algorithm used by all verification scripts.

'use strict';

const MATRIX_COLUMNS = ['pinky', 'ring', 'middle', 'index', 'index_far'];
const ERGOGEN_NAMES  = ['pinky', 'ring', 'middle', 'index', 'inner'];
const ALL_COLUMNS    = [...MATRIX_COLUMNS, 'thumb'];

// Cherry MX ULP switch housing size (mm)
const SWITCH_WIDTH  = 13.8;
const SWITCH_HEIGHT = 13.8;

// Default key spacing
const DEFAULT_KEY_SPACING = 18;

// ── Linear regression ──
function leastSquaresLine(points, invertXY = false) {
  const n = points.length;
  let xs = points.map(p => p.x), ys = points.map(p => p.y);
  if (invertXY) { [xs, ys] = [ys, xs]; }
  const sx  = xs.reduce((a, b) => a + b, 0);
  const sy  = ys.reduce((a, b) => a + b, 0);
  const sxx = xs.reduce((a, x) => a + x * x, 0);
  const sxy = xs.reduce((a, x, i) => a + x * ys[i], 0);
  const denom = n * sxx - sx * sx;
  if (Math.abs(denom) < 1e-12) return { m: 0, b: sy / n };
  const slope     = (n * sxy - sx * sy) / denom;
  const intercept = (sy - slope * sx) / n;
  if (invertXY) {
    if (Math.abs(slope) < 1e-12) return { m: 0, b: intercept };
    return { m: 1 / slope, b: -intercept / slope };
  }
  return { m: slope, b: intercept };
}

// ── Point projection onto line (standard form ax + by + c = 0) ──
function projectPointToLine(a, b, c, px, py) {
  const denom = a * a + b * b;
  return {
    x: (b * (b * px - a * py) - a * c) / denom,
    y: (a * (-b * px + a * py) - b * c) / denom,
  };
}

// ── Fit a regression line to points, compute midpoint and column angle ──
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

// ── Estimate PPM from inter-tap distances ──
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

// ── Compute Stage 1 key positions (in canvas pixel space) ──
// This is the CoG-based placement algorithm from App.tsx / drawCanvas / wizard.html
function computeStage1Keys(positions) {
  const result = {};
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
    const avgUpper = upperScalars.length
      ? upperScalars.reduce((a, b) => a + b, 0) / upperScalars.length
      : midProj + halfSpan;
    const avgLower = lowerScalars.length
      ? lowerScalars.reduce((a, b) => a + b, 0) / lowerScalars.length
      : midProj - halfSpan;
    const keyScalars = [avgLower, midProj, avgUpper];
    const rotationRad = Math.PI / 2 + Math.atan(m);
    result[colId] = keyScalars.map((s, idx) => {
      const ds = s - midProj;
      return {
        x: fit.cx + ds / dirLen,
        y: fit.cy + ds * m / dirLen,
        rotationRad,
        label: ['bottom', 'home', 'top'][idx],
      };
    });
  });
  return result;
}

// ── Compute switch positions in mm (ergogen coordinate space) ──
// Returns per-column array of {center:{x,y}, rotation (degrees), size:{w,h}}
function computeSwitchPositions(positions, ppmOverride, keySpacing) {
  keySpacing = keySpacing || DEFAULT_KEY_SPACING;

  let ppm = (ppmOverride && ppmOverride > 0) ? ppmOverride : null;
  if (!ppm) {
    const flipped = {};
    for (const col of Object.keys(positions)) {
      flipped[col] = positions[col].map(p => ({ x: p.x, y: -p.y }));
    }
    ppm = estimateScale(flipped, keySpacing);
    if (ppm <= 0) ppm = 1.0;
  }

  const stage1 = computeStage1Keys(positions);
  const computedSwitches = {};

  ALL_COLUMNS.forEach(colId => {
    const s1 = stage1[colId];
    if (!s1) return;
    // Convert to ergogen mm space (flip Y)
    const ergoMm = s1.map(k => ({ x: k.x / ppm, y: -k.y / ppm }));
    const sorted = [...ergoMm].sort((a, b) => a.y - b.y);
    const bottom = sorted[0], home = sorted[1], top = sorted[2];

    // Column angle in ergogen space
    const dx = top.x - bottom.x, dy = top.y - bottom.y;
    const angleRad = Math.atan2(-dx, dy);
    const angleDeg = angleRad * 180 / Math.PI;

    const keys = [bottom, home, top];
    computedSwitches[colId] = keys.map((k, idx) => ({
      center: { x: k.x, y: k.y },
      rotation: angleDeg,
      size: { w: SWITCH_WIDTH, h: SWITCH_HEIGHT },
      label: ['bottom', 'home', 'top'][idx],
    }));
  });

  return { computedSwitches, ppm };
}

// ── Rotation helpers ──
function rd(v) { return Math.round(v * 100) / 100; }

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
    px = un.x; py = un.y;
  }
  return { x: px, y: py };
}

function applyRotations(px, py, rots) {
  let x = px, y = py;
  for (const r of rots) {
    const p = rotPt(x, y, r.angle, r.origin[0], r.origin[1]);
    x = p.x; y = p.y;
  }
  return { x, y };
}

// ── ergopadToErgogen — produces ergogen config from computed switch positions ──
function ergopadToErgogen(positions, mirrorDist, keySpacing, ppmOverride) {
  mirrorDist = mirrorDist || 22;
  keySpacing = keySpacing || DEFAULT_KEY_SPACING;

  const { computedSwitches, ppm } = computeSwitchPositions(positions, ppmOverride, keySpacing);

  // Build ergoKeys from computedSwitches
  const ergoKeys = {};
  ALL_COLUMNS.forEach(colId => {
    const sw = computedSwitches[colId];
    if (!sw) return;
    const bottom = sw[0].center, home = sw[1].center, top = sw[2].center;
    const angleDeg = sw[0].rotation;
    const angleRad = angleDeg * Math.PI / 180;
    const axisX = -Math.sin(angleRad), axisY = Math.cos(angleRad);
    const padBottom = (home.x - bottom.x) * axisX + (home.y - bottom.y) * axisY;
    const padHome   = (top.x - home.x) * axisX + (top.y - home.y) * axisY;
    ergoKeys[colId] = { home, bottom, top, angleDeg, padBottom, padHome };
  });

  // Reverse-engineer ergogen parameters
  const columns = {};
  const firstColId = MATRIX_COLUMNS.find(c => ergoKeys[c]);
  if (!firstColId) return { config: {}, ppm, computedSwitches, ergoKeys };
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
    colDef.rows.home   = { padding: rd(p.padHome) };
    colDef.rows.top    = { padding: 0 };
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

  // Mirror distance
  const innerHome = ergoKeys.index_far ? ergoKeys.index_far.home : null;
  let maxX = innerHome ? innerHome.x : 0;
  for (const colId of MATRIX_COLUMNS) {
    const ek = ergoKeys[colId]; if (!ek) continue;
    maxX = Math.max(maxX, ek.bottom.x, ek.home.x, ek.top.x);
  }
  if (thumbEk) maxX = Math.max(maxX, thumbEk.bottom.x, thumbEk.home.x, thumbEk.top.x);
  const minGap = 5;
  const computedMirrorDist = innerHome
    ? Math.max(mirrorDist, rd(2 * (maxX - innerHome.x) + keySpacing + minGap))
    : mirrorDist;

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

  return { config, ppm, computedSwitches, ergoKeys };
}

// ── Generate an extended JSON with computed switch positions ──
function generateExtendedJSON(inputData, keySpacing) {
  const positions = inputData.positions;
  const ppmOverride = inputData.calibratedPPM;
  keySpacing = keySpacing || DEFAULT_KEY_SPACING;

  const { computedSwitches, ppm } = computeSwitchPositions(positions, ppmOverride, keySpacing);

  // Build fitting algorithm metadata
  const fittingAlgorithm = {};
  ALL_COLUMNS.forEach(colId => {
    if (!positions[colId] || positions[colId].length < 2) return;
    fittingAlgorithm[colId] = colId === 'thumb' ? 'STRAIGHT' : 'regression-line';
  });

  return {
    positions: positions,
    computedSwitches: computedSwitches,
    fittingAlgorithm: fittingAlgorithm,
    thumbMode: 'STRAIGHT',
    thumbParams: { lineAngle: computedSwitches.thumb ? computedSwitches.thumb[0].rotation : 0 },
    calibratedPPM: ppm,
    canvasWidth: inputData.canvasWidth,
    canvasHeight: inputData.canvasHeight,
  };
}

module.exports = {
  MATRIX_COLUMNS,
  ERGOGEN_NAMES,
  ALL_COLUMNS,
  SWITCH_WIDTH,
  SWITCH_HEIGHT,
  DEFAULT_KEY_SPACING,
  leastSquaresLine,
  projectPointToLine,
  fitLine,
  estimateScale,
  computeStage1Keys,
  computeSwitchPositions,
  ergopadToErgogen,
  generateExtendedJSON,
  rotPt,
  pushRotation,
  unRotateAll,
  applyRotations,
  rd,
};
