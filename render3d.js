// render3d.js — Points-based 3D keyboard renderer
// Builds geometry directly from ergogenResults.points, no SVG parsing.
// Loaded as ES module alongside wizard.html.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { HARDWARE_CATALOG, DEFAULT_SELECTION } from './hardware-catalog.js';
import { buildHardwareAssembly } from './hardware-builders.js';

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
  // No thumb rotation correction — stage 1 purple outlines (R17) are the truth source.
  // Previously had THUMB_ROT_CORRECTION = -90 which was wrong.
  const THUMB_ROT_CORRECTION = 0; // degrees — no correction
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

  // ── Override thumb positions with stage 1 data (R17/R19 fix) ──
  // Ergogen's thumb zone placement differs from the stage 1 fitted-line algorithm.
  // The purple outlines (stage 1) show the correct positions; override ergogen's.
  const stage1KeysForThumb = config._stage1Keys;
  if (stage1KeysForThumb && stage1KeysForThumb['thumb']) {
    const thumbS1 = stage1KeysForThumb['thumb'];
    // Stage 1 thumb: 3 keys [bottom, home, top] in ergogen mm space (Y-up)
    const s1Positions = [thumbS1.bottom, thumbS1.home, thumbS1.top];
    const s1RotDeg = -thumbS1.angleDeg; // ergogen CCW → scene (Y-down) negate
    const thumbKeysLeft = leftKeys.filter(k => k.meta?.zone?.name === 'thumb' || k.name.startsWith('thumb_'));
    if (thumbKeysLeft.length === s1Positions.length) {
      // Sort both by Y to align bottom→top
      const sortedThumb = [...thumbKeysLeft].sort((a, b) => a.y - b.y);
      const sortedS1 = [...s1Positions].sort((a, b) => (-a.y) - (-b.y)); // scene Y = -ergoY, sort ascending
      sortedThumb.forEach((tk, i) => {
        const s1 = sortedS1[i];
        tk.x = s1.x;
        tk.y = -s1.y; // ergogen Y-up → scene Y-down
        tk.r = s1RotDeg;
        console.log(`  Thumb override [${i}] ${tk.name}: → (${tk.x.toFixed(1)}, ${tk.y.toFixed(1)}) r=${tk.r.toFixed(1)}°`);
      });
    } else {
      console.warn(`render3d: thumb key count mismatch: ergogen=${thumbKeysLeft.length}, stage1=3`);
    }
  }

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

  // ── Build board layers (R26: each layer in its own tagged group for visibility toggling) ──
  const boardGroup = new THREE.Group();

  // Layer groups — each tagged with userData.layerId for per-layer visibility control
  const layerBottomPlate = new THREE.Group(); layerBottomPlate.userData.layerId = 'bottomPlate';
  const layerCorkLower   = new THREE.Group(); layerCorkLower.userData.layerId   = 'corkLower';
  const layerPCB         = new THREE.Group(); layerPCB.userData.layerId         = 'pcb';
  const layerCorkUpper   = new THREE.Group(); layerCorkUpper.userData.layerId   = 'corkUpper';
  const layerSwitchPlate = new THREE.Group(); layerSwitchPlate.userData.layerId = 'switchPlate';
  const layerKeycaps     = new THREE.Group(); layerKeycaps.userData.layerId     = 'keycaps';

  // Bottom plate — bamboo
  layerBottomPlate.add(extrudeLayer(boardShape, T_BOTTOM_PLATE, bambooMat, Z_BOTTOM,
    { bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.3, bevelSegments: 2 }));
  // Frame surround (part of bottom plate layer — it spans full stack but is structurally bottom)
  if (frameSurroundShape) {
    layerBottomPlate.add(extrudeLayer(frameSurroundShape, T_FRAME, bambooMat.clone(), Z_BOTTOM,
      { bevelEnabled: true, bevelThickness: 0.4, bevelSize: 0.4, bevelSegments: 2 }));
  }
  // Cork gasket lower
  layerCorkLower.add(extrudeLayer(boardShape, T_CORK_LOWER, corkMat, Z_CORK_LOWER));
  // PCB
  const pcbLayer = extrudeLayer(boardShape, T_PCB, corkMat, Z_PCB); // placeholder material
  layerPCB.add(pcbLayer);
  // Cork gasket upper
  layerCorkUpper.add(extrudeLayer(boardShape, T_CORK_UPPER, corkMat, Z_CORK_UPPER));
  // Switch plate with cutouts
  layerSwitchPlate.add(extrudeLayer(switchPlateShape, T_SWITCH_PLATE, bambooSideMat, Z_SWITCH_PLATE,
    { bevelEnabled: true, bevelThickness: 0.2, bevelSize: 0.2, bevelSegments: 1 }));

  // Add all layer groups to boardGroup
  [layerBottomPlate, layerCorkLower, layerPCB, layerCorkUpper, layerSwitchPlate, layerKeycaps].forEach(g => boardGroup.add(g));

  // ── Compute bbox for PCB texture and hardware placement ──
  const bbox = new THREE.Box3().setFromObject(boardGroup);
  const center = new THREE.Vector3(); bbox.getCenter(center);
  let hingeX = bbox.max.x;
  // Hinge pivot at top surface so halves fold together cleanly (keycap-to-keycap)
  // without inner edges colliding
  const hingeZ = Z_SWITCH_PLATE_TOP;
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

  // Assign per-key instanced meshes to their respective layer groups
  [switchInst, keycapInst, stemInst, diodeInst, diodeLeadInst].forEach(inst => {
    inst.instanceMatrix.needsUpdate = true;
  });
  // Keycaps + stems + switch housings → keycaps layer (user sees them as one unit)
  layerKeycaps.add(keycapInst);
  layerKeycaps.add(stemInst);
  // Switch housings sit on the switch plate
  layerSwitchPlate.add(switchInst);
  // Diodes are on the PCB
  layerPCB.add(diodeInst);
  layerPCB.add(diodeLeadInst);

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
      const innerBot = { x: innerCol.bottom.x, y: -innerCol.bottom.y };
      const innerTop = { x: innerCol.top.x, y: -innerCol.top.y };
      const thumbBot = { x: thumbCol.bottom.x, y: -thumbCol.bottom.y };
      const thumbTop = { x: thumbCol.top.x, y: -thumbCol.top.y };

      // Thumb direction: top→bottom (negated) so it points toward thumb cluster
      // after boardRoot's 180° Z rotation
      const thumbDx = -(thumbTop.x - thumbBot.x), thumbDy = -(thumbTop.y - thumbBot.y);
      // Inner direction: bottom→top (NOT negated) so it points ABOVE the thumb axis
      // after boardRoot's 180° Z rotation. This ensures the arc spans the acute angle
      // between them (the angle between the columns) rather than the reflex angle.
      const innerDx = (innerTop.x - innerBot.x), innerDy = (innerTop.y - innerBot.y);
      const innerLen = Math.sqrt(innerDx * innerDx + innerDy * innerDy);
      const thumbLen = Math.sqrt(thumbDx * thumbDx + thumbDy * thumbDy);

      if (innerLen > 0.1 && thumbLen > 0.1) {
        // Angle between the two column directions
        const dot = (innerDx * thumbDx + innerDy * thumbDy) / (innerLen * thumbLen);
        const angleBetween = Math.acos(Math.max(-1, Math.min(1, dot)));
        const angleDeg = angleBetween * 180 / Math.PI;

        // Origin at thumb column home position (intersection at thumb cluster)
        const origin = { x: thumbCol.home.x, y: -thumbCol.home.y };
        const lineLen = 25;

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
        const arcRadius = 15;
        const innerAngle = Math.atan2(iuy, iux);
        const thumbAngle = Math.atan2(tuy, tux);
        let startAngle = thumbAngle, endAngle = innerAngle;
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

        // Arrowhead at the end of the arc
        const lastA = startAngle + sweep;
        const arrowTip = new THREE.Vector3(
          origin.x + arcRadius * Math.cos(lastA),
          origin.y + arcRadius * Math.sin(lastA),
          Z_PURPLE_OUTLINES
        );
        const tangentSign = sweep > 0 ? 1 : -1;
        const tangentX = -Math.sin(lastA) * tangentSign;
        const tangentY = Math.cos(lastA) * tangentSign;
        const arrowLen = 3, arrowSpread = 1.2;
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
  outlineGroup.visible = false; // hidden by default (R17 stage 1 debug overlays)
  boardGroup.add(outlineGroup);

  // ── R30-R36: Compute MCU/battery/USB-C positions from pinky column ──
  const halfCenterX = (bbox.min.x + hingeX) / 2;
  const halfCenterY = center.y;

  // R31: Find pinky column (colIdx 0) to position MCU
  // leftKeys entries have meta.column_net (e.g. "C0") and meta.zone.name (e.g. "matrix")
  const pinkyKeys = leftKeys.filter(k => {
    const zone = k.meta?.zone?.name || 'matrix';
    const colNet = k.meta?.column_net || '';
    return zone === 'matrix' && colNet === 'C0';
  });
  console.log(`render3d: pinkyKeys (colIdx 0) found: ${pinkyKeys.length}`, pinkyKeys.map(k => `(${k.x.toFixed(1)},${k.y.toFixed(1)})`));
  // Fallback if no pinky keys found: use bbox outer edge
  const pinkyInnerEdgeX = pinkyKeys.length > 0
    ? Math.max(...pinkyKeys.map(k => k.x)) + kx / 2
    : bbox.min.x + kx;
  const pinkyYMin = pinkyKeys.length > 0 ? Math.min(...pinkyKeys.map(k => k.y)) : bbox.min.y;
  const pinkyYMax = pinkyKeys.length > 0 ? Math.max(...pinkyKeys.map(k => k.y)) : bbox.max.y;
  const pinkyYCenter = (pinkyYMin + pinkyYMax) / 2;

  // nice!nano dimensions
  const NANO_W = 18, NANO_L = 33, NANO_PCB_T = 1.6;
  const USB_W = 8.94, USB_H = 7.5, USB_T = 3.26;

  // ── R31/R32/R34/R39: Compute MCU position and rotation from board edge ──
  // The MCU is placed so its USB-C port is flush with the board outline edge.
  // The rotation angle is determined by sampling the board outline at the left and
  // right edges of the USB-C port (R39).
  const frameWall = 4; // S05: frame wall width

  // Step 1: Get dense sample points along the board outline
  const outlinePts = boardShape.getPoints(256);

  // Step 2: Find the outline point nearest to the desired USB-C location.
  // We want the USB-C near the bottom of the pinky column (min Y region, near pinky X).
  // Target: near the bottom-left corner of the board (low X, low Y in model space).
  const usbTargetX = pinkyInnerEdgeX; // near pinky inner edge
  const usbTargetY = pinkyYMin - ky / 2; // below the bottom pinky key
  let nearestIdx = 0, nearestDist = Infinity;
  outlinePts.forEach((p, i) => {
    const d = Math.sqrt((p.x - usbTargetX) ** 2 + (p.y - usbTargetY) ** 2);
    if (d < nearestDist) { nearestDist = d; nearestIdx = i; }
  });
  const usbCenterOnEdge = outlinePts[nearestIdx];

  // Step 3 (R39): Sample outline at ±USB_W/2 from the nearest point to get the edge angle.
  // Walk along the outline polyline from nearestIdx to find points at ±USB_W/2 arc distance.
  function walkOutline(pts, startIdx, dist) {
    // Walk forward (positive dist) or backward (negative dist) along the polyline
    const n = pts.length;
    let remaining = Math.abs(dist);
    let dir = dist >= 0 ? 1 : -1;
    let idx = startIdx;
    while (remaining > 0) {
      const nextIdx = (idx + dir + n) % n;
      const dx = pts[nextIdx].x - pts[idx].x;
      const dy = pts[nextIdx].y - pts[idx].y;
      const segLen = Math.sqrt(dx * dx + dy * dy);
      if (segLen >= remaining) {
        // Interpolate within this segment
        const t = remaining / segLen;
        return { x: pts[idx].x + dx * t, y: pts[idx].y + dy * t };
      }
      remaining -= segLen;
      idx = nextIdx;
    }
    return pts[idx]; // shouldn't reach here
  }
  const usbHalfW = USB_W / 2;
  const edgePtLeft = walkOutline(outlinePts, nearestIdx, -usbHalfW);
  const edgePtRight = walkOutline(outlinePts, nearestIdx, usbHalfW);

  // Edge tangent angle (in model-space XY plane)
  const edgeAngle = Math.atan2(edgePtRight.y - edgePtLeft.y, edgePtRight.x - edgePtLeft.x);
  console.log(`render3d MCU: edge angle at USB-C = ${(edgeAngle * 180 / Math.PI).toFixed(1)}°`);
  console.log(`  USB-C edge center: (${usbCenterOnEdge.x.toFixed(1)}, ${usbCenterOnEdge.y.toFixed(1)})`);
  console.log(`  Edge sample L: (${edgePtLeft.x.toFixed(1)}, ${edgePtLeft.y.toFixed(1)})`);
  console.log(`  Edge sample R: (${edgePtRight.x.toFixed(1)}, ${edgePtRight.y.toFixed(1)})`);

  // Step 4: Compute the inward normal direction (pointing into the board interior).
  // The edge tangent is edgeAngle. The outward normal is edgeAngle - PI/2 (for a CCW outline).
  // The inward normal is edgeAngle + PI/2.
  // But convex hull winding could be CW or CCW. Check by testing which side the board center is on.
  const testNormalA = edgeAngle + Math.PI / 2;
  const testPtA = {
    x: usbCenterOnEdge.x + Math.cos(testNormalA) * 5,
    y: usbCenterOnEdge.y + Math.sin(testNormalA) * 5
  };
  // The board center should be on the inward side
  const distToCenter = Math.sqrt((center.x - usbCenterOnEdge.x) ** 2 + (center.y - usbCenterOnEdge.y) ** 2);
  const distTestToCenter = Math.sqrt((center.x - testPtA.x) ** 2 + (center.y - testPtA.y) ** 2);
  const inwardAngle = distTestToCenter < distToCenter ? testNormalA : (edgeAngle - Math.PI / 2);
  console.log(`  Inward normal angle: ${(inwardAngle * 180 / Math.PI).toFixed(1)}°`);

  // Step 5: Position MCU.
  // USB-C tip (outer face) flush with the board edge point. MCU body extends inward.
  // USB-C box extends USB_H/2 from its center. USB-C center is at local (0, -NANO_L/2 - USB_H/2).
  // USB-C tip (outermost face) is at local (0, -NANO_L/2 - USB_H).
  // So MCU center = usbCenterOnEdge + inwardDirection * (NANO_L/2 + USB_H)
  const mcuOffsetFromEdge = NANO_L / 2 + USB_H;
  const nanoCenterX = usbCenterOnEdge.x + Math.cos(inwardAngle) * mcuOffsetFromEdge;
  const nanoCenterY = usbCenterOnEdge.y + Math.sin(inwardAngle) * mcuOffsetFromEdge;

  // MCU rotation: the MCU's local -Y axis should point along the outward normal (toward the edge).
  // Local -Y = outward direction means local +Y = inward direction.
  // MCU local +Y is "up" along the body. We want it to point inward.
  // The MCU's Z rotation = inwardAngle - PI/2 (because local +Y at rotation=0 points along +Y axis,
  // and we want it to point along inwardAngle).
  const nanoRotZ = inwardAngle - Math.PI / 2;
  console.log(`  MCU center: (${nanoCenterX.toFixed(1)}, ${nanoCenterY.toFixed(1)}), rot: ${(nanoRotZ * 180 / Math.PI).toFixed(1)}°`);

  // ── nice!nano MCU (R30: on PCB UNDERSIDE, components facing down) ──
  // The MCU sits below the main PCB (Z_PCB - NANO_PCB_T/2 ≈ 0.7mm), which is inside the
  // bottom plate and cork lower layers. To keep it visible from the default camera angle,
  // all MCU meshes use depthTest:false + renderOrder so they render through occluding layers.
  function createNiceNano(posX, posY, rotZ) {
    const grp = new THREE.Group();
    // Helper: make material render on top of occluding geometry
    function mcuMat(baseMat) {
      const m = baseMat.clone();
      m.depthTest = false;
      m.transparent = true;
      m.opacity = 0.92;
      return m;
    }
    const mcuRenderOrder = 100;
    // MCU PCB body
    const body = new THREE.Mesh(new THREE.BoxGeometry(NANO_W, NANO_L, NANO_PCB_T), mcuMat(nanoPcbMat));
    body.renderOrder = mcuRenderOrder; body.castShadow = true; grp.add(body);
    // ICs face downward (negative Z in local coords)
    const ic = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 0.8), mcuMat(blackMat));
    ic.position.set(0, 4, -1.2); ic.renderOrder = mcuRenderOrder; grp.add(ic);
    const ic2 = new THREE.Mesh(new THREE.BoxGeometry(3, 2.5, 0.6), mcuMat(blackMat));
    ic2.position.set(-4, -6, -1.1); ic2.renderOrder = mcuRenderOrder; grp.add(ic2);
    // Solder pads (12 per side)
    const padGeo = new THREE.BoxGeometry(1.0, 0.5, 0.05);
    for (let j = 0; j < 12; j++) {
      const lp = new THREE.Mesh(padGeo, mcuMat(goldMat)); lp.position.set(-8.5, -13 + j * 2.54, 0.825); lp.renderOrder = mcuRenderOrder; grp.add(lp);
      const rp = new THREE.Mesh(padGeo, mcuMat(goldMat)); rp.position.set(8.5, -13 + j * 2.54, 0.825); rp.renderOrder = mcuRenderOrder; grp.add(rp);
    }
    // Reset button
    const btnGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.4, 8); btnGeo.rotateX(Math.PI / 2);
    const btn = new THREE.Mesh(btnGeo, mcuMat(new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.5, metalness: 0.5 })));
    btn.position.set(5, -12, -1.1); btn.renderOrder = mcuRenderOrder; grp.add(btn);
    // R34: USB-C connector as part of MCU mesh, at the short edge facing outward
    const usbBody = new THREE.Mesh(new THREE.BoxGeometry(USB_W, USB_H, USB_T), mcuMat(chromeMat));
    usbBody.renderOrder = mcuRenderOrder; usbBody.castShadow = true;
    const usbHole = new THREE.Mesh(new THREE.BoxGeometry(7.0, 2.0, 2.0),
      mcuMat(new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.9, metalness: 0.0 })));
    usbHole.position.set(0, -USB_H / 2 + 1.0, 0); usbHole.renderOrder = mcuRenderOrder; usbBody.add(usbHole);
    usbBody.position.set(0, -NANO_L / 2 - USB_H / 2, -USB_T / 2 + NANO_PCB_T / 2);
    grp.add(usbBody);
    // R30: Z position — MCU PCB top (solder side) flush against main PCB underside
    grp.position.set(posX, posY, Z_PCB - NANO_PCB_T / 2);
    grp.rotation.z = rotZ; // R32/R39: rotate to match board edge angle
    return grp;
  }
  layerPCB.add(createNiceNano(nanoCenterX, nanoCenterY, nanoRotZ));

  // For downstream references (battery, pocket, labels, USB slot)
  const nanoLeftX = nanoCenterX;
  const nanoY = nanoCenterY;

  // R32: Milled USB-C slot in outer frame edge (visible cutout)
  // The slot is at the board edge, rotated to match the edge angle
  const usbSlotW = USB_W + 2; // slightly wider than USB-C for cable clearance
  const usbSlotH = USB_T + 1; // height clearance
  const usbSlotMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9, metalness: 0.0 });
  const usbSlotMesh = new THREE.Mesh(
    new THREE.BoxGeometry(usbSlotW, frameWall + 2, usbSlotH), usbSlotMat
  );
  // Position at the USB-C edge point, rotated to match edge
  usbSlotMesh.position.set(usbCenterOnEdge.x, usbCenterOnEdge.y, Z_PCB - USB_T / 2);
  usbSlotMesh.rotation.z = nanoRotZ; // align with edge angle
  layerBottomPlate.add(usbSlotMesh);

  // ── Battery (R36: adjacent to MCU in shared under-PCB cavity) ──
  // Battery placed adjacent to MCU along the edge tangent direction (perpendicular to inward normal)
  const batteryGroup = new THREE.Group();
  const battThickness = 3.0; // 301230 LiPo: 12 × 30 × 3mm
  function addBattery(bx, by, rotZ) {
    const bg = new THREE.Group();
    const battBody = new THREE.Mesh(new THREE.BoxGeometry(12, 30, battThickness), battMat);
    battBody.castShadow = true; bg.add(battBody);
    const wireRad = 0.25;
    [{ color: redMat, dx: -2 }, { color: blackMat, dx: 2 }].forEach(ww => {
      const wpts = [new THREE.Vector3(ww.dx, -15, 0), new THREE.Vector3(ww.dx, -18, 1), new THREE.Vector3(ww.dx, -20, 2)];
      const curve = new THREE.CatmullRomCurve3(wpts);
      bg.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 8, wireRad, 6), ww.color));
    });
    bg.position.set(bx, by, Z_PCB - battThickness / 2);
    bg.rotation.z = rotZ;
    return bg;
  }
  // R36: Battery adjacent to MCU — offset along edge tangent (perpendicular to inward normal)
  // Edge tangent direction is edgeAngle; offset along it to place battery next to MCU
  const battOffset = NANO_W / 2 + 8; // half MCU width + 8mm gap
  const battX = nanoCenterX + Math.cos(edgeAngle) * battOffset;
  const battY = nanoCenterY + Math.sin(edgeAngle) * battOffset;
  batteryGroup.add(addBattery(battX, battY, nanoRotZ));
  layerCorkLower.add(batteryGroup);

  // ── R33: Bottom plate milled pocket for MCU + battery + cork cutout ──
  // The pocket is an axis-aligned bounding box around the rotated MCU + battery footprints.
  const recessMat = new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 0.8, metalness: 0.0 });
  // Compute rotated corners of MCU and battery to find the AABB
  function rotatedCorners(cx, cy, w, h, angle) {
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const hw = w / 2, hh = h / 2;
    return [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(([dx, dy]) => ({
      x: cx + dx * cos - dy * sin,
      y: cy + dx * sin + dy * cos
    }));
  }
  const mcuCorners = rotatedCorners(nanoCenterX, nanoCenterY, NANO_W, NANO_L + USB_H, nanoRotZ);
  const battCorners = rotatedCorners(battX, battY, 12, 30, nanoRotZ);
  const allCorners = [...mcuCorners, ...battCorners];
  const pocketMinX = Math.min(...allCorners.map(c => c.x)) - 1;
  const pocketMaxX = Math.max(...allCorners.map(c => c.x)) + 1;
  const pocketMinY = Math.min(...allCorners.map(c => c.y)) - 1;
  const pocketMaxY = Math.max(...allCorners.map(c => c.y)) + 1;
  const pocketW = pocketMaxX - pocketMinX;
  const pocketH = pocketMaxY - pocketMinY;
  const pocketCx = (pocketMinX + pocketMaxX) / 2;
  const pocketCy = (pocketMinY + pocketMaxY) / 2;
  // Recess in bottom plate (visible dark area)
  const recessMesh = new THREE.Mesh(new THREE.BoxGeometry(pocketW, pocketH, T_BOTTOM_PLATE * 0.9), recessMat);
  recessMesh.position.set(pocketCx, pocketCy, Z_BOTTOM + T_BOTTOM_PLATE * 0.05);
  layerBottomPlate.add(recessMesh);
  // Cork lower cutout (matching hole)
  const corkCutoutMesh = new THREE.Mesh(
    new THREE.BoxGeometry(pocketW, pocketH, T_CORK_LOWER + 0.1), recessMat
  );
  corkCutoutMesh.position.set(pocketCx, pocketCy, Z_CORK_LOWER + T_CORK_LOWER / 2);
  layerCorkLower.add(corkCutoutMesh);

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
  screwShaftInst.userData._screwShaft = true;
  const insertInst = new THREE.InstancedMesh(insertGeo, brassMat, nScrews);
  screwPositions.forEach((sp, i) => {
    dummy.position.set(sp.x, sp.y, Z_SWITCH_PLATE_TOP + 0.5); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1);
    dummy.updateMatrix(); screwHeadInst.setMatrixAt(i, dummy.matrix);
    dummy.position.z = Z_BOTTOM + T_FRAME / 2; dummy.updateMatrix(); screwShaftInst.setMatrixAt(i, dummy.matrix);
    dummy.position.z = Z_BOTTOM + 1.5; dummy.updateMatrix(); insertInst.setMatrixAt(i, dummy.matrix);
  });
  const screwGroup = new THREE.Group(); screwGroup.userData.layerId = 'screws';
  [screwHeadInst, screwShaftInst, insertInst].forEach(inst => { inst.instanceMatrix.needsUpdate = true; screwGroup.add(inst); });
  boardGroup.add(screwGroup);

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
  const leftLabelGroup = new THREE.Group(); leftLabelGroup.userData.layerId = 'keycaps';
  const rightLabelGroup = new THREE.Group(); rightLabelGroup.userData.layerId = 'keycaps';
  const rightLabelData = [];

  keyMap.leftKeys.forEach(k => {
    const label = getKeymapLabel(k);
    if (!label) return;
    const tex = makeLabelTex(label);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
    const lm = new THREE.Mesh(labelGeo, mat);
    const pt2 = pts[k.name]; if (!pt2) return;
    // Apply same Y/rotation negation as entry construction
    // Add Math.PI to Z rotation to counter boardRoot's 180° Z rotation (keeps text upright)
    lm.position.set(pt2.x, -pt2.y, labelZ);
    lm.rotation.set(0, 0, -pt2.r * Math.PI / 180 + Math.PI);
    leftLabelGroup.add(lm);
  });

  keyMap.rightKeys.forEach(k => {
    const label = getKeymapLabel(k);
    if (!label) return;
    const leftMatch = keyMap.leftKeys.find(lk => lk.zone === k.zone && lk.colIdx === k.colIdx && lk.rowIdx === k.rowIdx);
    if (!leftMatch) return;
    const lpt = pts[leftMatch.name]; if (!lpt) return;
    // Apply same Y/rotation negation as entry construction
    // Add Math.PI to counter boardRoot's 180° Z rotation (keeps text upright)
    rightLabelData.push({ label, leftSx: lpt.x, leftSy: -lpt.y, leftSr: -lpt.r * Math.PI / 180 + Math.PI });
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

  // ── R19: Wrap all board geometry in a root group rotated 180° around Z ──
  // This flips the board so thumbs face the user (closest to camera).
  const boardRoot = new THREE.Group();
  boardRoot.rotation.z = Math.PI;  // 180° around Z axis (axis sticking out of table)

  scene.add(boardRoot);

  boardRoot.add(leftHalf);
  boardRoot.add(rightHalf);

  // ── Hinge + Cables: Modular Hardware Assembly ──
  const hy = center.y, hz = center.z;
  const cableZ = Z_BOTTOM - 1; // underside of bottom plate
  const rightEdgeX = 2 * hingeX - bbox.min.x;

  // F05.2-F05.5: Cable Y-positions from actual switch coordinates.
  const cableKeyMap = buildKeyPositionMap(pts);
  const HALF_SWITCH = 6.9; // half of 13.8mm switch footprint

  function findKeyScenePos(keys, rowIdx, colIdx) {
    const k = keys.find(kk => kk.zone === 'matrix' && kk.rowIdx === rowIdx && kk.colIdx === colIdx);
    if (!k) return null;
    return { x: k.x, y: -k.y };
  }

  const nPos = findKeyScenePos(cableKeyMap.rightKeys, 2, 0);
  const zPos = findKeyScenePos(cableKeyMap.leftKeys, 2, 0);
  const yPos = findKeyScenePos(cableKeyMap.rightKeys, 0, 0);
  const qPos = findKeyScenePos(cableKeyMap.leftKeys, 0, 0);

  const nearCableY = (nPos && zPos) ? (nPos.y + zPos.y) / 2 : bbox.min.y + (bbox.max.y - bbox.min.y) * 0.8;
  const farCableY = (yPos && qPos) ? (yPos.y + qPos.y) / 2 : bbox.min.y + (bbox.max.y - bbox.min.y) * 0.2;

  const nearLeftX = zPos ? zPos.x + HALF_SWITCH : bbox.min.x + 10;
  const nearRightX = nPos ? (2 * hingeX - nPos.x) - HALF_SWITCH : rightEdgeX - 10;
  const farLeftX = qPos ? qPos.x - HALF_SWITCH : bbox.min.x + 10;
  const farRightX = yPos ? (2 * hingeX - yPos.x) + HALF_SWITCH : rightEdgeX - 10;

  // Current hardware selection (mutable for UI swapping)
  let hwSelection = { ...DEFAULT_SELECTION };
  const hwMats = { steel: steelMat, brass: brassMat, chrome: chromeMat, copper: copperMat, cable: cableMat };
  const hwGeo = {
    hingeX, hingeCenterY: center.y, hingeZ,
    bbox, boardSpan: bbox.max.y - bbox.min.y,
    cableAttachPoints: { nearLeftX, nearRightX, farLeftX, farRightX, nearCableY, farCableY },
    cableZ,
    layers: { Z_BOTTOM, T_BOTTOM_PLATE, T_CORK_LOWER, T_FRAME },
  };

  let hwAssembly = buildHardwareAssembly(HARDWARE_CATALOG, hwSelection, hwMats, hwGeo);
  boardRoot.add(hwAssembly.group);

  // Aliases for compatibility with rest of code
  const hingeGroup = hwAssembly.hingeResult.group;
  const cablesGroup = hwAssembly.cablesGroup;
  const cableSegments = hwAssembly.cableSegments;

  /** Rebuild hardware when selection changes (called from UI dropdown). */
  function rebuildHardware(newSelection) {
    boardRoot.remove(hwAssembly.group);
    hwSelection = { ...newSelection };
    hwAssembly = buildHardwareAssembly(HARDWARE_CATALOG, hwSelection, hwMats, hwGeo);
    boardRoot.add(hwAssembly.group);
  }

  // ── R01.3: Component labels with leader lines and group toggling ──
  // 2D overlay canvas for labels with diagonal-then-horizontal leader lines.
  // Labels are projected from 3D anchor points to 2D screen space.
  // Re-sorted on camera change to prevent line crossings.

  const labelCanvas = document.createElement('canvas');
  labelCanvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:4;';
  container.style.position = 'relative';
  container.appendChild(labelCanvas);
  const labelCtx = labelCanvas.getContext('2d');

  // Label definitions: {text, anchor (3D in model space), group, layerId, visible}
  const leaderLabels = [];
  const labelGroupVisibility = {}; // group → boolean

  function addLeaderLabel(text, x, y, z, group, layerId) {
    if (!labelGroupVisibility.hasOwnProperty(group)) labelGroupVisibility[group] = true;
    leaderLabels.push({
      text, anchor: new THREE.Vector3(x, y, z),
      group, layerId: layerId || null, visible: true
    });
  }

  // Component labels
  addLeaderLabel('Bamboo Bottom Plate', hingeX, center.y, Z_BOTTOM + T_BOTTOM_PLATE / 2, 'layers', 'bottomPlate');
  addLeaderLabel('Cork Gasket (Lower)', hingeX, center.y, Z_CORK_LOWER + T_CORK_LOWER / 2, 'layers', 'corkLower');
  addLeaderLabel('FR-4 PCB', hingeX, center.y, Z_PCB + T_PCB / 2, 'layers', 'pcb');
  addLeaderLabel('Cork Gasket (Upper)', hingeX, center.y, Z_CORK_UPPER + T_CORK_UPPER / 2, 'layers', 'corkUpper');
  addLeaderLabel('Switch Plate', hingeX, center.y, Z_SWITCH_PLATE + T_SWITCH_PLATE / 2, 'layers', 'switchPlate');
  addLeaderLabel('Cherry MX ULP', hingeX, center.y, Z_KEYCAP, 'layers', 'keycaps');
  addLeaderLabel('nice!nano v2', nanoLeftX, center.y, Z_PCB - 4, 'electronics', 'pcb');
  addLeaderLabel('USB-C Port', nanoLeftX, bbox.min.y + 5, Z_PCB - 4, 'electronics', 'pcb');
  addLeaderLabel(HARDWARE_CATALOG.hinges[hwSelection.hinge]?.name || 'Hinge', hingeX, hy, hz, 'hardware');
  addLeaderLabel('LiPo Battery', battX, center.y, Z_CORK_LOWER + 3, 'electronics', 'corkLower');

  // Screw labels (one per screw position, group = 'screws')
  screwPositions.forEach((sp, i) => {
    addLeaderLabel(`Bolt ${i + 1}`, sp.x, sp.y, Z_SWITCH_PLATE_TOP + 1, 'screws');
  });

  // Cable hardware labels
  addLeaderLabel('Turnbuckle (near)', cableSegments[0]?.turnbuckleX || hingeX, nearCableY, cableZ - 1.5, 'cables');
  addLeaderLabel('Turnbuckle (far)', cableSegments[1]?.turnbuckleX || hingeX, farCableY, cableZ - 1.5, 'cables');
  addLeaderLabel('Ring Eye Nut (near)', nearLeftX, nearCableY, cableZ, 'cables');
  addLeaderLabel('Ring Eye Nut (far)', farLeftX, farCableY, cableZ, 'cables');
  addLeaderLabel('Clevis Pin (near)', cableSegments[0]?.clevisLeftX || hingeX - 12, nearCableY, cableZ, 'cables');
  addLeaderLabel('Clevis Pin (far)', cableSegments[1]?.clevisLeftX || hingeX - 12, farCableY, cableZ, 'cables');

  let labelsVisible = false;
  const LABEL_MARGIN_RIGHT = 20; // px from right edge
  const LABEL_LINE_HEIGHT = 16; // px between labels
  const LEADER_ELBOW_OFFSET = 30; // px horizontal from anchor to elbow

  function projectToScreen(point3d) {
    // Point is in model space (boardRoot space). boardRoot is rotated 180° Z.
    // Apply boardRoot transform to get world position.
    const wp = point3d.clone();
    wp.applyMatrix4(boardRoot.matrixWorld);
    const ndc = wp.clone().project(camera);
    const w = labelCanvas.width, h = labelCanvas.height;
    return {
      x: (ndc.x * 0.5 + 0.5) * w,
      y: (-ndc.y * 0.5 + 0.5) * h,
      behind: ndc.z > 1 || ndc.z < -1
    };
  }

  function drawLeaderLabels() {
    const w = container.clientWidth, h = container.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    labelCanvas.width = w * dpr;
    labelCanvas.height = h * dpr;
    labelCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    labelCtx.clearRect(0, 0, w, h);

    if (!labelsVisible) return;

    // Project all visible label anchors to screen space
    const projected = [];
    leaderLabels.forEach((lbl, idx) => {
      if (!lbl.visible) return;
      if (!labelGroupVisibility[lbl.group]) return;
      if (lbl.layerId && layerVisibility[lbl.layerId] === false) return;
      const sp = projectToScreen(lbl.anchor);
      if (sp.behind) return;
      projected.push({ idx, text: lbl.text, ax: sp.x, ay: sp.y, group: lbl.group });
    });

    if (projected.length === 0) return;

    // Sort by screen Y (top to bottom) to assign label slots and prevent crossings
    projected.sort((a, b) => a.ay - b.ay);

    // Assign label Y positions on the right side, evenly spaced, avoiding overlap
    const labelX = w - LABEL_MARGIN_RIGHT;
    const startY = 90; // leave room for nav legend
    projected.forEach((p, i) => {
      p.labelY = startY + i * LABEL_LINE_HEIGHT;
      p.labelX = labelX;
    });

    // Draw leader lines and labels
    labelCtx.font = '600 11px -apple-system, BlinkMacSystemFont, sans-serif';
    labelCtx.textAlign = 'right';
    labelCtx.textBaseline = 'middle';

    const groupColors = {
      layers: '#5a9ae0',
      electronics: '#e0a03a',
      hardware: '#aaaaaa',
      screws: '#d0d0d0',
      cables: '#70c070'
    };

    projected.forEach(p => {
      const color = groupColors[p.group] || '#cccccc';

      // Elbow point: anchor → diagonal up-right to elbow → horizontal to label
      const elbowX = p.labelX - LEADER_ELBOW_OFFSET;
      const elbowY = p.labelY;

      // Draw leader line: anchor → elbow (diagonal)
      labelCtx.beginPath();
      labelCtx.moveTo(p.ax, p.ay);
      labelCtx.lineTo(elbowX, elbowY);
      labelCtx.strokeStyle = color;
      labelCtx.lineWidth = 1;
      labelCtx.globalAlpha = 0.6;
      labelCtx.stroke();

      // Draw horizontal line: elbow → label
      labelCtx.beginPath();
      labelCtx.moveTo(elbowX, elbowY);
      labelCtx.lineTo(p.labelX, elbowY);
      labelCtx.stroke();

      // Small dot at anchor
      labelCtx.beginPath();
      labelCtx.arc(p.ax, p.ay, 2, 0, Math.PI * 2);
      labelCtx.fillStyle = color;
      labelCtx.globalAlpha = 0.8;
      labelCtx.fill();

      // Label text
      labelCtx.globalAlpha = 0.9;
      labelCtx.fillStyle = color;
      labelCtx.fillText(p.text, p.labelX, p.labelY);
      labelCtx.globalAlpha = 1.0;
    });
  }

  // Keep backward compatibility: labelSprites array (empty, but referenced by wizard.html)
  const labelSprites = [];

  // ── XYZ Axis Indicator + Named Anchors (R37/R38, geometry.md) ──
  // Added to scene directly (not boardRoot) to avoid the 180° display rotation.
  // Positions are in WORLD space (i.e., model coords negated for X and Y due to boardRoot flip).
  const axisGroup = new THREE.Group();
  axisGroup.userData.layerId = 'axes';

  // R38: Axis origin at the top key of pinky column (colIdx 0, min Y in model space).
  // This is the top-left switch as seen on screen (after boardRoot 180° Z flip).
  // pinkyKeys already computed above for R31.
  const axisTopPinkyKey = pinkyKeys.length > 0
    ? pinkyKeys.reduce((best, k) => k.y < best.y ? k : best, pinkyKeys[0])
    : { x: bbox.min.x, y: bbox.min.y }; // fallback to bbox corner if no pinky keys found
  const axisModelX = axisTopPinkyKey.x;
  const axisModelY = axisTopPinkyKey.y;
  // Convert to world space (boardRoot 180° Z: world = -model for X,Y)
  const axisWorldX = -axisModelX;
  const axisWorldY = -axisModelY;
  const axisWorldZ = Z_SWITCH_PLATE_TOP;
  const axisOrigin = new THREE.Vector3(axisWorldX, axisWorldY, axisWorldZ);

  const axisLen = 60; // mm — enough to be visible without dominating
  const axisColors = { x: 0xff3333, y: 0x33cc33, z: 0x3366ff };

  // In world space: +X points right (= -model X = toward pinky), +Y points up (= -model Y), +Z points up
  // But we want to show MODEL-space axes, so we label them with model-space directions.
  // Model +X (toward hinge) = World -X. Model +Y = World -Y. Model +Z = World +Z.
  const axesDef = [
    { axis: 'x', dir: new THREE.Vector3(-1, 0, 0), label: 'X+ (toward hinge)' },
    { axis: 'y', dir: new THREE.Vector3(0, -1, 0), label: 'Y+ (along columns)' },
    { axis: 'z', dir: new THREE.Vector3(0, 0, 1),  label: 'Z+ (up from table)' }
  ];
  axesDef.forEach(({ axis, dir, label }) => {
    const end = axisOrigin.clone().addScaledVector(dir, axisLen);
    const geo = new THREE.BufferGeometry().setFromPoints([axisOrigin, end]);
    const mat = new THREE.LineBasicMaterial({ color: axisColors[axis], linewidth: 2, depthTest: false });
    const line = new THREE.Line(geo, mat);
    line.renderOrder = 999;
    axisGroup.add(line);
    // Arrowhead cone at the end
    const coneGeo = new THREE.ConeGeometry(1.5, 5, 8);
    const coneMat = new THREE.MeshBasicMaterial({ color: axisColors[axis], depthTest: false });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.copy(end);
    // Orient cone along axis direction
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    cone.renderOrder = 999;
    axisGroup.add(cone);
  });

  // Tick helpers
  function addTick(pos, color, size) {
    const tickGeo = new THREE.SphereGeometry(size, 8, 8);
    const tickMat = new THREE.MeshBasicMaterial({ color, depthTest: false });
    const tick = new THREE.Mesh(tickGeo, tickMat);
    tick.position.copy(pos); tick.renderOrder = 999;
    axisGroup.add(tick);
  }
  function addAxisLabel(text, pos, color, scale) {
    const lc = document.createElement('canvas'); lc.width = 512; lc.height = 64;
    const lg = lc.getContext('2d');
    lg.clearRect(0, 0, 512, 64);
    lg.font = 'bold 32px monospace'; lg.textAlign = 'center'; lg.textBaseline = 'middle';
    lg.fillStyle = '#' + color.toString(16).padStart(6, '0');
    lg.fillText(text, 256, 32);
    const tex = new THREE.CanvasTexture(lc);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.position.copy(pos); sprite.scale.set(scale || 25, (scale || 25) / 4, 1); sprite.renderOrder = 999;
    axisGroup.add(sprite);
  }

  // Ticks along each axis (in world space, following model-space direction)
  axesDef.forEach(({ axis, dir }) => {
    for (let d = 10; d <= axisLen; d += 10) {
      const size = (d % 100 === 0) ? 1.5 : 0.7;
      const p = axisOrigin.clone().addScaledVector(dir, d);
      addTick(p, axisColors[axis], size);
      if (d === 10 || d % 50 === 0) {
        const labelOff = new THREE.Vector3(2, 2, 2);
        addAxisLabel(d + 'mm', p.clone().add(labelOff), axisColors[axis], 15);
      }
    }
  });

  // Axis endpoint labels
  axesDef.forEach(({ axis, dir, label }) => {
    const pos = axisOrigin.clone().addScaledVector(dir, axisLen + 10);
    addAxisLabel(label, pos, axisColors[axis], 30);
  });

  // Origin marker — show both world and model coords
  addTick(axisOrigin, 0xffffff, 2.5);
  addAxisLabel(
    `Origin: model(${axisModelX.toFixed(0)}, ${axisModelY.toFixed(0)}, ${axisWorldZ.toFixed(0)})`,
    axisOrigin.clone().add(new THREE.Vector3(15, 5, 5)), 0xffffff, 35
  );

  // ── Named Anchor Markers (in world space, on the board surface) ──
  const anchorColor = 0xffaa00;
  function addAnchorMarker(name, modelX, modelY, modelZ) {
    // Convert model coords to world coords (boardRoot 180° Z flip)
    const wx = -modelX, wy = -modelY, wz = modelZ;
    const markerH = 25;
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(wx, wy, wz), new THREE.Vector3(wx, wy, wz + markerH)
    ]);
    const mat = new THREE.LineBasicMaterial({ color: anchorColor, linewidth: 2, depthTest: false });
    const line = new THREE.Line(geo, mat); line.renderOrder = 999;
    axisGroup.add(line);
    // Diamond at base
    const dGeo = new THREE.OctahedronGeometry(2.0, 0);
    const dMat = new THREE.MeshBasicMaterial({ color: anchorColor, depthTest: false });
    const diamond = new THREE.Mesh(dGeo, dMat);
    diamond.position.set(wx, wy, wz); diamond.scale.set(1, 1, 0.5); diamond.renderOrder = 999;
    axisGroup.add(diamond);
    // Label with model-space coordinates
    addAxisLabel(
      `${name} (${modelX.toFixed(0)},${modelY.toFixed(0)})`,
      new THREE.Vector3(wx, wy, wz + markerH + 5), anchorColor, 35
    );
  }
  const anchorZ = Z_SWITCH_PLATE_TOP + 3;
  addAnchorMarker('bbox.min.x', bbox.min.x, center.y, anchorZ);
  addAnchorMarker('hingeX', hingeX, center.y, anchorZ);
  addAnchorMarker('halfCenterX', halfCenterX, center.y, anchorZ);
  addAnchorMarker('bbox.min.y', halfCenterX, bbox.min.y, anchorZ);
  addAnchorMarker('bbox.max.y', halfCenterX, bbox.max.y, anchorZ);
  addAnchorMarker('center', center.x, center.y, anchorZ);

  axisGroup.visible = false; // hidden by default, toggled via UI checkbox
  scene.add(axisGroup); // added to scene, not boardRoot — immune to 180° flip

  // ── Camera position (from HUMAN/typist side — R19) ──
  // boardRoot is rotated 180° around Z, so world coords = (-local_x, -local_y, local_z).
  // Thumbs (high local Y) are now at negative world Y.
  // Camera goes at negative world Y (thumb side, near human), looking toward world center.
  const fullWidth = rightEdgeX - bbox.min.x;
  const fullHeight = bbox.max.y - bbox.min.y;
  const maxDim = Math.max(fullWidth, fullHeight);
  const worldHingeX = -hingeX;
  const worldCenterY = -center.y;
  camera.position.set(worldHingeX, worldCenterY - maxDim * 0.6, maxDim * 0.7);
  controls.target.set(worldHingeX, worldCenterY, Z_SWITCH_PLATE_TOP / 2);
  console.log(`render3d camera: pos=(${camera.position.x.toFixed(0)}, ${camera.position.y.toFixed(0)}, ${camera.position.z.toFixed(0)}) target=(${worldHingeX.toFixed(0)}, ${worldCenterY.toFixed(0)}, ${(Z_SWITCH_PLATE_TOP / 2).toFixed(1)})`);
  controls.update();

  // ── Fold mechanism (R20) ──
  // Slider semantics: 180° = flat/open, 0° = closed, 270° = tented
  // Internal fold angle = 180 - sliderValue
  // Positive internal = closing (keycaps face each other)
  // Negative internal = tenting (keycaps face outward, keyboard tents up)
  function applyFold(sliderDeg) {
    currentFoldSliderDeg = sliderDeg;
    const internalDeg = 180 - sliderDeg;

    // Delegate hinge + cable fold animation to the hardware assembly
    hwAssembly.applyFold(internalDeg);

    // Apply combined fold + butterfly to halves
    applyButterfly(currentButterflyDeg);
  }

  // ── R21: Butterfly tilt mechanism (Hirth joint) ──
  // Each half rotates independently around the Z axis (vertical, sticking out of table).
  // Left half rotates clockwise (viewed from top), right half counter-clockwise.
  // Pivot point for each half is the hinge line (at hingeX).
  // This is NOT a whole-keyboard tilt — each half tilts individually via Hirth discs.
  const boardHalfWidth = hingeX - bbox.min.x;
  const boardHeight = Z_SWITCH_PLATE_TOP;

  // Max butterfly angle: when folded, the inner edges of the halves are closer
  // together. Butterfly rotation swings the outer edges forward. The constraint
  // is that the two halves must not collide. At fold slider foldDeg (internal =
  // 180 - foldDeg), each half is rotated inward by halfFold = internal/2.
  // The butterfly adds rotation around Z, swinging the front edge of each half
  // toward the other. The gap between halves at the front is:
  //   gap = 2 * boardHalfWidth * sin(halfFold) * cos(butterfly)
  // Collision when the front corners overlap. For simplicity, compute max butterfly
  // where the front outer corner of each half stays clear:
  //   At front (Y = bbox.min.y in local), each half has width boardHalfWidth.
  //   After fold by halfFold, the half's front edge is at X offset from hinge:
  //     dx = boardHalfWidth * cos(halfFold)
  //   After butterfly rotation by β around Z at hinge, the front corner sweeps.
  //   The X position of the front-outer corner becomes:
  //     dx * cos(β) - dy * sin(β) where dy is the Y distance from hinge center.
  //   Collision: left front corner X < right front corner X (they cross the center).
  //   Since the halves are mirrored, collision when: dx * cos(β) < 0 can't happen for β<90°.
  //   The actual constraint is the depth overlap: the front edges of the two halves
  //   at different Y positions overlap in Y.
  //   For a closed fold (internal=180, halfFold=90°), halves are stacked vertically.
  //   Any butterfly > 0 swings them and they can't collide in Y (they're thin vertically).
  //   For flat fold (internal=0), halves are side by side. Butterfly swings front edges
  //   together. The front edge at Y=bbox.min.y swings by boardDepth * sin(β) in the
  //   Y direction toward the other half... but each half only extends from hinge outward.
  //   Max β before front corners of left and right meet at Y center:
  //   boardHalfWidth * sin(β) = boardDepth/2 → β = asin(boardDepth / (2*boardHalfWidth))
  //   For typical keyboards, boardDepth < boardHalfWidth so this is well above 45°.
  // Conservative: always allow 45°.
  function getMaxButterflyDeg(foldSliderDeg) {
    return 45;
  }

  // Pre-compute butterfly limits for each integer fold angle
  const butterflyLimits = {};
  for (let fold = 0; fold <= 270; fold++) {
    butterflyLimits[fold] = getMaxButterflyDeg(fold);
  }

  let currentButterflyDeg = 0;
  let currentFoldSliderDeg = 180;

  function applyButterfly(butterflyDeg) {
    currentButterflyDeg = butterflyDeg;
    const betaRad = butterflyDeg * Math.PI / 180;

    // Always start from identity and recompute fold + butterfly combined.
    // The butterfly is a Z rotation at the hinge pivot, applied BEFORE the fold Y rotation.
    // Combined transform for each half:
    //   1. Translate so pivot is at origin
    //   2. Apply butterfly Z rotation
    //   3. Apply fold Y rotation
    //   4. Translate back
    const pivot = new THREE.Vector3(hingeX, hingeCenterY, hingeZ);
    const offset = new THREE.Vector3(-hingeX, -hingeCenterY, -hingeZ);
    const yAxis = new THREE.Vector3(0, 1, 0);
    const zAxis = new THREE.Vector3(0, 0, 1);

    const internalDeg = 180 - currentFoldSliderDeg;
    const foldHalfRad = (internalDeg * Math.PI / 180) / 2;

    // Left half: butterfly +beta around Z, then fold +halfFold around Y
    const leftButterflyQ = new THREE.Quaternion().setFromAxisAngle(zAxis, betaRad);
    const leftFoldQ = new THREE.Quaternion().setFromAxisAngle(yAxis, foldHalfRad);
    const leftCombinedQ = leftFoldQ.clone().multiply(leftButterflyQ);
    const leftPos = offset.clone().applyQuaternion(leftCombinedQ).sub(offset);
    leftHalf.position.copy(leftPos);
    leftHalf.quaternion.copy(leftCombinedQ);

    // Right half: butterfly -beta around Z, then fold -halfFold around Y
    const rightButterflyQ = new THREE.Quaternion().setFromAxisAngle(zAxis, -betaRad);
    const rightFoldQ = new THREE.Quaternion().setFromAxisAngle(yAxis, -foldHalfRad);
    const rightCombinedQ = rightFoldQ.clone().multiply(rightButterflyQ);
    const rightPos = offset.clone().applyQuaternion(rightCombinedQ).sub(offset);
    rightHalf.position.copy(rightPos);
    rightHalf.quaternion.copy(rightCombinedQ);
  }

  // ── Exploded view ──
  // Helper: determine layer index from Z position
  function zToLayerIdx(z) {
    if (z >= Z_SWITCH_PLATE) return 4;
    if (z >= Z_CORK_UPPER) return 3;
    if (z >= Z_PCB) return 2;
    if (z >= Z_CORK_LOWER) return 1;
    return 0;
  }

  function applyExplodedView(on) {
    const gap = on ? 12 : 0;
    const tmpMat = new THREE.Matrix4();
    const tmpPos = new THREE.Vector3();
    const tmpQuat = new THREE.Quaternion();
    const tmpScale = new THREE.Vector3();

    [leftHalf, rightHalf].forEach(half => {
      half.traverse(obj => {
        // Handle InstancedMesh: adjust each instance's Z based on its position
        if (obj.isInstancedMesh) {
          if (!obj.userData._origMatrices) {
            obj.userData._origMatrices = obj.instanceMatrix.array.slice();
          }
          const origArr = obj.userData._origMatrices;
          const count = obj.count;
          for (let i = 0; i < count; i++) {
            tmpMat.fromArray(origArr, i * 16);
            tmpMat.decompose(tmpPos, tmpQuat, tmpScale);
            const origZ = tmpPos.z;
            const layerIdx = zToLayerIdx(origZ);

            // For screw shafts that span the full stack, stretch to fill the exploded gap
            if (obj.userData._screwShaft && on) {
              // Shaft center should be at the midpoint of the exploded stack
              const bottomZ = Z_BOTTOM;
              const topZ = Z_SWITCH_PLATE_TOP;
              const bottomExploded = bottomZ; // layer 0 offset = 0
              const topExploded = topZ + 4 * gap; // layer 4 offset
              const newCenter = (bottomExploded + topExploded) / 2;
              const newHeight = topExploded - bottomExploded;
              tmpPos.z = newCenter;
              // Scale Z to stretch (original height is T_FRAME, need newHeight)
              tmpScale.z = newHeight / T_FRAME;
            } else {
              tmpPos.z = origZ + layerIdx * gap;
            }

            tmpMat.compose(tmpPos, tmpQuat, tmpScale);
            obj.instanceMatrix.setMatrixAt ? tmpMat.toArray(obj.instanceMatrix.array, i * 16) : obj.setMatrixAt(i, tmpMat);
          }
          obj.instanceMatrix.needsUpdate = true;
          return;
        }

        if (!obj.isMesh) return;
        if (obj.userData._origZ === undefined) obj.userData._origZ = obj.position.z;
        const origZ = obj.userData._origZ;
        const layerIdx = zToLayerIdx(origZ);
        obj.position.z = origZ + layerIdx * gap;
      });
    });
  }

  // ── R26: Per-layer visibility toggling ──
  const layerVisibility = {
    bottomPlate: true, corkLower: true, pcb: true,
    corkUpper: true, switchPlate: true, keycaps: true
  };

  function setLayerVisible(layerId, visible) {
    layerVisibility[layerId] = visible;
    // Toggle groups in both halves that match this layerId
    [leftHalf, rightHalf].forEach(half => {
      half.traverse(obj => {
        if (obj.userData.layerId === layerId) {
          obj.visible = visible;
        }
      });
    });
    // Toggle associated label sprites (R28)
    labelSprites.forEach(sprite => {
      if (sprite.userData.layerId === layerId) {
        // Only hide the label; don't force-show it (labels are controlled by setLabelsVisible too)
        if (!visible) sprite.visible = false;
      }
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

  // ── Cable drag interaction ──
  let dragCableIdx = -1;
  const dragPlane = new THREE.Plane();
  const dragIntersect = new THREE.Vector3();
  const SNAP_DIST = 15; // mm distance to snap-connect cable to bracket

  function getCableTargets() {
    const targets = [];
    hwAssembly.cableSegments.forEach((seg, i) => {
      // Pin end
      seg.pinGroup.traverse(obj => { if (obj.isMesh) { obj.userData._cableIdx = i; obj.userData._pinEnd = true; targets.push(obj); } });
      // Bracket
      if (seg.bracketMesh) { seg.bracketMesh.userData._cableIdx = i; targets.push(seg.bracketMesh); }
    });
    return targets;
  }

  function onCablePointerDown(event) {
    if (event.button !== 0) return; // left click only
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const targets = getCableTargets();
    const hits = raycaster.intersectObjects(targets);
    if (!hits.length) return;

    const hit = hits[0];
    const idx = hit.object.userData._cableIdx;
    if (idx === undefined) return;

    const seg = hwAssembly.cableSegments[idx];
    if (!seg) return;

    if (hit.object.userData._pinEnd) {
      // Grab the cable end — start dragging
      event.stopPropagation();
      dragCableIdx = idx;
      hwAssembly.disconnectCable(idx);
      controls.enabled = false;

      // Set up drag plane perpendicular to camera at the pin position
      const camDir = camera.getWorldDirection(new THREE.Vector3());
      dragPlane.setFromNormalAndCoplanarPoint(camDir, seg.pinGroup.position);

      renderer.domElement.style.cursor = 'grabbing';
    } else if (hit.object.userData._isBracket && !seg.connected) {
      // Click on bracket while cable is dangling nearby — connect
      const pinPos = seg.pinGroup.position;
      const bracketPos = hit.object.position.clone();
      if (pinPos.distanceTo(bracketPos) < SNAP_DIST * 2) {
        hwAssembly.connectCable(idx);
        // Reapply fold to update cable geometry
        hwAssembly.applyFold(180 - currentFoldSliderDeg);
      }
    }
  }

  function onCablePointerMove(event) {
    if (dragCableIdx < 0) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    if (raycaster.ray.intersectPlane(dragPlane, dragIntersect)) {
      // Transform from world space to boardRoot local space
      const localPos = boardRoot.worldToLocal(dragIntersect.clone());
      hwAssembly.setCableFreeEnd(dragCableIdx, localPos);
      // Update cable geometry
      hwAssembly.applyFold(180 - currentFoldSliderDeg);
    }
  }

  function onCablePointerUp(event) {
    if (dragCableIdx < 0) return;
    const seg = hwAssembly.cableSegments[dragCableIdx];

    // Check if pin is near the bracket — snap connect
    if (seg && !seg.connected) {
      // Get bracket world position
      const bracketMesh = seg.bracketMesh;
      const bracketWorldPos = new THREE.Vector3();
      bracketMesh.getWorldPosition(bracketWorldPos);
      const bracketLocal = boardRoot.worldToLocal(bracketWorldPos.clone());

      const pinPos = seg.pinGroup.position;
      if (pinPos.distanceTo(bracketLocal) < SNAP_DIST) {
        hwAssembly.connectCable(dragCableIdx);
      }
      hwAssembly.applyFold(180 - currentFoldSliderDeg);
    }

    dragCableIdx = -1;
    controls.enabled = true;
    renderer.domElement.style.cursor = '';
  }

  renderer.domElement.addEventListener('pointerdown', onCablePointerDown);
  renderer.domElement.addEventListener('pointermove', onCablePointerMove);
  renderer.domElement.addEventListener('pointerup', onCablePointerUp);

  // ── Animation loop ──
  function animate() {
    requestAnimationFrame(animate);
    updateKeyPresses();
    controls.update();
    renderer.render(scene, camera);
    drawLeaderLabels(); // R01.3: update leader line labels each frame
  }
  animate();

  // ── Resize handler ──
  window.addEventListener('resize', () => {
    const ww = container.clientWidth, hh = container.clientHeight;
    camera.aspect = ww / hh; camera.updateProjectionMatrix();
    renderer.setSize(ww, hh);
    drawLeaderLabels(); // R01.3: redraw labels on resize
  });

  // ── Return control interface for wizard.html to wire up UI ──
  return {
    applyFold,
    applyButterfly,
    getMaxButterflyDeg,
    butterflyLimits,
    applyExplodedView,
    setLayerVisible,
    setLabelsVisible: (v) => {
      labelsVisible = v;
      drawLeaderLabels();
    },
    setLabelGroupVisible: (group, v) => {
      labelGroupVisibility[group] = v;
      drawLeaderLabels();
    },
    getLabelGroups: () => Object.keys(labelGroupVisibility),
    labelGroupVisibility,
    setAxesVisible: (v) => { axisGroup.visible = v; },
    setOutlinesVisible: (v) => { outlineGroup.visible = v; },
    setCablesVisible: (v) => { hwAssembly.cablesGroup.visible = v; },
    setHingeVisible: (v) => { hwAssembly.hingeResult.group.visible = v; },
    rebuildHardware,
    getHardwareSelection: () => ({ ...hwSelection }),
    HARDWARE_CATALOG,
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
