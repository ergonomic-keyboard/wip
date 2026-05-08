// render3d.js — Points-based 3D keyboard renderer
// Builds geometry directly from ergogenResults.points, no SVG parsing.
// Loaded as ES module alongside wizard.html.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// ══════════════════════════════════════════════════════════════════
// 2D GEOMETRY: CONVEX HULL + FILLET
// ══════════════════════════════════════════════════════════════════

/** Get 4 corners of a rectangle centered at (cx,cy), size (w,h), rotated by angleDeg. */
function rectCorners(cx, cy, w, h, angleDeg) {
  const rad = angleDeg * Math.PI / 180;
  const cos = Math.cos(rad), sin = Math.sin(rad);
  const hw = w / 2, hh = h / 2;
  const corners = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]];
  return corners.map(([dx, dy]) => [
    cx + dx * cos - dy * sin,
    cy + dx * sin + dy * cos
  ]);
}

/** Andrew's monotone chain convex hull (O(n log n)). Returns CCW hull, no duplicate closing point. */
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

/**
 * Build a filleted convex hull THREE.Shape from a set of 2D hull points.
 * filletR = corner radius in mm.
 */
function filletedHullShape(hullPts, filletR) {
  if (hullPts.length < 3) return null;
  const n = hullPts.length;
  const shape = new THREE.Shape();

  // For each vertex, compute the fillet arc
  // We shorten each edge by filletR at both ends and connect with a quadratic arc
  const filletPts = []; // [{startX, startY, arcCx, arcCy, endX, endY}]

  for (let i = 0; i < n; i++) {
    const prev = hullPts[(i - 1 + n) % n];
    const curr = hullPts[i];
    const next = hullPts[(i + 1) % n];

    // Direction vectors
    const dxIn = curr[0] - prev[0], dyIn = curr[1] - prev[1];
    const lenIn = Math.sqrt(dxIn * dxIn + dyIn * dyIn);
    const dxOut = next[0] - curr[0], dyOut = next[1] - curr[1];
    const lenOut = Math.sqrt(dxOut * dxOut + dyOut * dyOut);

    // Clamp fillet radius to half the shorter edge
    const maxR = Math.min(lenIn / 2, lenOut / 2, filletR);

    // Points where fillet starts/ends (along the edges)
    const startX = curr[0] - (dxIn / lenIn) * maxR;
    const startY = curr[1] - (dyIn / lenIn) * maxR;
    const endX = curr[0] + (dxOut / lenOut) * maxR;
    const endY = curr[1] + (dyOut / lenOut) * maxR;

    filletPts.push({ startX, startY, cx: curr[0], cy: curr[1], endX, endY });
  }

  // Draw the shape
  shape.moveTo(filletPts[0].startX, filletPts[0].startY);
  for (let i = 0; i < n; i++) {
    const fp = filletPts[i];
    // Quadratic curve through the corner (approximation of circular arc)
    shape.quadraticCurveTo(fp.cx, fp.cy, fp.endX, fp.endY);
    // Line to start of next fillet
    const nextFp = filletPts[(i + 1) % n];
    shape.lineTo(nextFp.startX, nextFp.startY);
  }

  return shape;
}

// ══════════════════════════════════════════════════════════════════
// BOARD SHAPE BUILDING
// ══════════════════════════════════════════════════════════════════

/**
 * Build a board outline shape from key positions using convex hull.
 * keys: array of {x, y, r} in ergogen coordinates (mm, Y-up)
 * padX, padY: padding around each key (mm)
 * filletR: corner fillet radius (mm)
 * Returns a THREE.Shape in ergogen coordinate space.
 */
function buildOutlineShape(keys, padX, padY, filletR) {
  // Collect corners of padded rectangles at each key position.
  const allPoints = [];
  keys.forEach(k => {
    const corners = rectCorners(k.x, k.y, padX, padY, k.r);
    corners.forEach(c => allPoints.push(c));
  });
  if (allPoints.length < 3) return null;

  // Use convex hull — always produces a single connected polygon.
  // This is critical: concave hull can fragment when thumb cluster
  // is far from matrix, creating disconnected shapes.
  const hullPts = convexHull2D(allPoints);

  console.log(`render3d buildOutlineShape: ${keys.length} keys, ${allPoints.length} corner points, ${hullPts.length} hull vertices`);
  console.log(`  pad size: ${padX.toFixed(1)} x ${padY.toFixed(1)}, fillet: ${filletR}`);

  if (hullPts.length < 3) return null;
  return filletedHullShape(hullPts, filletR);
}

/**
 * Build switch cutout shapes — one 13.8×13.8mm square per key.
 * Returns array of THREE.Shape.
 */
function buildCutoutShapes(keys, size) {
  return keys.map(k => {
    const s = new THREE.Shape();
    const hw = size / 2, hh = size / 2;
    const rad = k.r * Math.PI / 180;
    const cos = Math.cos(rad), sin = Math.sin(rad);
    // 4 corners of the cutout, rotated
    const corners = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(([dx, dy]) => [
      k.x + dx * cos - dy * sin,
      k.y + dx * sin + dy * cos
    ]);
    s.moveTo(corners[0][0], corners[0][1]);
    s.lineTo(corners[1][0], corners[1][1]);
    s.lineTo(corners[2][0], corners[2][1]);
    s.lineTo(corners[3][0], corners[3][1]);
    s.lineTo(corners[0][0], corners[0][1]);
    return s;
  });
}

// ══════════════════════════════════════════════════════════════════
// ROUNDED RECT HELPER (centered at origin)
// ══════════════════════════════════════════════════════════════════

function roundedRectShape(w, h, r) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  return s;
}

// ══════════════════════════════════════════════════════════════════
// TEXTURE GENERATORS
// ══════════════════════════════════════════════════════════════════

function generateWoodTexture(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  const bgGrad = g.createLinearGradient(0, 0, w * 0.3, h);
  bgGrad.addColorStop(0, '#b8923c'); bgGrad.addColorStop(0.2, '#c9a050');
  bgGrad.addColorStop(0.5, '#d4aa55'); bgGrad.addColorStop(0.8, '#c49845');
  bgGrad.addColorStop(1, '#b08535');
  g.fillStyle = bgGrad; g.fillRect(0, 0, w, h);
  for (let p = 0; p < 12; p++) {
    const px = Math.random() * w, py = Math.random() * h, pr = 80 + Math.random() * 200;
    const grad = g.createRadialGradient(px, py, 0, px, py, pr);
    const isDark = Math.random() > 0.5;
    grad.addColorStop(0, isDark ? 'rgba(130,85,30,0.15)' : 'rgba(210,170,80,0.12)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
  }
  for (let i = 0; i < 400; i++) {
    const y = (i / 400) * h + (Math.random() - 0.5) * 4;
    const lw = 0.4 + Math.random() * 1.5;
    const isDark = Math.random() > 0.35;
    const r = isDark ? 90 + Math.random() * 40 : 160 + Math.random() * 40;
    const gg = isDark ? 60 + Math.random() * 30 : 120 + Math.random() * 30;
    const b = isDark ? 20 + Math.random() * 20 : 60 + Math.random() * 20;
    const alpha = isDark ? 0.3 + Math.random() * 0.35 : 0.15 + Math.random() * 0.2;
    g.strokeStyle = `rgba(${r | 0},${gg | 0},${b | 0},${alpha})`;
    g.lineWidth = lw; g.beginPath();
    const phase = Math.random() * 20;
    const freq1 = 0.004 + Math.random() * 0.008, freq2 = 0.015 + Math.random() * 0.02;
    const amp1 = 2 + Math.random() * 5, amp2 = 0.5 + Math.random() * 2;
    for (let x = 0; x < w; x += 2) {
      const wobble = Math.sin(x * freq1 + phase) * amp1 + Math.sin(x * freq2 + phase * 3) * amp2;
      if (x === 0) g.moveTo(x, y + wobble); else g.lineTo(x, y + wobble);
    }
    g.stroke();
  }
  for (let ring = 0; ring < 6; ring++) {
    const ry = (ring + 0.3 + Math.random() * 0.4) / 6 * h;
    const ringW = 1.5 + Math.random() * 2.5;
    g.strokeStyle = `rgba(100,65,20,${0.25 + Math.random() * 0.2})`; g.lineWidth = ringW; g.beginPath();
    const arcPhase = Math.random() * 5;
    for (let x = 0; x < w; x += 2) { const cv = Math.sin(x * 0.002 + arcPhase) * 15; if (x === 0) g.moveTo(x, ry + cv); else g.lineTo(x, ry + cv); }
    g.stroke();
    g.strokeStyle = 'rgba(220,190,120,0.12)'; g.lineWidth = 0.8; g.beginPath();
    for (let x = 0; x < w; x += 2) { const cv = Math.sin(x * 0.002 + arcPhase) * 15; if (x === 0) g.moveTo(x, ry + cv - ringW); else g.lineTo(x, ry + cv - ringW); }
    g.stroke();
  }
  const nNodes = 2 + Math.floor(Math.random() * 2);
  for (let n = 0; n < nNodes; n++) {
    const ny = (n + 0.5 + (Math.random() - 0.5) * 0.4) / nNodes * h;
    const nodeW = 3 + Math.random() * 4;
    const grad = g.createLinearGradient(0, ny - nodeW, 0, ny + nodeW);
    grad.addColorStop(0, 'rgba(90,55,15,0)'); grad.addColorStop(0.3, 'rgba(90,55,15,0.3)');
    grad.addColorStop(0.5, 'rgba(70,40,10,0.4)'); grad.addColorStop(0.7, 'rgba(90,55,15,0.3)');
    grad.addColorStop(1, 'rgba(90,55,15,0)');
    g.fillStyle = grad; g.fillRect(0, ny - nodeW, w, nodeW * 2);
  }
  for (let s = 0; s < 300; s++) {
    const sx = Math.random() * w, sy = Math.random() * h;
    g.fillStyle = `rgba(70,45,15,${0.1 + Math.random() * 0.15})`;
    g.fillRect(sx, sy, 0.5 + Math.random() * 2, 0.3 + Math.random() * 0.8);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  // Normal map
  const nc = document.createElement('canvas'); nc.width = 512; nc.height = 512;
  const ng = nc.getContext('2d');
  ng.fillStyle = '#8080ff'; ng.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 300; i++) {
    const ny = (i / 300) * 512; const phase = Math.random() * 10;
    const isDark = Math.random() > 0.4;
    const nVal = isDark ? 105 + Math.random() * 20 : 145 + Math.random() * 15;
    const alpha = isDark ? 0.08 + Math.random() * 0.1 : 0.04 + Math.random() * 0.06;
    ng.strokeStyle = `rgba(${nVal | 0},${nVal | 0},255,${alpha})`;
    ng.lineWidth = 0.5 + Math.random() * 1.5; ng.beginPath();
    for (let x = 0; x < 512; x += 2) {
      const wb = Math.sin(x * 0.012 + phase) * 2 + Math.sin(x * 0.003 + i * 0.4) * 3;
      if (x === 0) ng.moveTo(x, ny + wb); else ng.lineTo(x, ny + wb);
    }
    ng.stroke();
  }
  const normalTex = new THREE.CanvasTexture(nc);
  normalTex.wrapS = normalTex.wrapT = THREE.RepeatWrapping;
  // Roughness map
  const rc = document.createElement('canvas'); rc.width = 256; rc.height = 256;
  const rg = rc.getContext('2d');
  rg.fillStyle = '#777'; rg.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 150; i++) {
    const ry = (i / 150) * 256; const isDark = Math.random() > 0.5;
    rg.strokeStyle = isDark ? 'rgba(100,100,100,0.2)' : 'rgba(180,180,180,0.15)';
    rg.lineWidth = 0.5 + Math.random() * 1.5; rg.beginPath();
    for (let x = 0; x < 256; x += 2) { const wb = Math.sin(x * 0.02 + i * 0.6) * 1.5; if (x === 0) rg.moveTo(x, ry + wb); else rg.lineTo(x, ry + wb); }
    rg.stroke();
  }
  const roughTex = new THREE.CanvasTexture(rc);
  roughTex.wrapS = roughTex.wrapT = THREE.RepeatWrapping;
  return { map: tex, roughnessMap: roughTex, normalMap: normalTex };
}

function generateCorkTexture(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = '#c29a6b'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 600; i++) {
    const px = Math.random() * w, py = Math.random() * h;
    const r = 0.5 + Math.random() * 2.5;
    const b = Math.floor(140 + Math.random() * 60);
    g.fillStyle = `rgba(${b},${b - 30},${b - 60},${0.2 + Math.random() * 0.3})`;
    g.beginPath(); g.ellipse(px, py, r, r * (0.6 + Math.random() * 0.8), Math.random() * Math.PI, 0, Math.PI * 2); g.fill();
  }
  const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return { map: tex };
}

function generateBrushedMetalTexture(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = '#b0b0b5'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < h; i++) {
    const v = 160 + Math.floor(Math.random() * 40);
    g.strokeStyle = `rgb(${v},${v},${v + 5})`; g.lineWidth = 0.3 + Math.random() * 0.4;
    g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke();
  }
  const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return { map: tex };
}

function generatePCBTexture(w, h, keys, bbox) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = '#145214'; g.fillRect(0, 0, w, h);
  g.globalAlpha = 0.06; g.strokeStyle = '#1a7a1a';
  for (let i = 0; i < w; i += 2) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke();
    g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke();
  }
  g.globalAlpha = 1;
  const bw = bbox.max.x - bbox.min.x, bh = bbox.max.y - bbox.min.y;
  const sx = w / bw, sy = h / bh;
  function toCanvas(px, py) { return [(px - bbox.min.x) * sx, (py - bbox.min.y) * sy]; }
  keys.forEach(k => {
    const [cx, cy] = toCanvas(k.x, k.y);
    const rad = k.r * Math.PI / 180;
    g.save(); g.translate(cx, cy); g.rotate(rad);
    g.fillStyle = '#b08030';
    g.fillRect(-0.65 * sx - 0.35 * sx, 2.3 * sy - 1.7 * sy, 0.7 * sx, 3.4 * sy);
    g.fillRect(1.8 * sx - 0.35 * sx, 2.3 * sy - 1.7 * sy, 0.7 * sx, 3.4 * sy);
    g.fillStyle = '#907030';
    g.fillRect(-6.2 * sx - 0.8 * sx, -3.9 * sy - 1.9 * sy, 1.6 * sx, 3.8 * sy);
    g.fillRect(6.2 * sx - 0.8 * sx, 0 - 1.3 * sy, 1.6 * sx, 2.6 * sy);
    g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 0.5;
    g.strokeRect(-7.1 * sx, -6.4 * sy, 14.2 * sx, 12.8 * sy);
    g.strokeStyle = '#906830'; g.lineWidth = 0.3 * sx;
    g.beginPath(); g.moveTo(0, 4 * sy); g.lineTo(0, 7 * sy); g.stroke();
    g.restore();
  });
  const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  return { map: tex };
}

// ══════════════════════════════════════════════════════════════════
// KEY POSITION MAP (for labels)
// ══════════════════════════════════════════════════════════════════

function buildKeyPositionMap(points) {
  const leftKeys = [], rightKeys = [];
  for (const [name, pt] of Object.entries(points)) {
    const colNet = pt.meta?.column_net || '';
    const rowNet = pt.meta?.row_net || '';
    if (!colNet || !rowNet) continue;
    const colIdx = parseInt(colNet.replace('C', ''));
    const rowIdx = parseInt(rowNet.replace('R', ''));
    const zone = pt.meta?.zone?.name || 'matrix';
    const mirrored = !!pt.meta?.mirrored;
    const entry = { name, colIdx, rowIdx, zone, mirrored, x: pt.x, y: pt.y, r: pt.r };
    if (mirrored) rightKeys.push(entry); else leftKeys.push(entry);
  }
  const sortFn = (a, b) => {
    if (a.zone !== b.zone) return a.zone === 'matrix' ? -1 : 1;
    if (a.rowIdx !== b.rowIdx) return a.rowIdx - b.rowIdx;
    return a.colIdx - b.colIdx;
  };
  leftKeys.sort(sortFn); rightKeys.sort(sortFn);
  const nColsPerHalf = Math.max(new Set(leftKeys.map(k => k.colIdx)).size, new Set(rightKeys.map(k => k.colIdx)).size);
  const nRows = new Set([...leftKeys, ...rightKeys].map(k => k.rowIdx)).size;
  return { leftKeys, rightKeys, allKeys: [...leftKeys, ...rightKeys], nColsPerHalf, nRows };
}

const DEFAULT_KEYMAPS = {
  layer0: [
    'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P',
    'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'SEMI',
    'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'COMMA', 'DOT', 'FSLH',
    'LGUI', 'SPACE', 'TAB', 'RET', 'BSPC', 'RALT'
  ]
};

const zmkToLabel = {
  'Q': 'Q', 'W': 'W', 'E': 'E', 'R': 'R', 'T': 'T', 'Y': 'Y', 'U': 'U', 'I': 'I', 'O': 'O', 'P': 'P',
  'A': 'A', 'S': 'S', 'D': 'D', 'F': 'F', 'G': 'G', 'H': 'H', 'J': 'J', 'K': 'K', 'L': 'L',
  'SEMI': ';', 'Z': 'Z', 'X': 'X', 'C': 'C', 'V': 'V', 'B': 'B', 'N': 'N', 'M': 'M',
  'COMMA': ',', 'DOT': '.', 'FSLH': '/', 'LGUI': '\u2318', 'SPACE': '\u2423', 'TAB': '\u21e5',
  'RET': '\u21b5', 'BSPC': '\u232b', 'RALT': 'Alt'
};

// ══════════════════════════════════════════════════════════════════
// MAIN SCENE BUILDER
// ══════════════════════════════════════════════════════════════════

/**
 * Build the new 3D scene from ergogen results.
 * @param {Object} ergogenResults - from ergogen.process(), needs .points
 * @param {Object} config - the ergogen config object (for key spacing)
 * @param {HTMLElement} container - viewport div to render into
 */
function buildNewScene(ergogenResults, config, container) {
  const pts = ergogenResults.points;
  if (!pts || !Object.keys(pts).length) { console.error('render3d: no points'); return; }

  // Key spacing from config
  const kx = config?.units?.kx || 22;
  const ky = config?.units?.ky || 18;
  const px = kx + 1, py = ky + 1; // padded key spacing
  console.log(`render3d: kx=${kx}, ky=${ky}, px=${px}, py=${py}, board pad=${px + 4}x${py + 4}, frame pad=${px + 8}x${py + 8}`);

  // ── Extract left/right keys ──
  // Apply -90° rotation correction to thumb keys: the ergogen config generates
  // thumb splay from stage 1 column direction, but physical thumb keys are
  // oriented 90° CCW from the computed angle.
  const THUMB_ROT_CORRECTION = -90; // degrees
  const leftKeys = [], rightKeys = [];
  // Debug: log raw meta for first few points to understand mirrored flag
  const ptEntries = Object.entries(pts);
  console.log(`render3d: total points from ergogen: ${ptEntries.length}`);
  ptEntries.slice(0, 3).forEach(([name, pt]) => {
    console.log(`  DEBUG ${name}: meta.mirrored=${JSON.stringify(pt.meta?.mirrored)} typeof=${typeof pt.meta?.mirrored} name.startsWith('mirror_')=${name.startsWith('mirror_')}`);
  });
  if (ptEntries.length > 6) {
    ptEntries.slice(-3).forEach(([name, pt]) => {
      console.log(`  DEBUG ${name}: meta.mirrored=${JSON.stringify(pt.meta?.mirrored)} typeof=${typeof pt.meta?.mirrored} name.startsWith('mirror_')=${name.startsWith('mirror_')}`);
    });
  }
  for (const [name, pt] of ptEntries) {
    const isThumb = pt.meta?.zone?.name === 'thumb' || name.startsWith('thumb_');
    const rawR = isThumb ? pt.r + THUMB_ROT_CORRECTION : pt.r;
    // Coordinate transform: ergogen is Y-up, Three.js scene is Y-down → negate Y.
    // Rotation: ergogen CCW degrees, in Y-down space must negate.
    const entry = { name, x: pt.x, y: -pt.y, r: -rawR, origR: pt.r, meta: pt.meta };
    // Use name prefix as fallback if meta.mirrored is unreliable
    const isMirrored = pt.meta?.mirrored === true || name.startsWith('mirror_');
    if (isMirrored) rightKeys.push(entry);
    else leftKeys.push(entry);
  }
  console.log(`render3d: ${leftKeys.length} left keys, ${rightKeys.length} right keys`);

  // ── Diagnostic logging ──
  console.group('render3d diagnostics');
  console.log('Left keys (source half):');
  leftKeys.forEach(k => {
    const isThumb = k.meta?.zone?.name === 'thumb';
    console.log(`  ${k.name}: (${k.x.toFixed(1)}, ${k.y.toFixed(1)}) r=${k.origR.toFixed(1)}° ${isThumb ? `[thumb, corrected r=${k.r.toFixed(1)}°]` : ''}`);
  });
  const lxMin = Math.min(...leftKeys.map(k => k.x)), lxMax = Math.max(...leftKeys.map(k => k.x));
  const lyMin = Math.min(...leftKeys.map(k => k.y)), lyMax = Math.max(...leftKeys.map(k => k.y));
  console.log(`  Bounding box: X=[${lxMin.toFixed(1)}, ${lxMax.toFixed(1)}] Y=[${lyMin.toFixed(1)}, ${lyMax.toFixed(1)}]`);
  console.log(`  Span: ${(lxMax - lxMin).toFixed(1)} x ${(lyMax - lyMin).toFixed(1)}`);
  const matKeys = leftKeys.filter(k => k.meta?.zone?.name !== 'thumb');
  const tKeys = leftKeys.filter(k => k.meta?.zone?.name === 'thumb');
  if (tKeys.length) {
    console.log(`  Matrix keys: ${matKeys.length}, Thumb keys: ${tKeys.length}`);
    const mdist = Math.min(...tKeys.flatMap(t => matKeys.map(m => Math.sqrt((t.x - m.x) ** 2 + (t.y - m.y) ** 2))));
    console.log(`  Min thumb-to-matrix distance: ${mdist.toFixed(1)} mm`);
  }
  console.groupEnd();

  // ── Build shapes from left-half keys ──
  const boardShape = buildOutlineShape(leftKeys, px + 4, py + 4, 8);
  const frameShape = buildOutlineShape(leftKeys, px + 8, py + 8, 8);
  const cutoutShapes = buildCutoutShapes(leftKeys, 13.8);

  if (!boardShape) { console.error('render3d: could not build board shape'); return; }

  // Diagnostic: verify first cutout aligns with first key
  if (cutoutShapes.length > 0 && leftKeys.length > 0) {
    const firstCutPts = cutoutShapes[0].getPoints(4);
    const cutCx = firstCutPts.reduce((s, p) => s + p.x, 0) / firstCutPts.length;
    const cutCy = firstCutPts.reduce((s, p) => s + p.y, 0) / firstCutPts.length;
    console.log(`render3d alignment check:`);
    console.log(`  First key position: (${leftKeys[0].x.toFixed(1)}, ${leftKeys[0].y.toFixed(1)})`);
    console.log(`  First cutout center: (${cutCx.toFixed(1)}, ${cutCy.toFixed(1)})`);
    console.log(`  Offset: (${(cutCx - leftKeys[0].x).toFixed(2)}, ${(cutCy - leftKeys[0].y).toFixed(2)})`);
    const boardPts = boardShape.getPoints(64);
    const boardCx = boardPts.reduce((s, p) => s + p.x, 0) / boardPts.length;
    const boardCy = boardPts.reduce((s, p) => s + p.y, 0) / boardPts.length;
    console.log(`  Board shape centroid: (${boardCx.toFixed(1)}, ${boardCy.toFixed(1)})`);
    const bxMin = Math.min(...boardPts.map(p => p.x)), bxMax = Math.max(...boardPts.map(p => p.x));
    const byMin = Math.min(...boardPts.map(p => p.y)), byMax = Math.max(...boardPts.map(p => p.y));
    console.log(`  Board shape extent: X=[${bxMin.toFixed(1)}, ${bxMax.toFixed(1)}] Y=[${byMin.toFixed(1)}, ${byMax.toFixed(1)}]`);
    console.log(`  Keys extent: X=[${lxMin.toFixed(1)}, ${lxMax.toFixed(1)}] Y=[${lyMin.toFixed(1)}, ${lyMax.toFixed(1)}]`);
  }

  // Switch plate: board with cutout holes
  const switchPlateShape = boardShape.clone();
  cutoutShapes.forEach(cut => {
    const pts2d = cut.getPoints(4);
    switchPlateShape.holes.push(new THREE.Path(pts2d));
  });

  // Frame surround: frame with board as hole
  let frameSurroundShape = null;
  if (frameShape) {
    frameSurroundShape = frameShape.clone();
    const boardPts = boardShape.getPoints(32);
    frameSurroundShape.holes.push(new THREE.Path(boardPts));
  }

  // ── Setup renderer ──
  const w = container.clientWidth, h = container.clientHeight;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0d0d0f);

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // NO localClippingEnabled — prevents halves vanishing when folded
  container.appendChild(renderer.domElement);

  // ── Environment ──
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  // ── Camera (from human side) ──
  const camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 5000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 50;
  controls.maxDistance = 1200;

  // ── Lighting ──
  scene.add(new THREE.HemisphereLight(0xc8d4f0, 0x2a2a30, 0.4));
  const keyLight = new THREE.DirectionalLight(0xfff5e0, 1.4);
  keyLight.position.set(120, -80, 250);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.near = 1; keyLight.shadow.camera.far = 800;
  keyLight.shadow.camera.left = -250; keyLight.shadow.camera.right = 250;
  keyLight.shadow.camera.top = 250; keyLight.shadow.camera.bottom = -250;
  keyLight.shadow.bias = -0.001; keyLight.shadow.radius = 4;
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xd0e0ff, 0.5);
  fillLight.position.set(-100, 60, 120); scene.add(fillLight);
  const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
  rimLight.position.set(0, 120, -80); scene.add(rimLight);
  const underLight = new THREE.PointLight(0xffcc88, 0.15, 400);
  underLight.position.set(0, 0, -30); scene.add(underLight);

  // ── Textures ──
  const woodTex = generateWoodTexture(1024, 1024);
  const corkTex = generateCorkTexture(512, 512);
  const metalTex = generateBrushedMetalTexture(512, 1024);

  // ── Materials ──
  const bambooMat = new THREE.MeshStandardMaterial({
    map: woodTex.map, roughnessMap: woodTex.roughnessMap, normalMap: woodTex.normalMap,
    normalScale: new THREE.Vector2(0.7, 0.7), roughness: 0.4, metalness: 0.0, envMapIntensity: 0.8
  });
  const bambooSideMat = bambooMat.clone();
  const corkMat = new THREE.MeshStandardMaterial({ map: corkTex.map, roughness: 0.95, metalness: 0.0 });
  const steelMat = new THREE.MeshStandardMaterial({ map: metalTex.map, roughness: 0.25, metalness: 0.9, envMapIntensity: 1.2 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xb5a642, roughness: 0.3, metalness: 0.95, envMapIntensity: 1.0 });
  const copperMat = new THREE.MeshStandardMaterial({ color: 0xb87333, roughness: 0.35, metalness: 0.92 });
  const keycapMat = new THREE.MeshStandardMaterial({ color: 0x303032, roughness: 0.78, metalness: 0.0 });
  const switchMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.45, metalness: 0.0 });
  const diodeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5, metalness: 0.15 });
  const battMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.55, metalness: 0.1 });
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6, metalness: 0.0 });
  const redMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.4, metalness: 0.2 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.25, metalness: 0.95 });
  const nanoPcbMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.6, metalness: 0.15 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xd0d0d0, roughness: 0.15, metalness: 0.98, envMapIntensity: 1.5 });
  const cableMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.35, metalness: 0.7 });

  // ── Layer stack constants ──
  const Z_BOTTOM = 0;
  const T_BOTTOM_PLATE = 1.0, T_CORK_LOWER = 0.5, T_PCB = 1.6, T_CORK_UPPER = 0.5, T_SWITCH_PLATE = 1.2;
  const T_FRAME = T_BOTTOM_PLATE + T_CORK_LOWER + T_PCB + T_CORK_UPPER + T_SWITCH_PLATE;
  const Z_CORK_LOWER = Z_BOTTOM + T_BOTTOM_PLATE;
  const Z_PCB = Z_CORK_LOWER + T_CORK_LOWER;
  const Z_CORK_UPPER = Z_PCB + T_PCB;
  const Z_SWITCH_PLATE = Z_CORK_UPPER + T_CORK_UPPER;
  const Z_SWITCH_PLATE_TOP = Z_SWITCH_PLATE + T_SWITCH_PLATE;
  const Z_SWITCH_BASE = Z_SWITCH_PLATE_TOP;
  const Z_KEYCAP = Z_SWITCH_BASE + 3.5;
  const Z_STEM = Z_SWITCH_BASE + 2.5;
  const Z_PCB_TOP = Z_PCB + T_PCB;
  const Z_DIODE = Z_PCB_TOP + 0.6;

  // ── Extrude helper ──
  function extrudeLayer(shapes, depth, material, zOff, bevel) {
    const grp = new THREE.Group();
    const arr = Array.isArray(shapes) ? shapes : [shapes];
    const opts = { depth, bevelEnabled: !!bevel, ...(bevel || {}) };
    arr.forEach(shape => {
      const geo = new THREE.ExtrudeGeometry(shape, opts);
      const m = new THREE.Mesh(geo, material);
      m.position.z = zOff;
      m.castShadow = true; m.receiveShadow = true;
      grp.add(m);
    });
    return grp;
  }

  // ── Build board layers ──
  const boardGroup = new THREE.Group();

  // Bottom plate — bamboo
  boardGroup.add(extrudeLayer(boardShape, T_BOTTOM_PLATE, bambooMat, Z_BOTTOM,
    { bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.3, bevelSegments: 2 }));
  // Cork gasket lower
  boardGroup.add(extrudeLayer(boardShape, T_CORK_LOWER, corkMat, Z_CORK_LOWER));
  // PCB
  const pcbLayer = extrudeLayer(boardShape, T_PCB, corkMat, Z_PCB); // placeholder material
  boardGroup.add(pcbLayer);
  // Cork gasket upper
  boardGroup.add(extrudeLayer(boardShape, T_CORK_UPPER, corkMat, Z_CORK_UPPER));
  // Switch plate with cutouts
  boardGroup.add(extrudeLayer(switchPlateShape, T_SWITCH_PLATE, bambooSideMat, Z_SWITCH_PLATE,
    { bevelEnabled: true, bevelThickness: 0.2, bevelSize: 0.2, bevelSegments: 1 }));
  // Frame surround
  if (frameSurroundShape) {
    boardGroup.add(extrudeLayer(frameSurroundShape, T_FRAME, bambooMat.clone(), Z_BOTTOM,
      { bevelEnabled: true, bevelThickness: 0.4, bevelSize: 0.4, bevelSegments: 2 }));
  }

  // ── Compute bbox for PCB texture and hardware placement ──
  const bbox = new THREE.Box3().setFromObject(boardGroup);
  const center = new THREE.Vector3(); bbox.getCenter(center);
  let hingeX = bbox.max.x;
  const hingeZ = center.z;
  const hingeCenterY = center.y;

  console.log(`render3d board bbox: min=(${bbox.min.x.toFixed(1)}, ${bbox.min.y.toFixed(1)}, ${bbox.min.z.toFixed(1)}) max=(${bbox.max.x.toFixed(1)}, ${bbox.max.y.toFixed(1)}, ${bbox.max.z.toFixed(1)})`);
  console.log(`render3d board center: (${center.x.toFixed(1)}, ${center.y.toFixed(1)}, ${center.z.toFixed(1)}), hingeX=${hingeX.toFixed(1)}`);

  // PCB texture
  const pcbTex = generatePCBTexture(1024, 1024, leftKeys, bbox);
  const pcbMat = new THREE.MeshStandardMaterial({ map: pcbTex.map, roughness: 0.65, metalness: 0.08 });
  pcbLayer.traverse(obj => { if (obj.isMesh) obj.material = pcbMat; });

  // ── Per-key components (InstancedMesh) ──
  const switchGeo = new THREE.ExtrudeGeometry(roundedRectShape(14.2, 12.8, 0.8),
    { depth: 3.5, bevelEnabled: true, bevelThickness: 0.15, bevelSize: 0.15, bevelSegments: 1 });
  const keycapGeo = new THREE.ExtrudeGeometry(roundedRectShape(14, 14, 1.5),
    { depth: 1.2, bevelEnabled: true, bevelThickness: 0.4, bevelSize: 0.4, bevelSegments: 3 });
  const stemGeo = new THREE.CylinderGeometry(1.0, 1.0, 1.5, 8);
  stemGeo.rotateX(Math.PI / 2);
  const diodeGeo = new THREE.BoxGeometry(2.7, 1.6, 1.2);
  const diodeLeadGeo = new THREE.BoxGeometry(0.4, 0.3, 0.8);

  const nLeftKeys = leftKeys.length;
  const switchInst = new THREE.InstancedMesh(switchGeo, switchMat, nLeftKeys); switchInst.castShadow = true;
  const keycapInst = new THREE.InstancedMesh(keycapGeo, keycapMat, nLeftKeys); keycapInst.castShadow = true; keycapInst.receiveShadow = true;
  const stemInst = new THREE.InstancedMesh(stemGeo, steelMat.clone(), nLeftKeys);
  const diodeInst = new THREE.InstancedMesh(diodeGeo, diodeMat, nLeftKeys);
  const diodeLeadInst = new THREE.InstancedMesh(diodeLeadGeo, steelMat.clone(), nLeftKeys * 2);

  const keycapBaseMatrices = new Float32Array(nLeftKeys * 16);
  const dummy = new THREE.Object3D();

  // Place keys at transformed coordinates (Y negated, rotation negated at entry construction)
  leftKeys.forEach((k, i) => {
    const sx = k.x, sy = k.y;
    const sr = k.r * Math.PI / 180;

    // Switch housing
    const m4 = new THREE.Matrix4();
    m4.makeTranslation(sx, sy, Z_SWITCH_BASE);
    m4.multiply(new THREE.Matrix4().makeRotationZ(sr));
    switchInst.setMatrixAt(i, m4);

    // Keycap
    const m4k = new THREE.Matrix4();
    m4k.makeTranslation(sx, sy, Z_KEYCAP);
    m4k.multiply(new THREE.Matrix4().makeRotationZ(sr));
    keycapInst.setMatrixAt(i, m4k);
    m4k.toArray(keycapBaseMatrices, i * 16);

    // Stem
    dummy.position.set(sx, sy, Z_STEM);
    dummy.rotation.set(0, 0, sr); dummy.scale.set(1, 1, 1);
    dummy.updateMatrix(); stemInst.setMatrixAt(i, dummy.matrix);

    // Diode
    const dox = sx + 5 * Math.sin(sr), doy = sy + 5 * Math.cos(sr);
    dummy.position.set(dox, doy, Z_DIODE); dummy.rotation.set(0, 0, sr);
    dummy.updateMatrix(); diodeInst.setMatrixAt(i, dummy.matrix);

    // Diode leads
    dummy.position.set(dox - 1.8 * Math.cos(sr), doy + 1.8 * Math.sin(sr), Z_DIODE - 0.2);
    dummy.rotation.set(0, 0, 0); dummy.updateMatrix();
    diodeLeadInst.setMatrixAt(i * 2, dummy.matrix);
    dummy.position.set(dox + 1.8 * Math.cos(sr), doy - 1.8 * Math.sin(sr), Z_DIODE - 0.2);
    dummy.updateMatrix(); diodeLeadInst.setMatrixAt(i * 2 + 1, dummy.matrix);
  });

  [switchInst, keycapInst, stemInst, diodeInst, diodeLeadInst].forEach(inst => {
    inst.instanceMatrix.needsUpdate = true;
    boardGroup.add(inst);
  });

  // Diagnostic: verify switch instance positions vs board geometry
  {
    const testM = new THREE.Matrix4();
    switchInst.getMatrixAt(0, testM);
    const testPos = new THREE.Vector3();
    testPos.setFromMatrixPosition(testM);
    console.log(`render3d: switch[0] instance position: (${testPos.x.toFixed(1)}, ${testPos.y.toFixed(1)}, ${testPos.z.toFixed(1)})`);
    console.log(`render3d: leftKeys[0] position: (${leftKeys[0].x.toFixed(1)}, ${leftKeys[0].y.toFixed(1)})`);
    // Check board layer geometry bounding box
    const boardLayerBbox = new THREE.Box3();
    boardGroup.children.forEach(child => {
      if (child.isGroup) {
        child.children.forEach(mesh => {
          if (mesh.isMesh && !mesh.isInstancedMesh) {
            mesh.geometry.computeBoundingBox();
            const bb = mesh.geometry.boundingBox.clone();
            bb.translate(mesh.position);
            boardLayerBbox.union(bb);
          }
        });
      }
    });
    if (!boardLayerBbox.isEmpty()) {
      console.log(`render3d: board layers geometry bbox: min=(${boardLayerBbox.min.x.toFixed(1)}, ${boardLayerBbox.min.y.toFixed(1)}) max=(${boardLayerBbox.max.x.toFixed(1)}, ${boardLayerBbox.max.y.toFixed(1)})`);
    }
  }

  // ── R17: Stage 1 switch outlines (purple, 3mm above highest board point) ──
  // These are the raw fitted-line positions from stage 1 (before ergogen processing),
  // showing where the CoG/spread algorithm placed keys. They preserve the original
  // thumb splay angle visible on the Finger Positions canvas.
  const Z_PURPLE_OUTLINES = Z_KEYCAP + 1.6 + 3; // keycap top + 3mm
  const purpleMat = new THREE.LineBasicMaterial({ color: 0x9933ff, linewidth: 2 });
  const outlineGroup = new THREE.Group();
  outlineGroup.name = 'stage1Outlines';
  const OUTLINE_SIZE = 14; // mm, matches keycap footprint
  const stage1Keys = config._stage1Keys;
  if (stage1Keys) {
    // Collect all stage 1 key positions (ergogen mm space → scene space)
    const s1Entries = []; // {x, y, r} in scene coords
    const S1_COLS = ['pinky', 'ring', 'middle', 'index', 'index_far', 'thumb'];
    S1_COLS.forEach(colId => {
      const ek = stage1Keys[colId];
      if (!ek) return;
      // angleDeg: ergogen CCW from +Y. In scene (Y-down) → negate.
      const sceneRotDeg = -ek.angleDeg;
      [ek.bottom, ek.home, ek.top].forEach(pos => {
        // ergogen mm Y-up → scene Y-down: negate Y
        s1Entries.push({ x: pos.x, y: -pos.y, r: sceneRotDeg });
      });
    });

    const hw = OUTLINE_SIZE / 2, hh = OUTLINE_SIZE / 2;
    s1Entries.forEach(k => {
      const rad = k.r * Math.PI / 180;
      const cos = Math.cos(rad), sin = Math.sin(rad);
      const corners = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh], [-hw, -hh]].map(([dx, dy]) => [
        k.x + dx * cos - dy * sin,
        k.y + dx * sin + dy * cos
      ]);
      const pts3 = corners.map(([cx, cy]) => new THREE.Vector3(cx, cy, Z_PURPLE_OUTLINES));
      const geo = new THREE.BufferGeometry().setFromPoints(pts3);
      outlineGroup.add(new THREE.Line(geo, purpleMat));
    });

    // ── R18: Angle annotation between inner column and thumb column (STRAIGHT mode) ──
    const innerCol = stage1Keys['index_far'];
    const thumbCol = stage1Keys['thumb'];
    if (innerCol && thumbCol) {
      // Inner column direction in scene space (Y-down)
      const innerDirRad = -innerCol.angleDeg * Math.PI / 180;
      // Thumb column direction in scene space
      const thumbDirRad = -thumbCol.angleDeg * Math.PI / 180;
      // Column directions point along local +Y (padding direction).
      // In scene coords: direction = (sin(sceneRot), cos(sceneRot)) because
      // ergogen rotation r → local Y axis = (-sin(r), cos(r)) in ergogen space,
      // after Y-negation → (sin(-r), -cos(-r)) ... let's just compute from the actual positions.
      // Use bottom→top vector for each column.
      const innerBot = { x: innerCol.bottom.x, y: -innerCol.bottom.y };
      const innerTop = { x: innerCol.top.x, y: -innerCol.top.y };
      const thumbBot = { x: thumbCol.bottom.x, y: -thumbCol.bottom.y };
      const thumbTop = { x: thumbCol.top.x, y: -thumbCol.top.y };

      const innerDx = innerTop.x - innerBot.x, innerDy = innerTop.y - innerBot.y;
      const thumbDx = thumbTop.x - thumbBot.x, thumbDy = thumbTop.y - thumbBot.y;
      const innerLen = Math.sqrt(innerDx * innerDx + innerDy * innerDy);
      const thumbLen = Math.sqrt(thumbDx * thumbDx + thumbDy * thumbDy);

      if (innerLen > 0.1 && thumbLen > 0.1) {
        // Angle between the two column directions
        const dot = (innerDx * thumbDx + innerDy * thumbDy) / (innerLen * thumbLen);
        const angleBetween = Math.acos(Math.max(-1, Math.min(1, dot)));
        const angleDeg = angleBetween * 180 / Math.PI;

        // Draw from inner column home position
        const origin = { x: innerCol.home.x, y: -innerCol.home.y };
        const lineLen = 25; // mm, length of direction lines

        // Inner column direction line (normalized, scaled)
        const iux = innerDx / innerLen, iuy = innerDy / innerLen;
        const tux = thumbDx / thumbLen, tuy = thumbDy / thumbLen;

        // Two purple direction lines from origin
        const innerLineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(origin.x, origin.y, Z_PURPLE_OUTLINES),
          new THREE.Vector3(origin.x + iux * lineLen, origin.y + iuy * lineLen, Z_PURPLE_OUTLINES)
        ]);
        outlineGroup.add(new THREE.Line(innerLineGeo, purpleMat));

        const thumbLineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(origin.x, origin.y, Z_PURPLE_OUTLINES),
          new THREE.Vector3(origin.x + tux * lineLen, origin.y + tuy * lineLen, Z_PURPLE_OUTLINES)
        ]);
        outlineGroup.add(new THREE.Line(thumbLineGeo, purpleMat));

        // Circular arc between the two lines
        const arcRadius = 15; // mm
        const innerAngle = Math.atan2(iuy, iux);
        const thumbAngle = Math.atan2(tuy, tux);
        // Determine sweep direction (shortest arc)
        let startAngle = innerAngle, endAngle = thumbAngle;
        let sweep = endAngle - startAngle;
        if (sweep > Math.PI) sweep -= 2 * Math.PI;
        if (sweep < -Math.PI) sweep += 2 * Math.PI;

        const arcSegments = 32;
        const arcPts = [];
        for (let i = 0; i <= arcSegments; i++) {
          const t = i / arcSegments;
          const a = startAngle + sweep * t;
          arcPts.push(new THREE.Vector3(
            origin.x + arcRadius * Math.cos(a),
            origin.y + arcRadius * Math.sin(a),
            Z_PURPLE_OUTLINES
          ));
        }
        const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPts);
        outlineGroup.add(new THREE.Line(arcGeo, purpleMat));

        // Arrowhead at the end of the arc (pointing along arc direction)
        const lastA = startAngle + sweep;
        const arrowTip = new THREE.Vector3(
          origin.x + arcRadius * Math.cos(lastA),
          origin.y + arcRadius * Math.sin(lastA),
          Z_PURPLE_OUTLINES
        );
        // Tangent at end of arc: perpendicular to radial direction, in sweep direction
        const tangentSign = sweep > 0 ? 1 : -1;
        const tangentX = -Math.sin(lastA) * tangentSign;
        const tangentY = Math.cos(lastA) * tangentSign;
        const arrowLen = 3;
        const arrowSpread = 1.2;
        const arrowBase = new THREE.Vector3(
          arrowTip.x - tangentX * arrowLen,
          arrowTip.y - tangentY * arrowLen,
          Z_PURPLE_OUTLINES
        );
        const perpX = -tangentY, perpY = tangentX;
        const arrowGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(arrowBase.x + perpX * arrowSpread, arrowBase.y + perpY * arrowSpread, Z_PURPLE_OUTLINES),
          arrowTip,
          new THREE.Vector3(arrowBase.x - perpX * arrowSpread, arrowBase.y - perpY * arrowSpread, Z_PURPLE_OUTLINES),
        ]);
        outlineGroup.add(new THREE.Line(arrowGeo, purpleMat));

        // Angle text label
        const labelText = `${angleDeg.toFixed(1)}°`;
        const labelCanvas = document.createElement('canvas');
        labelCanvas.width = 128; labelCanvas.height = 64;
        const ctx = labelCanvas.getContext('2d');
        ctx.fillStyle = '#9933ff';
        ctx.font = 'bold 36px -apple-system, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(labelText, 64, 32);
        const labelTex = new THREE.CanvasTexture(labelCanvas);
        const labelMat = new THREE.SpriteMaterial({ map: labelTex, transparent: true, depthWrite: false });
        const labelSprite = new THREE.Sprite(labelMat);
        // Position at midpoint of arc
        const midA = startAngle + sweep * 0.5;
        labelSprite.position.set(
          origin.x + (arcRadius + 6) * Math.cos(midA),
          origin.y + (arcRadius + 6) * Math.sin(midA),
          Z_PURPLE_OUTLINES
        );
        labelSprite.scale.set(12, 6, 1);
        outlineGroup.add(labelSprite);

        console.log(`render3d R18: inner-thumb angle = ${angleDeg.toFixed(1)}° (inner dir=${(innerCol.angleDeg).toFixed(1)}°, thumb dir=${(thumbCol.angleDeg).toFixed(1)}°)`);
      }
    }
  } else {
    console.warn('render3d R17: no stage1Keys in config — purple outlines not drawn');
  }
  boardGroup.add(outlineGroup);

  // ── nice!nano MCU ──
  function createNiceNano(posX, posY, usbFacingRight) {
    const grp = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(18, 33, 1.6), nanoPcbMat);
    body.castShadow = true; grp.add(body);
    const ic = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 0.8), blackMat);
    ic.position.set(0, 4, 1.2); grp.add(ic);
    const ic2 = new THREE.Mesh(new THREE.BoxGeometry(3, 2.5, 0.6), blackMat);
    ic2.position.set(-4, -6, 1.1); grp.add(ic2);
    const usbBody = new THREE.Mesh(new THREE.BoxGeometry(8.94, 7.5, 3.26), chromeMat);
    usbBody.castShadow = true;
    const usbHole = new THREE.Mesh(new THREE.BoxGeometry(7.0, 2.0, 2.0),
      new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.9, metalness: 0.0 }));
    usbHole.position.set(0, -3.0, 0); usbBody.add(usbHole);
    usbBody.position.set(0, -33 / 2, 2.5); grp.add(usbBody);
    const padGeo = new THREE.BoxGeometry(1.0, 0.5, 0.05);
    for (let j = 0; j < 12; j++) {
      const lp = new THREE.Mesh(padGeo, goldMat); lp.position.set(-8.5, -13 + j * 2.54, 0.825); grp.add(lp);
      const rp = new THREE.Mesh(padGeo, goldMat); rp.position.set(8.5, -13 + j * 2.54, 0.825); grp.add(rp);
    }
    const btnGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.4, 8); btnGeo.rotateX(Math.PI / 2);
    const btn = new THREE.Mesh(btnGeo, new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.5, metalness: 0.5 }));
    btn.position.set(5, -12, 1.1); grp.add(btn);
    grp.position.set(posX, posY, Z_PCB_TOP + 0.8);
    if (usbFacingRight) grp.rotation.z = Math.PI;
    return grp;
  }
  const nanoLeftX = hingeX - 20, nanoY = center.y + 5;
  boardGroup.add(createNiceNano(nanoLeftX, nanoY, false));

  // ── Battery ──
  const batteryGroup = new THREE.Group();
  function addBattery(bx, by) {
    const bg = new THREE.Group();
    const battBody = new THREE.Mesh(new THREE.BoxGeometry(12, 30, 3), battMat);
    battBody.castShadow = true; bg.add(battBody);
    const wireRad = 0.25;
    [{ color: redMat, dx: -2 }, { color: blackMat, dx: 2 }].forEach(ww => {
      const wpts = [new THREE.Vector3(ww.dx, -15, 0), new THREE.Vector3(ww.dx, -18, 1), new THREE.Vector3(ww.dx, -20, 2)];
      const curve = new THREE.CatmullRomCurve3(wpts);
      bg.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 8, wireRad, 6), ww.color));
    });
    bg.position.set(bx, by, Z_CORK_LOWER + T_CORK_LOWER / 2 + 1.5);
    return bg;
  }
  batteryGroup.add(addBattery(hingeX - 35, center.y - 10));
  boardGroup.add(batteryGroup);

  // ── Screws ──
  const bx0 = bbox.min.x + 10, bx1 = bbox.max.x - 10;
  const by0 = bbox.min.y + 10, by1 = bbox.max.y - 10;
  const bmx = (bbox.min.x + bbox.max.x) / 2, bmy = center.y;
  const screwPositions = [[bx0, by0], [bx0, by1], [bx0, bmy], [bx1, by0], [bx1, by1], [bx1, bmy], [bmx, by0]].map(([x, y]) => ({ x, y }));
  const screwHeadGeo = new THREE.CylinderGeometry(2, 1, 1, 16); screwHeadGeo.rotateX(Math.PI / 2);
  const screwShaftGeo = new THREE.CylinderGeometry(1, 1, T_FRAME, 8); screwShaftGeo.rotateX(Math.PI / 2);
  const insertGeo = new THREE.CylinderGeometry(1.6, 1.6, 3, 16); insertGeo.rotateX(Math.PI / 2);
  const nScrews = screwPositions.length;
  const screwHeadInst = new THREE.InstancedMesh(screwHeadGeo, chromeMat.clone(), nScrews); screwHeadInst.castShadow = true;
  const screwShaftInst = new THREE.InstancedMesh(screwShaftGeo, steelMat.clone(), nScrews);
  const insertInst = new THREE.InstancedMesh(insertGeo, brassMat, nScrews);
  screwPositions.forEach((sp, i) => {
    dummy.position.set(sp.x, sp.y, Z_SWITCH_PLATE_TOP + 0.5); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1);
    dummy.updateMatrix(); screwHeadInst.setMatrixAt(i, dummy.matrix);
    dummy.position.z = Z_BOTTOM + T_FRAME / 2; dummy.updateMatrix(); screwShaftInst.setMatrixAt(i, dummy.matrix);
    dummy.position.z = Z_BOTTOM + 1.5; dummy.updateMatrix(); insertInst.setMatrixAt(i, dummy.matrix);
  });
  [screwHeadInst, screwShaftInst, insertInst].forEach(inst => { inst.instanceMatrix.needsUpdate = true; boardGroup.add(inst); });

  // ── Split into left/right halves ──
  const leftHalf = new THREE.Group();
  leftHalf.add(boardGroup);
  const rightHalf = new THREE.Group();
  const rightContent = boardGroup.clone(true);
  rightContent.applyMatrix4(new THREE.Matrix4().makeTranslation(-hingeX, 0, 0));
  rightContent.applyMatrix4(new THREE.Matrix4().makeScale(-1, 1, 1));
  rightContent.applyMatrix4(new THREE.Matrix4().makeTranslation(hingeX, 0, 0));
  rightContent.traverse(obj => {
    if (obj.isMesh || obj.isInstancedMesh) {
      obj.material = obj.material.clone();
      obj.material.side = THREE.DoubleSide;
    }
  });
  rightHalf.add(rightContent);

  // ── Key labels ──
  const keyMap = buildKeyPositionMap(pts);
  const nColsHalf = 5;
  const layer0 = DEFAULT_KEYMAPS.layer0;
  function getKeymapLabel(key) {
    const isRight = key.mirrored, isThumb = key.zone !== 'matrix';
    let idx;
    if (isThumb) {
      const thumbBase = nColsHalf * 2 * 3;
      const thumbKeys = (isRight ? keyMap.rightKeys : keyMap.leftKeys).filter(k2 => k2.zone !== 'matrix');
      const thumbIdx = thumbKeys.indexOf(key);
      idx = thumbBase + (isRight ? 3 : 0) + thumbIdx;
    } else {
      idx = key.rowIdx * (nColsHalf * 2) + (isRight ? nColsHalf : 0) + key.colIdx;
    }
    if (idx < 0 || idx >= layer0.length) return null;
    return zmkToLabel[layer0[idx]] || layer0[idx];
  }

  const labelTexCache = {};
  function makeLabelTex(letter) {
    if (labelTexCache[letter]) return labelTexCache[letter];
    const lc = document.createElement('canvas'); lc.width = 128; lc.height = 128;
    const lg = lc.getContext('2d');
    lg.clearRect(0, 0, 128, 128);
    lg.fillStyle = '#cccccc';
    lg.font = 'bold 56px -apple-system, "Segoe UI", sans-serif';
    lg.textAlign = 'center'; lg.textBaseline = 'middle';
    lg.fillText(letter, 64, 64);
    const t = new THREE.CanvasTexture(lc); t.needsUpdate = true;
    labelTexCache[letter] = t; return t;
  }

  const labelGeo = new THREE.PlaneGeometry(13, 13);
  const labelZ = Z_KEYCAP + 1.7;
  const leftLabelGroup = new THREE.Group();
  const rightLabelGroup = new THREE.Group();
  const rightLabelData = [];

  keyMap.leftKeys.forEach(k => {
    const label = getKeymapLabel(k);
    if (!label) return;
    const tex = makeLabelTex(label);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
    const lm = new THREE.Mesh(labelGeo, mat);
    const pt2 = pts[k.name]; if (!pt2) return;
    // Apply same Y/rotation negation as entry construction
    lm.position.set(pt2.x, -pt2.y, labelZ);
    lm.rotation.set(0, 0, -pt2.r * Math.PI / 180);
    leftLabelGroup.add(lm);
  });

  keyMap.rightKeys.forEach(k => {
    const label = getKeymapLabel(k);
    if (!label) return;
    const leftMatch = keyMap.leftKeys.find(lk => lk.zone === k.zone && lk.colIdx === k.colIdx && lk.rowIdx === k.rowIdx);
    if (!leftMatch) return;
    const lpt = pts[leftMatch.name]; if (!lpt) return;
    // Apply same Y/rotation negation as entry construction
    rightLabelData.push({ label, leftSx: lpt.x, leftSy: -lpt.y, leftSr: -lpt.r * Math.PI / 180 });
  });

  leftHalf.add(leftLabelGroup);
  rightLabelData.forEach(({ label, leftSx, leftSy, leftSr }) => {
    const tex = makeLabelTex(label);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
    const lm = new THREE.Mesh(labelGeo, mat);
    lm.position.set(2 * hingeX - leftSx, leftSy, labelZ);
    lm.rotation.set(0, 0, -leftSr);
    rightLabelGroup.add(lm);
  });
  rightHalf.add(rightLabelGroup);

  scene.add(leftHalf);
  scene.add(rightHalf);

  // ── Hinge ──
  const hingeGroup = new THREE.Group();
  const hy = center.y, hz = center.z;
  const halfBoardW = (bbox.max.x - bbox.min.x) / 2;
  const rodLen = Math.max(15, halfBoardW * 0.35);
  const rodOffset = rodLen / 2 + 5;
  const flangeOffset = rodOffset + rodLen / 2 + 3;
  const barrelLen = Math.max(20, rodOffset * 0.6);

  const barrelGeo = new THREE.CylinderGeometry(4, 4, barrelLen, 32); barrelGeo.rotateZ(Math.PI / 2);
  const barrel = new THREE.Mesh(barrelGeo, chromeMat.clone()); barrel.position.set(hingeX, hy, hz); barrel.castShadow = true;
  hingeGroup.add(barrel);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(3.5, 32, 32), copperMat);
  ball.position.set(hingeX, hy, hz); hingeGroup.add(ball);
  const rodGeo2 = new THREE.CylinderGeometry(2.5, 2.5, rodLen, 12); rodGeo2.rotateZ(Math.PI / 2);
  const rodL = new THREE.Mesh(rodGeo2, steelMat.clone()); rodL.position.set(hingeX - rodOffset, hy, hz); rodL.castShadow = true; hingeGroup.add(rodL);
  const rodR = new THREE.Mesh(rodGeo2, steelMat.clone()); rodR.position.set(hingeX + rodOffset, hy, hz); rodR.castShadow = true; hingeGroup.add(rodR);
  const flangeGeo = new THREE.BoxGeometry(6, 12, T_FRAME);
  const flangeL = new THREE.Mesh(flangeGeo, steelMat.clone()); flangeL.position.set(hingeX - flangeOffset, hy, hz); flangeL.castShadow = true; hingeGroup.add(flangeL);
  const flangeR = new THREE.Mesh(flangeGeo, steelMat.clone()); flangeR.position.set(hingeX + flangeOffset, hy, hz); flangeR.castShadow = true; hingeGroup.add(flangeR);
  const tnutGeo = new THREE.CylinderGeometry(5, 5, 3, 6);
  const tnut = new THREE.Mesh(tnutGeo, brassMat.clone()); tnut.position.set(hingeX, hy - 8, hz); tnut.rotation.x = Math.PI / 2; tnut.castShadow = true;
  hingeGroup.add(tnut);
  scene.add(hingeGroup);

  // ── Cables ──
  const cablesGroup = new THREE.Group();
  const cableZ2 = Z_SWITCH_PLATE_TOP + 1;
  const cYtop = bbox.min.y + (bbox.max.y - bbox.min.y) * 0.2;
  const cYbot = bbox.min.y + (bbox.max.y - bbox.min.y) * 0.8;
  const rightEdgeX = 2 * hingeX - bbox.min.x;
  [cYtop, cYbot].forEach(cy => {
    const cPoints = [
      new THREE.Vector3(bbox.min.x + 6, cy, cableZ2),
      new THREE.Vector3(bbox.min.x + (hingeX - bbox.min.x) * 0.5, cy, cableZ2 - 2),
      new THREE.Vector3(hingeX, cy, cableZ2 - 3),
      new THREE.Vector3(rightEdgeX - (hingeX - bbox.min.x) * 0.5, cy, cableZ2 - 2),
      new THREE.Vector3(rightEdgeX - 6, cy, cableZ2),
    ];
    const curve = new THREE.CatmullRomCurve3(cPoints);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.6, 8, false), cableMat);
    tube.castShadow = true; cablesGroup.add(tube);
    const tbGeo = new THREE.CylinderGeometry(2, 2, 16, 12); tbGeo.rotateZ(Math.PI / 2);
    const tb = new THREE.Mesh(tbGeo, chromeMat.clone()); tb.position.set(hingeX, cy, cableZ2 - 3); tb.castShadow = true; cablesGroup.add(tb);
    [bbox.min.x + 6, rightEdgeX - 6].forEach(ppx => {
      const pinGeo = new THREE.CylinderGeometry(1.2, 1.2, 4, 8);
      const pin = new THREE.Mesh(pinGeo, chromeMat.clone()); pin.position.set(ppx, cy, cableZ2); pin.castShadow = true; cablesGroup.add(pin);
    });
  });
  scene.add(cablesGroup);

  // ── Layer labels ──
  const labelSprites = [];
  function addLabel(text, x, y, z) {
    const lc = document.createElement('canvas'); lc.width = 256; lc.height = 64;
    const lg = lc.getContext('2d');
    lg.fillStyle = 'rgba(0,0,0,0)'; lg.fillRect(0, 0, 256, 64);
    lg.font = '600 22px -apple-system, BlinkMacSystemFont, sans-serif';
    lg.fillStyle = '#ffffff'; lg.textAlign = 'center'; lg.fillText(text, 128, 38);
    const tex = new THREE.CanvasTexture(lc);
    const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.85 });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.set(x, y, z); sprite.scale.set(40, 10, 1); sprite.visible = false;
    scene.add(sprite); labelSprites.push(sprite); return sprite;
  }
  addLabel('Bamboo Bottom Plate', hingeX, bbox.min.y - 8, Z_BOTTOM + T_BOTTOM_PLATE / 2);
  addLabel('Cork Gasket', hingeX, bbox.min.y - 8, Z_CORK_LOWER + T_CORK_LOWER / 2);
  addLabel('FR-4 PCB', hingeX, bbox.min.y - 8, Z_PCB + T_PCB / 2);
  addLabel('Switch Plate', hingeX, bbox.min.y - 8, Z_SWITCH_PLATE + T_SWITCH_PLATE / 2);
  addLabel('Cherry MX ULP', hingeX, bbox.min.y - 8, Z_KEYCAP);
  addLabel('nice!nano v2', nanoLeftX, bbox.min.y - 8, Z_PCB_TOP + 4);
  addLabel('Ball Joint Hinge', hingeX, hy + 20, hz + 8);
  addLabel('LiPo Battery', hingeX - 35, bbox.min.y - 8, Z_CORK_LOWER + 3);

  // ── Camera position (from HUMAN side) ──
  // In ergogen Y-up coordinates: top row has higher Y (far from human),
  // bottom row + thumbs have lower Y (near human).
  // Camera goes at low Y (near human), looking toward higher Y.
  const fullWidth = rightEdgeX - bbox.min.x;
  const fullHeight = bbox.max.y - bbox.min.y;
  const maxDim = Math.max(fullWidth, fullHeight);
  camera.position.set(hingeX, center.y - maxDim * 0.6, maxDim * 0.7);
  controls.target.set(hingeX, center.y, Z_SWITCH_PLATE_TOP / 2);
  console.log(`render3d camera: pos=(${camera.position.x.toFixed(0)}, ${camera.position.y.toFixed(0)}, ${camera.position.z.toFixed(0)}) target=(${hingeX.toFixed(0)}, ${center.y.toFixed(0)}, ${(Z_SWITCH_PLATE_TOP / 2).toFixed(1)})`);
  controls.update();

  // ── Fold mechanism ──
  function applyFold(angleDeg) {
    const halfRad = (angleDeg * Math.PI / 180) / 2;
    const yAxis = new THREE.Vector3(0, 1, 0);

    // Keys fold TOGETHER (inward): left rotates +Y, right rotates -Y
    // so keycap surfaces (Z+) face each other at 180°
    leftHalf.position.set(0, 0, 0); leftHalf.quaternion.identity();
    rightHalf.position.set(0, 0, 0); rightHalf.quaternion.identity();
    if (angleDeg > 0) {
      const offset = new THREE.Vector3(-hingeX, -hingeCenterY, -hingeZ);
      leftHalf.position.copy(offset.clone().applyAxisAngle(yAxis, halfRad).sub(offset));
      leftHalf.quaternion.setFromAxisAngle(yAxis, halfRad);
      const offset2 = new THREE.Vector3(-hingeX, -hingeCenterY, -hingeZ);
      rightHalf.position.copy(offset2.clone().applyAxisAngle(yAxis, -halfRad).sub(offset2));
      rightHalf.quaternion.setFromAxisAngle(yAxis, -halfRad);
    }

    // Articulate hinge
    hingeGroup.children.forEach(child => {
      if (!child.userData._origPos) { child.userData._origPos = child.position.clone(); child.userData._origQuat = child.quaternion.clone(); }
      child.position.copy(child.userData._origPos); child.quaternion.copy(child.userData._origQuat);
    });
    if (angleDeg > 0) {
      const pivot = new THREE.Vector3(hingeX, hingeCenterY, hingeZ);
      hingeGroup.children.forEach(child => {
        const origX = child.userData._origPos.x;
        if (origX < hingeX - 2) {
          const p = child.position.clone().sub(pivot); p.applyAxisAngle(yAxis, halfRad); child.position.copy(p.add(pivot));
          child.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(yAxis, halfRad));
        } else if (origX > hingeX + 2) {
          const p = child.position.clone().sub(pivot); p.applyAxisAngle(yAxis, -halfRad); child.position.copy(p.add(pivot));
          child.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(yAxis, -halfRad));
        }
      });
    }
    cablesGroup.visible = angleDeg === 0;
  }

  // ── Exploded view ──
  function applyExplodedView(on) {
    const gap = on ? 12 : 0;
    [leftHalf, rightHalf].forEach(half => {
      half.traverse(obj => {
        if (!obj.isMesh && !obj.isInstancedMesh) return;
        if (obj.userData._origZ === undefined) obj.userData._origZ = obj.position.z;
        const origZ = obj.userData._origZ;
        let layerIdx = 0;
        if (origZ >= Z_SWITCH_PLATE) layerIdx = 4;
        else if (origZ >= Z_CORK_UPPER) layerIdx = 3;
        else if (origZ >= Z_PCB) layerIdx = 2;
        else if (origZ >= Z_CORK_LOWER) layerIdx = 1;
        obj.position.z = origZ + layerIdx * gap;
      });
    });
  }

  // ── Key press interaction ──
  const pressedKeys = new Map();
  const PRESS_DEPTH = 1.5, PRESS_DOWN_MS = 80, PRESS_UP_MS = 200;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let keycapMeshL = null, keycapMeshR = null;
  const keycapBaseL = new Float32Array(keycapBaseMatrices);
  const keycapBaseR = new Float32Array(keycapBaseMatrices);

  leftHalf.traverse(obj => { if (obj.isInstancedMesh && obj.geometry === keycapGeo) keycapMeshL = obj; });
  rightHalf.traverse(obj => { if (obj.isInstancedMesh && obj.geometry === keycapGeo) keycapMeshR = obj; });

  function onKeyPress(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const targets = [keycapMeshL, keycapMeshR].filter(Boolean);
    const hits = raycaster.intersectObjects(targets);
    if (!hits.length) return;
    const hit = hits[0];
    const id = hit.instanceId, mesh = hit.object;
    const bases = mesh === keycapMeshL ? keycapBaseL : keycapBaseR;
    const key = `${mesh.id}_${id}`;
    if (pressedKeys.has(key)) return;
    pressedKeys.set(key, { id, mesh, bases, progress: 0, dir: 'down', t0: performance.now() });
  }

  function onHover(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const targets = [keycapMeshL, keycapMeshR].filter(Boolean);
    const hits = raycaster.intersectObjects(targets);
    renderer.domElement.style.cursor = hits.length ? 'pointer' : '';
  }

  function updateKeyPresses() {
    const now = performance.now();
    for (const [key, st] of pressedKeys) {
      const elapsed = now - st.t0;
      if (st.dir === 'down') { st.progress = Math.min(1, elapsed / PRESS_DOWN_MS); if (st.progress >= 1) { st.dir = 'up'; st.t0 = now; } }
      else { st.progress = Math.max(0, 1 - elapsed / PRESS_UP_MS);
        if (st.progress <= 0) { const bm = new THREE.Matrix4(); bm.fromArray(st.bases, st.id * 16); st.mesh.setMatrixAt(st.id, bm); st.mesh.instanceMatrix.needsUpdate = true; pressedKeys.delete(key); continue; }
      }
      const ease = st.progress * (2 - st.progress);
      const bm = new THREE.Matrix4(); bm.fromArray(st.bases, st.id * 16);
      const pos = new THREE.Vector3(), quat = new THREE.Quaternion(), scl = new THREE.Vector3();
      bm.decompose(pos, quat, scl); pos.z -= PRESS_DEPTH * ease;
      st.mesh.setMatrixAt(st.id, new THREE.Matrix4().compose(pos, quat, scl)); st.mesh.instanceMatrix.needsUpdate = true;
    }
  }

  renderer.domElement.addEventListener('pointerdown', onKeyPress);
  renderer.domElement.addEventListener('pointermove', onHover);

  // ── Animation loop ──
  function animate() {
    requestAnimationFrame(animate);
    updateKeyPresses();
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  // ── Resize handler ──
  window.addEventListener('resize', () => {
    const ww = container.clientWidth, hh = container.clientHeight;
    camera.aspect = ww / hh; camera.updateProjectionMatrix();
    renderer.setSize(ww, hh);
  });

  // ── Return control interface for wizard.html to wire up UI ──
  return {
    applyFold,
    applyExplodedView,
    setLabelsVisible: (v) => labelSprites.forEach(s => s.visible = v),
    setCablesVisible: (v) => { cablesGroup.visible = v; },
    setHingeVisible: (v) => { hingeGroup.visible = v; },
    setBatteryVisible: (v) => { batteryGroup.visible = v; },
    renderer, scene, camera,
    // Diagnostic: call from browser console as window._newSceneCtrl.diagnose()
    diagnose: () => {
      console.group('render3d self-diagnostic');
      console.log(`Left keys: ${leftKeys.length}, Right keys: ${rightKeys.length}`);
      console.log(`kx=${kx}, ky=${ky}, px=${px}, py=${py}`);
      console.log(`Board bbox: min=(${bbox.min.x.toFixed(1)},${bbox.min.y.toFixed(1)},${bbox.min.z.toFixed(1)}) max=(${bbox.max.x.toFixed(1)},${bbox.max.y.toFixed(1)},${bbox.max.z.toFixed(1)})`);
      console.log(`Center: (${center.x.toFixed(1)},${center.y.toFixed(1)},${center.z.toFixed(1)})`);
      console.log(`HingeX: ${hingeX.toFixed(1)}`);
      console.log(`Camera: pos=(${camera.position.x.toFixed(1)},${camera.position.y.toFixed(1)},${camera.position.z.toFixed(1)})`);
      console.log('Left keys:');
      leftKeys.forEach(k => {
        const isThumb = k.meta?.zone?.name === 'thumb';
        console.log(`  ${k.name}: (${k.x.toFixed(1)}, ${k.y.toFixed(1)}) r=${k.r.toFixed(1)}° ${isThumb ? '[thumb]' : ''}`);
      });
      // Check if all keys are within the board bbox (X-Y only)
      let allInBbox = true;
      leftKeys.forEach(k => {
        const margin = 2; // mm tolerance
        if (k.x < bbox.min.x - margin || k.x > bbox.max.x + margin ||
            k.y < bbox.min.y - margin || k.y > bbox.max.y + margin) {
          console.warn(`  KEY OUTSIDE BBOX: ${k.name} at (${k.x.toFixed(1)}, ${k.y.toFixed(1)})`);
          allInBbox = false;
        }
      });
      if (allInBbox) console.log('All left keys within board bbox (+/-2mm)');
      console.groupEnd();
    }
  };
}

// Export to global scope for wizard.html
window.buildNewScene = buildNewScene;
window.THREE = THREE; // Expose for runtime verification (verify-runtime.js)
