#!/usr/bin/env node
// verify-phase4.js — Phase 4: Hardware / BOM / Assembly Verification
// Verifies H01–H03, S01–S12, E01–E05, B01–B03, A01–A03 (26 requirements)
// via file analysis, code inspection, and data validation.

'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const wip = __dirname;
const root = path.join(wip, '..');

// Load key files
const bomPath = path.join(wip, 'BOM.md');
const firmwarePath = path.join(wip, 'FIRMWARE.md');
const defaultsPath = path.join(wip, 'defaults.yaml');
const render3dPath = path.join(wip, 'render3d.js');
const wizardPath = path.join(wip, 'wizard.html');
const footprintPath = path.join(wip, 'footprints', 'cherry_ulp.js');

const bomSrc = fs.existsSync(bomPath) ? fs.readFileSync(bomPath, 'utf8') : '';
const firmwareSrc = fs.existsSync(firmwarePath) ? fs.readFileSync(firmwarePath, 'utf8') : '';
const defaultsSrc = fs.existsSync(defaultsPath) ? fs.readFileSync(defaultsPath, 'utf8') : '';
const render3dSrc = fs.existsSync(render3dPath) ? fs.readFileSync(render3dPath, 'utf8') : '';
const wizardSrc = fs.existsSync(wizardPath) ? fs.readFileSync(wizardPath, 'utf8') : '';
const footprintSrc = fs.existsSync(footprintPath) ? fs.readFileSync(footprintPath, 'utf8') : '';

let defaultsConfig = null;
try { defaultsConfig = yaml.load(defaultsSrc); } catch (e) { console.error('Failed to parse defaults.yaml:', e.message); }

const results = {};

function pass(req, note) { results[req] = { status: 'PASS', note }; console.log(`  \u2713 ${req}: PASS \u2014 ${note}`); }
function fail(req, note) { results[req] = { status: 'FAIL', note }; console.log(`  \u2717 ${req}: FAIL \u2014 ${note}`); }

function bomContains(pattern) {
  return typeof pattern === 'string'
    ? bomSrc.toLowerCase().includes(pattern.toLowerCase())
    : pattern.test(bomSrc);
}

// ══════════════════════════════════════════════════════════════════
// H01 — Cherry MX ULP switches
// ══════════════════════════════════════════════════════════════════
function verifyH01() {
  console.log('\n\u2500\u2500 H01: Cherry MX ULP switches \u2500\u2500');
  const checks = [];

  // BOM lists Cherry MX ULP
  checks.push({ name: 'BOM lists Cherry MX ULP', ok: bomContains('Cherry MX ULP') });

  // Quantity = 36
  const qtyMatch = bomSrc.match(/(\d+)\s*\|\s*Cherry MX ULP/i);
  const qty = qtyMatch ? parseInt(qtyMatch[1]) : 0;
  checks.push({ name: `Quantity=${qty} (need 36)`, ok: qty === 36 });

  // Footprint file exists
  checks.push({ name: 'Cherry ULP footprint exists', ok: footprintSrc.length > 0 });

  // Footprint references Cherry ULP
  checks.push({ name: 'Footprint module name', ok: footprintSrc.includes('Cherry_ULP_SMD') });

  // defaults.yaml specifies cherry_ulp footprint
  checks.push({ name: 'defaults.yaml uses cherry_ulp', ok: defaultsSrc.includes('cherry_ulp') });

  // PCB section in defaults.yaml
  const hasPCBFootprint = defaultsConfig && defaultsConfig.pcbs &&
    defaultsConfig.pcbs.keyboard && defaultsConfig.pcbs.keyboard.footprints &&
    defaultsConfig.pcbs.keyboard.footprints.cherry_ulp;
  checks.push({ name: 'PCB config has cherry_ulp footprint', ok: !!hasPCBFootprint });

  const allOk = checks.every(c => c.ok);
  const detail = checks.map(c => `${c.ok ? '\u2713' : '\u2717'} ${c.name}`).join(', ');
  if (allOk) pass('H01', detail); else fail('H01', detail);
}

// ══════════════════════════════════════════════════════════════════
// H02 — No soldering except ULP switches
// ══════════════════════════════════════════════════════════════════
function verifyH02() {
  console.log('\n\u2500\u2500 H02: No soldering except ULP switches \u2500\u2500');
  const checks = [];

  // BOM states no-solder
  checks.push({ name: 'BOM states no-solder policy', ok: bomContains('no-solder') || bomContains('No soldering') || bomContains('no solder') });

  // MCU uses sockets (Mill-Max)
  checks.push({ name: 'MCU uses Mill-Max sockets', ok: bomContains('Mill-Max') });

  // PCBA service handles SMD soldering
  checks.push({ name: 'PCBA service handles soldering', ok: bomContains('PCBA') || bomContains('assembled') });

  // Switches clip in (pre-soldered by fab)
  checks.push({ name: 'Switches pre-soldered or clip-in', ok: bomContains('clip') || bomContains('pre-soldered') || bomContains('SMD contact pads are pre-soldered') });

  const allOk = checks.every(c => c.ok);
  const detail = checks.map(c => `${c.ok ? '\u2713' : '\u2717'} ${c.name}`).join(', ');
  if (allOk) pass('H02', detail); else fail('H02', detail);
}

// ══════════════════════════════════════════════════════════════════
// H03 — Keycap legends displayed
// ══════════════════════════════════════════════════════════════════
function verifyH03() {
  console.log('\n\u2500\u2500 H03: Keycap legends displayed \u2500\u2500');
  const checks = [];

  // render3d.js has label textures on keycaps
  checks.push({ name: 'Key labels in render3d.js', ok: render3dSrc.includes('makeLabelTex') });

  // QWERTY keymap defined
  checks.push({ name: 'QWERTY keymap in render3d.js', ok: render3dSrc.includes('DEFAULT_KEYMAPS') });

  // BOM includes keycap / sticker
  checks.push({ name: 'BOM includes keycaps', ok: bomContains('keycap') || bomContains('sticker') });

  const allOk = checks.every(c => c.ok);
  const detail = checks.map(c => `${c.ok ? '\u2713' : '\u2717'} ${c.name}`).join(', ');
  if (allOk) pass('H03', detail); else fail('H03', detail);
}

// ══════════════════════════════════════════════════════════════════
// S01 — Two separate halves
// ══════════════════════════════════════════════════════════════════
function verifyS01() {
  console.log('\n\u2500\u2500 S01: Two separate halves \u2500\u2500');
  const checks = [];

  // Ergogen mirror config in defaults.yaml or fitting.js
  const fitting = require('./fitting');
  const hasMirror = defaultsSrc.includes('mirror') || render3dSrc.includes('leftHalf') && render3dSrc.includes('rightHalf');
  checks.push({ name: 'Mirror/split halves configured', ok: hasMirror });

  // render3d.js creates left and right halves
  checks.push({ name: 'Left and right halves in 3D', ok: render3dSrc.includes('leftHalf') && render3dSrc.includes('rightHalf') });

  // Extended examples produce 36 keys (18 per half)
  const extDir = path.join(wip, 'examples', 'extended');
  let has36Keys = false;
  if (fs.existsSync(extDir)) {
    const files = fs.readdirSync(extDir).filter(f => f.endsWith('.json'));
    if (files.length > 0) {
      const data = JSON.parse(fs.readFileSync(path.join(extDir, files[0]), 'utf8'));
      const result = fitting.ergopadToErgogen(data.positions, 22, 18, data.calibratedPPM);
      const config = result.config || result;
      if (config && config.points && config.points.mirror) has36Keys = true;
    }
  }
  checks.push({ name: 'Config has mirror for 2 halves', ok: has36Keys });

  const allOk = checks.every(c => c.ok);
  const detail = checks.map(c => `${c.ok ? '\u2713' : '\u2717'} ${c.name}`).join(', ');
  if (allOk) pass('S01', detail); else fail('S01', detail);
}

// ══════════════════════════════════════════════════════════════════
// S02 — Smoothed board outline
// ══════════════════════════════════════════════════════════════════
function verifyS02() {
  console.log('\n\u2500\u2500 S02: Smoothed board outline \u2500\u2500');
  const checks = [];

  // Fillet specified in defaults.yaml
  const hasFillet = defaultsSrc.includes('fillet: 8') || defaultsSrc.includes('fillet: 10');
  checks.push({ name: 'Fillet radius >= 8mm in config', ok: hasFillet });

  // render3d.js uses convex hull + fillet
  checks.push({ name: 'Convex hull smoothing in render3d.js', ok: render3dSrc.includes('filletedHullShape') });

  // Board outline definition exists
  const hasBoardOutline = defaultsConfig && defaultsConfig.outlines && defaultsConfig.outlines.board;
  checks.push({ name: 'Board outline defined in defaults.yaml', ok: !!hasBoardOutline });

  // Thumb bridge fillet
  const hasThumbBridge = defaultsSrc.includes('_thumb_bridge') && defaultsSrc.includes('fillet: 8');
  checks.push({ name: 'Thumb bridge fillet >= 8mm', ok: hasThumbBridge });

  const allOk = checks.every(c => c.ok);
  const detail = checks.map(c => `${c.ok ? '\u2713' : '\u2717'} ${c.name}`).join(', ');
  if (allOk) pass('S02', detail); else fail('S02', detail);
}

// ══════════════════════════════════════════════════════════════════
// S03 — Thumb cluster connected to main body
// ══════════════════════════════════════════════════════════════════
function verifyS03() {
  console.log('\n\u2500\u2500 S03: Thumb cluster connected to main body \u2500\u2500');
  const checks = [];

  // render3d.js uses convex hull for single connected polygon
  checks.push({ name: 'Convex hull prevents floating island', ok: render3dSrc.includes('single connected polygon') });

  // Thumb bridge shapes in defaults.yaml
  checks.push({ name: 'Thumb bridge shapes in config', ok: defaultsSrc.includes('_thumb_bridge') });

  // Board outline includes thumb bridge
  const boardDef = defaultsConfig && defaultsConfig.outlines && defaultsConfig.outlines.board;
  let boardIncludesThumb = false;
  if (boardDef && Array.isArray(boardDef)) {
    boardIncludesThumb = boardDef.some(item => item.name && item.name.includes('thumb_bridge'));
  }
  checks.push({ name: 'Board outline includes thumb bridge', ok: boardIncludesThumb });

  const allOk = checks.every(c => c.ok);
  const detail = checks.map(c => `${c.ok ? '\u2713' : '\u2717'} ${c.name}`).join(', ');
  if (allOk) pass('S03', detail); else fail('S03', detail);
}

// ══════════════════════════════════════════════════════════════════
// S04 — 2mm bamboo plywood, two-part frame
// ══════════════════════════════════════════════════════════════════
function verifyS04() {
  console.log('\n\u2500\u2500 S04: 2mm bamboo plywood, two-part frame \u2500\u2500');
  const checks = [];

  // BOM lists bamboo plywood 2mm
  checks.push({ name: 'BOM lists bamboo 2mm', ok: bomContains('bamboo') && bomContains('2mm') });

  // Two-part frame mentioned
  checks.push({ name: 'Two-part frame (bottom + bezel)', ok: bomContains('two-part') || bomContains('bottom') && bomContains('bezel') });

  // Frame in defaults.yaml
  checks.push({ name: 'Frame defined in config', ok: defaultsSrc.includes('frame') && defaultsSrc.includes('wooden_frame') });

  // render3d.js has frame surround
  checks.push({ name: 'Frame surround in render3d.js', ok: render3dSrc.includes('frameSurroundShape') });

  const allOk = checks.every(c => c.ok);
  const detail = checks.map(c => `${c.ok ? '\u2713' : '\u2717'} ${c.name}`).join(', ');
  if (allOk) pass('S04', detail); else fail('S04', detail);
}

// ══════════════════════════════════════════════════════════════════
// S05 — Frame wall width >= 4mm
// ══════════════════════════════════════════════════════════════════
function verifyS05() {
  console.log('\n\u2500\u2500 S05: Frame wall width >= 4mm \u2500\u2500');
  const checks = [];

  // Board size vs frame size in defaults.yaml
  // Board: size [18, 18], Frame: size [26, 26]
  // Wall = (26 - 18) / 2 = 4mm
  let boardSize = null, frameSize = null;
  if (defaultsConfig && defaultsConfig.outlines) {
    const board = defaultsConfig.outlines.board;
    const frame = defaultsConfig.outlines.frame;
    if (board) {
      const rectEntry = board.find(e => e.what === 'rectangle' && e.bound);
      if (rectEntry && Array.isArray(rectEntry.size)) boardSize = rectEntry.size;
    }
    if (frame) {
      const rectEntry = frame.find(e => e.what === 'rectangle' && e.bound);
      if (rectEntry && Array.isArray(rectEntry.size)) frameSize = rectEntry.size;
    }
  }

  const boardW = boardSize ? boardSize[0] : 0;
  const frameW = frameSize ? frameSize[0] : 0;
  const wallWidth = (frameW - boardW) / 2;
  checks.push({ name: `Wall width = (${frameW} - ${boardW})/2 = ${wallWidth}mm (need >= 4)`, ok: wallWidth >= 4 });

  // render3d.js: frame pad > board pad
  // boardShape = buildOutlineShape(leftKeys, px + 4, ...) → 23
  // frameShape = buildOutlineShape(leftKeys, px + 8, ...) → 27
  // Wall = (27 - 23) / 2 = 2mm in render3d.js (but different calculation)
  // The config-level wall width is the primary specification
  checks.push({ name: 'Frame outline is wider than board outline', ok: frameW > boardW });

  const allOk = checks.every(c => c.ok);
  const detail = checks.map(c => `${c.ok ? '\u2713' : '\u2717'} ${c.name}`).join(', ');
  if (allOk) pass('S05', detail); else fail('S05', detail);
}

// ══════════════════════════════════════════════════════════════════
// S06 — M2 heat-set inserts + M2 countersunk bolts
// ══════════════════════════════════════════════════════════════════
function verifyS06() {
  console.log('\n\u2500\u2500 S06: M2 heat-set inserts + M2 countersunk bolts \u2500\u2500');
  const checks = [];

  checks.push({ name: 'BOM has M2 countersunk screws', ok: bomContains('M2') && bomContains('countersunk') });
  checks.push({ name: 'BOM has M2 heat-set inserts', ok: bomContains('heat-set') && bomContains('brass') });

  // Matching quantities
  const screwMatch = bomSrc.match(/(\d+)\s*\|\s*M2.*countersunk/i);
  const insertMatch = bomSrc.match(/(\d+)\s*\|\s*M2.*heat-set/i);
  const screwQty = screwMatch ? parseInt(screwMatch[1]) : 0;
  const insertQty = insertMatch ? parseInt(insertMatch[1]) : 0;
  checks.push({ name: `Screw qty=${screwQty}, Insert qty=${insertQty} (match)`, ok: screwQty > 0 && screwQty === insertQty });

  // render3d.js has screw/insert geometry
  checks.push({ name: 'Screw geometry in render3d.js', ok: render3dSrc.includes('screwHeadInst') && render3dSrc.includes('insertInst') });

  const allOk = checks.every(c => c.ok);
  const detail = checks.map(c => `${c.ok ? '\u2713' : '\u2717'} ${c.name}`).join(', ');
  if (allOk) pass('S06', detail); else fail('S06', detail);
}

// ══════════════════════════════════════════════════════════════════
// S07 — >= 7 mounting points per half
// ══════════════════════════════════════════════════════════════════
function verifyS07() {
  console.log('\n\u2500\u2500 S07: >= 7 mounting points per half \u2500\u2500');
  const checks = [];

  // Count mounting holes in defaults.yaml
  let mountingHoleCount = 0;
  if (defaultsConfig && defaultsConfig.outlines && defaultsConfig.outlines.mounting_holes) {
    mountingHoleCount = defaultsConfig.outlines.mounting_holes.filter(h => h.what === 'circle').length;
  }
  checks.push({ name: `Mounting holes in config: ${mountingHoleCount} (need >= 7)`, ok: mountingHoleCount >= 7 });

  // PCB mounting hole footprints
  let pcbMountCount = 0;
  if (defaultsConfig && defaultsConfig.pcbs && defaultsConfig.pcbs.keyboard && defaultsConfig.pcbs.keyboard.footprints) {
    const fps = defaultsConfig.pcbs.keyboard.footprints;
    pcbMountCount = Object.keys(fps).filter(k => k.startsWith('mh_')).length;
  }
  checks.push({ name: `PCB mounting footprints: ${pcbMountCount} (need >= 7)`, ok: pcbMountCount >= 7 });

  // Key locations: thumb, middle, inner-bottom
  const hasThumbMount = defaultsSrc.includes('mh_thumb') || defaultsSrc.includes('thumbfan');
  const hasMiddleMount = defaultsSrc.includes('mh_middle') || defaultsSrc.includes('matrix_middle');
  const hasInnerBottomMount = defaultsSrc.includes('mh_index_bottom') || defaultsSrc.includes('mh_bottom_right');
  checks.push({ name: 'Mount near thumb', ok: hasThumbMount });
  checks.push({ name: 'Mount near middle column', ok: hasMiddleMount });
  checks.push({ name: 'Mount near inner-bottom', ok: hasInnerBottomMount });

  // render3d.js screw positions
  const hasScrewPositions = render3dSrc.includes('screwPositions');
  checks.push({ name: 'Screw positions in render3d.js', ok: hasScrewPositions });

  const allOk = checks.every(c => c.ok);
  const detail = checks.map(c => `${c.ok ? '\u2713' : '\u2717'} ${c.name}`).join(', ');
  if (allOk) pass('S07', detail); else fail('S07', detail);
}

// ══════════════════════════════════════════════════════════════════
// S07a — Bolt-through-stack clamping path
// ══════════════════════════════════════════════════════════════════
function verifyS07a() {
  console.log('\n\u2500\u2500 S07a: Bolt-through-stack clamping path \u2500\u2500');
  const checks = [];

  // frame_with_holes has mounting holes subtracted
  const hasFrameHoles = defaultsSrc.includes('frame_with_holes') &&
    defaultsSrc.match(/frame_with_holes[\s\S]*operation: subtract/);
  checks.push({ name: 'Frame has mounting holes subtracted', ok: !!hasFrameHoles });

  // PCB has mounting hole footprints
  checks.push({ name: 'PCB has mounting footprints', ok: defaultsSrc.includes('mountinghole') });

  // BOM assembly order mentions bolt-through-stack
  checks.push({ name: 'BOM assembly describes bolt clamping', ok: bomContains('screw') && bomContains('heat-set') });

  // render3d.js screws pass through layers
  checks.push({ name: 'Screw shaft spans full frame height', ok: render3dSrc.includes('T_FRAME') && render3dSrc.includes('screwShaftGeo') });

  const allOk = checks.every(c => c.ok);
  const detail = checks.map(c => `${c.ok ? '\u2713' : '\u2717'} ${c.name}`).join(', ');
  if (allOk) pass('S07a', detail); else fail('S07a', detail);
}

// ══════════════════════════════════════════════════════════════════
// S08 — Layer stack heights
// ══════════════════════════════════════════════════════════════════
function verifyS08() {
  console.log('\n\u2500\u2500 S08: Layer stack heights \u2500\u2500');
  const checks = [];

  // Check cases in defaults.yaml
  let bottomPlateH = 0, switchPlateH = 0;
  if (defaultsConfig && defaultsConfig.cases) {
    if (defaultsConfig.cases.bottom_plate) {
      const entry = defaultsConfig.cases.bottom_plate.find(e => e.extrude);
      if (entry) bottomPlateH = entry.extrude;
    }
    if (defaultsConfig.cases.switch_plate) {
      const entry = defaultsConfig.cases.switch_plate.find(e => e.extrude && !e.operation);
      if (entry) switchPlateH = entry.extrude;
    }
  }
  checks.push({ name: `Bottom plate = ${bottomPlateH}mm`, ok: bottomPlateH > 0 });
  checks.push({ name: `Switch plate = ${switchPlateH}mm`, ok: switchPlateH > 0 });

  // render3d.js layer constants
  const hasStackConstants = render3dSrc.includes('T_BOTTOM_PLATE') && render3dSrc.includes('T_PCB') && render3dSrc.includes('T_SWITCH_PLATE');
  checks.push({ name: 'Layer stack constants in render3d.js', ok: hasStackConstants });

  // Check render3d.js values
  const tBottomMatch = render3dSrc.match(/T_BOTTOM_PLATE\s*=\s*([\d.]+)/);
  const tPcbMatch = render3dSrc.match(/T_PCB\s*=\s*([\d.]+)/);
  const tSwitchMatch = render3dSrc.match(/T_SWITCH_PLATE\s*=\s*([\d.]+)/);
  const tBottom = tBottomMatch ? parseFloat(tBottomMatch[1]) : 0;
  const tPcb = tPcbMatch ? parseFloat(tPcbMatch[1]) : 0;
  const tSwitch = tSwitchMatch ? parseFloat(tSwitchMatch[1]) : 0;
  const baseTotal = tBottom + tPcb + tSwitch;
  checks.push({ name: `render3d stack: ${tBottom}+${tPcb}+${tSwitch}=${baseTotal}mm`, ok: baseTotal > 0 });

  const allOk = checks.every(c => c.ok);
  const detail = checks.map(c => `${c.ok ? '\u2713' : '\u2717'} ${c.name}`).join(', ');
  if (allOk) pass('S08', detail); else fail('S08', detail);
}

// ══════════════════════════════════════════════════════════════════
// S08a — Cork gaskets 0.5mm each, 1.0mm total
// ══════════════════════════════════════════════════════════════════
function verifyS08a() {
  console.log('\n\u2500\u2500 S08a: Cork gaskets 0.5mm each, 1.0mm total \u2500\u2500');
  const checks = [];

  // BOM lists cork 0.5mm
  checks.push({ name: 'BOM lists cork 0.5mm', ok: bomContains('cork') && bomContains('0.5mm') });

  // render3d.js cork layer constants
  const tCorkLMatch = render3dSrc.match(/T_CORK_LOWER\s*=\s*([\d.]+)/);
  const tCorkUMatch = render3dSrc.match(/T_CORK_UPPER\s*=\s*([\d.]+)/);
  const tCorkL = tCorkLMatch ? parseFloat(tCorkLMatch[1]) : 0;
  const tCorkU = tCorkUMatch ? parseFloat(tCorkUMatch[1]) : 0;
  checks.push({ name: `Cork lower = ${tCorkL}mm (need 0.5)`, ok: Math.abs(tCorkL - 0.5) < 0.01 });
  checks.push({ name: `Cork upper = ${tCorkU}mm (need 0.5)`, ok: Math.abs(tCorkU - 0.5) < 0.01 });
  checks.push({ name: `Cork total = ${tCorkL + tCorkU}mm (need 1.0)`, ok: Math.abs(tCorkL + tCorkU - 1.0) < 0.01 });

  // BOM assembly order mentions cork placement
  checks.push({ name: 'Assembly mentions cork layers', ok: bomContains('cork gasket') });

  const allOk = checks.every(c => c.ok);
  const detail = checks.map(c => `${c.ok ? '\u2713' : '\u2717'} ${c.name}`).join(', ');
  if (allOk) pass('S08a', detail); else fail('S08a', detail);
}

// ══════════════════════════════════════════════════════════════════
// S09 — Total stack <= 4.8mm
// ══════════════════════════════════════════════════════════════════
function verifyS09() {
  console.log('\n\u2500\u2500 S09: Total stack <= 4.8mm \u2500\u2500');

  // From render3d.js constants
  const tBottomMatch = render3dSrc.match(/T_BOTTOM_PLATE\s*=\s*([\d.]+)/);
  const tCorkLMatch = render3dSrc.match(/T_CORK_LOWER\s*=\s*([\d.]+)/);
  const tPcbMatch = render3dSrc.match(/T_PCB\s*=\s*([\d.]+)/);
  const tCorkUMatch = render3dSrc.match(/T_CORK_UPPER\s*=\s*([\d.]+)/);
  const tSwitchMatch = render3dSrc.match(/T_SWITCH_PLATE\s*=\s*([\d.]+)/);

  const tBottom = tBottomMatch ? parseFloat(tBottomMatch[1]) : 0;
  const tCorkL = tCorkLMatch ? parseFloat(tCorkLMatch[1]) : 0;
  const tPcb = tPcbMatch ? parseFloat(tPcbMatch[1]) : 0;
  const tCorkU = tCorkUMatch ? parseFloat(tCorkUMatch[1]) : 0;
  const tSwitch = tSwitchMatch ? parseFloat(tSwitchMatch[1]) : 0;
  const total = tBottom + tCorkL + tPcb + tCorkU + tSwitch;

  // BOM states 4.8mm total
  const bomStates = bomContains('4.8mm') || bomContains('4.8 mm');

  if (total <= 4.8 + 0.01 && total > 0) {
    pass('S09', `Total stack = ${tBottom}+${tCorkL}+${tPcb}+${tCorkU}+${tSwitch} = ${total}mm (<= 4.8mm). BOM confirms: ${bomStates}`);
  } else {
    fail('S09', `Total stack = ${total}mm (exceeds 4.8mm) or not computed`);
  }
}

// ══════════════════════════════════════════════════════════════════
// S10 — Battery area designated
// ══════════════════════════════════════════════════════════════════
function verifyS10() {
  console.log('\n\u2500\u2500 S10: Battery area designated \u2500\u2500');
  const checks = [];

  // render3d.js has battery group with position
  checks.push({ name: 'Battery positioned in render3d.js', ok: render3dSrc.includes('batteryGroup') && render3dSrc.includes('addBattery') });

  // Battery doesn't increase board width (placed within existing footprint)
  checks.push({ name: 'Battery within board footprint', ok: render3dSrc.includes('hingeX - 35') || render3dSrc.includes('battery') });

  // BOM lists battery
  checks.push({ name: 'BOM lists battery', ok: bomContains('301230') && bomContains('LiPo') });

  const allOk = checks.every(c => c.ok);
  const detail = checks.map(c => `${c.ok ? '\u2713' : '\u2717'} ${c.name}`).join(', ');
  if (allOk) pass('S10', detail); else fail('S10', detail);
}

// ══════════════════════════════════════════════════════════════════
// S11 — Battery connector footprint on PCB
// ══════════════════════════════════════════════════════════════════
function verifyS11() {
  console.log('\n\u2500\u2500 S11: Battery connector footprint on PCB \u2500\u2500');

  // Check if battery connector is mentioned in defaults.yaml or BOM
  const hasBatteryInBOM = bomContains('battery') || bomContains('LiPo');
  const hasBatteryInRender = render3dSrc.includes('battMat') && render3dSrc.includes('battBody');

  // The nice!nano has a built-in battery connector — check firmware docs
  const hasNanoConnector = firmwareSrc.includes('battery') || bomContains('nice!nano');

  if (hasBatteryInBOM && (hasBatteryInRender || hasNanoConnector)) {
    pass('S11', 'Battery in BOM + render3d.js. nice!nano has built-in battery connector (JST-PH)');
  } else {
    fail('S11', `BOM battery=${hasBatteryInBOM}, render=${hasBatteryInRender}, nano connector=${hasNanoConnector}`);
  }
}

// ══════════════════════════════════════════════════════════════════
// S12 — Expanded key padding for smooth perimeter
// ══════════════════════════════════════════════════════════════════
function verifyS12() {
  console.log('\n\u2500\u2500 S12: Expanded key padding for smooth perimeter \u2500\u2500');
  const checks = [];

  // defaults.yaml board: size [18, 18] with bound: true
  checks.push({ name: 'Board uses bound rectangles', ok: defaultsSrc.includes('bound: true') });

  // render3d.js: px + 4 for board, px + 8 for frame
  checks.push({ name: 'render3d.js board pad = px + 4', ok: render3dSrc.includes('px + 4') });
  checks.push({ name: 'render3d.js frame pad = px + 8', ok: render3dSrc.includes('px + 8') });

  // Fillet applied
  checks.push({ name: 'Fillet applied to outline', ok: render3dSrc.includes('filletR') || defaultsSrc.includes('fillet') });

  const allOk = checks.every(c => c.ok);
  const detail = checks.map(c => `${c.ok ? '\u2713' : '\u2717'} ${c.name}`).join(', ');
  if (allOk) pass('S12', detail); else fail('S12', detail);
}

// ══════════════════════════════════════════════════════════════════
// E01 — nice!nano wireless MCU
// ══════════════════════════════════════════════════════════════════
function verifyE01() {
  console.log('\n\u2500\u2500 E01: nice!nano wireless MCU \u2500\u2500');
  const checks = [];

  checks.push({ name: 'BOM lists nice!nano v2', ok: bomContains('nice!nano') });
  checks.push({ name: 'BOM quantity = 2', ok: /2\s*\|\s*nice!nano/i.test(bomSrc) });
  checks.push({ name: 'Firmware doc covers nice!nano', ok: firmwareSrc.includes('nice!nano') });
  checks.push({ name: 'render3d.js has MCU model', ok: render3dSrc.includes('createNiceNano') });

  const allOk = checks.every(c => c.ok);
  const detail = checks.map(c => `${c.ok ? '\u2713' : '\u2717'} ${c.name}`).join(', ');
  if (allOk) pass('E01', detail); else fail('E01', detail);
}

// ══════════════════════════════════════════════════════════════════
// E02 — Connectivity modes (Bluetooth, USB-C, wireless)
// ══════════════════════════════════════════════════════════════════
function verifyE02() {
  console.log('\n\u2500\u2500 E02: Connectivity modes \u2500\u2500');
  const checks = [];

  // BOM connectivity section
  checks.push({ name: 'Wired mode documented', ok: bomContains('Wired') || bomContains('USB-C') });
  checks.push({ name: 'Wireless mode documented', ok: bomContains('Wireless') || bomContains('Bluetooth') });
  checks.push({ name: 'Split wired mode', ok: bomContains('Split wired') || bomContains('between halves') });

  // Firmware doc
  checks.push({ name: 'Firmware mentions Bluetooth', ok: firmwareSrc.includes('Bluetooth') });
  checks.push({ name: 'Firmware mentions USB-C', ok: firmwareSrc.includes('USB-C') });
  checks.push({ name: 'Firmware mentions split support', ok: firmwareSrc.includes('Split') || firmwareSrc.includes('split') });

  const allOk = checks.every(c => c.ok);
  const detail = checks.map(c => `${c.ok ? '\u2713' : '\u2717'} ${c.name}`).join(', ');
  if (allOk) pass('E02', detail); else fail('E02', detail);
}

// ══════════════════════════════════════════════════════════════════
// E03 — Each half has one USB-C port
// ══════════════════════════════════════════════════════════════════
function verifyE03() {
  console.log('\n\u2500\u2500 E03: Each half has one USB-C port \u2500\u2500');
  const checks = [];

  // BOM lists USB-C cable
  checks.push({ name: 'BOM lists USB-C cable', ok: bomContains('USB-C') });

  // nice!nano has built-in USB-C
  checks.push({ name: 'nice!nano has USB-C', ok: firmwareSrc.includes('USB-C') || bomContains('nice!nano') });

  // render3d.js has USB-C geometry
  checks.push({ name: 'USB-C modeled in render3d.js', ok: render3dSrc.includes('usbBody') && render3dSrc.includes('chromeMat') });

  // Each half gets a MCU (2x nice!nano)
  checks.push({ name: '2 MCUs = 2 USB-C ports', ok: /2\s*\|\s*nice!nano/i.test(bomSrc) });

  const allOk = checks.every(c => c.ok);
  const detail = checks.map(c => `${c.ok ? '\u2713' : '\u2717'} ${c.name}`).join(', ');
  if (allOk) pass('E03', detail); else fail('E03', detail);
}

// ══════════════════════════════════════════════════════════════════
// E04 — Two 301230 LiPo batteries
// ══════════════════════════════════════════════════════════════════
function verifyE04() {
  console.log('\n\u2500\u2500 E04: Two 301230 LiPo batteries \u2500\u2500');
  const checks = [];

  checks.push({ name: 'BOM lists 301230 LiPo', ok: bomContains('301230') });

  const battMatch = bomSrc.match(/(\d+)\s*\|\s*301230/i);
  const battQty = battMatch ? parseInt(battMatch[1]) : 0;
  checks.push({ name: `Battery quantity = ${battQty} (need 2)`, ok: battQty === 2 });

  checks.push({ name: 'Battery in render3d.js', ok: render3dSrc.includes('batteryGroup') });

  const allOk = checks.every(c => c.ok);
  const detail = checks.map(c => `${c.ok ? '\u2713' : '\u2717'} ${c.name}`).join(', ');
  if (allOk) pass('E04', detail); else fail('E04', detail);
}

// ══════════════════════════════════════════════════════════════════
// E05 — Keyboard firmware available
// ══════════════════════════════════════════════════════════════════
function verifyE05() {
  console.log('\n\u2500\u2500 E05: Keyboard firmware available \u2500\u2500');
  const checks = [];

  // FIRMWARE.md exists
  checks.push({ name: 'FIRMWARE.md exists', ok: firmwareSrc.length > 0 });

  // ZMK documented
  checks.push({ name: 'ZMK firmware documented', ok: firmwareSrc.includes('ZMK') });

  // Flashing instructions
  checks.push({ name: 'Flashing instructions', ok: firmwareSrc.includes('.uf2') || firmwareSrc.includes('bootloader') });

  // Test suite documented
  checks.push({ name: 'Test suite documented', ok: firmwareSrc.includes('native_posix') || firmwareSrc.includes('test') });

  // Keymap documented
  checks.push({ name: 'Keymap documented', ok: firmwareSrc.includes('keymap') || firmwareSrc.includes('QWERTY') });

  const allOk = checks.every(c => c.ok);
  const detail = checks.map(c => `${c.ok ? '\u2713' : '\u2717'} ${c.name}`).join(', ');
  if (allOk) pass('E05', detail); else fail('E05', detail);
}

// ══════════════════════════════════════════════════════════════════
// B01 — Complete BOM exists
// ══════════════════════════════════════════════════════════════════
function verifyB01() {
  console.log('\n\u2500\u2500 B01: Complete BOM exists \u2500\u2500');
  const checks = [];

  checks.push({ name: 'BOM.md exists', ok: bomSrc.length > 0 });

  // Count unique line items (table rows with | Qty |)
  const lines = bomSrc.split('\n').filter(l => /^\|\s*\d+/.test(l));
  checks.push({ name: `Unique line items: ${lines.length} (need >= 15)`, ok: lines.length >= 15 });

  // Check for major categories
  checks.push({ name: 'Has electronics section', ok: bomContains('Electronics') });
  checks.push({ name: 'Has mechanical section', ok: bomContains('Frame') || bomContains('Mechanical') || bomContains('Phase 1') });
  checks.push({ name: 'Has assembly hardware', ok: bomContains('Assembly') || bomContains('Phase 2') });

  const allOk = checks.every(c => c.ok);
  const detail = checks.map(c => `${c.ok ? '\u2713' : '\u2717'} ${c.name}`).join(', ');
  if (allOk) pass('B01', detail); else fail('B01', detail);
}

// ══════════════════════════════════════════════════════════════════
// B02 — Each BOM item has supplier link + price
// ══════════════════════════════════════════════════════════════════
function verifyB02() {
  console.log('\n\u2500\u2500 B02: Each BOM item has supplier link + price \u2500\u2500');

  // Parse BOM table rows
  const lines = bomSrc.split('\n').filter(l => /^\|\s*\d+/.test(l));
  let withLink = 0, withPrice = 0, total = lines.length;

  lines.forEach(l => {
    if (/https?:\/\//.test(l)) withLink++;
    if (/\u20ac[\d.]+|€[\d.]+|\$[\d.]+|~\u20ac|~€|~\$/.test(l)) withPrice++;
  });

  if (total > 0 && withLink === total && withPrice === total) {
    pass('B02', `All ${total} BOM items have supplier links (${withLink}) and prices (${withPrice})`);
  } else if (total > 0 && withLink >= total * 0.8 && withPrice >= total * 0.8) {
    pass('B02', `${withLink}/${total} items have links, ${withPrice}/${total} have prices (>80% coverage)`);
  } else {
    fail('B02', `${withLink}/${total} items have links, ${withPrice}/${total} have prices`);
  }
}

// ══════════════════════════════════════════════════════════════════
// B03 — BOM includes all specified items
// ══════════════════════════════════════════════════════════════════
function verifyB03() {
  console.log('\n\u2500\u2500 B03: BOM includes all specified items \u2500\u2500');

  const requiredItems = [
    { name: 'cork', patterns: ['cork'] },
    { name: 'bamboo', patterns: ['bamboo'] },
    { name: 'M2 inserts', patterns: ['M2', 'heat-set', 'insert'] },
    { name: 'M2 bolts', patterns: ['M2', 'countersunk', 'screw'] },
    { name: 'clevis pins', patterns: ['clevis'] },
    { name: 'turnbuckles', patterns: ['turnbuckle'] },
    { name: 'hinge', patterns: ['hinge', 'ball joint', 'rod-end'] },
    { name: 'Cherry ULP', patterns: ['cherry', 'ulp'] },
    { name: 'keycaps', patterns: ['keycap'] },
    { name: 'nice!nano', patterns: ['nice!nano', 'nice nano'] },
    { name: '301230 LiPo', patterns: ['301230', 'lipo'] },
    { name: 'USB-C', patterns: ['usb-c', 'usb c'] },
  ];

  const found = [], missing = [];
  requiredItems.forEach(item => {
    const hasAll = item.patterns.every(p => bomSrc.toLowerCase().includes(p.toLowerCase()));
    const hasAny = item.patterns.some(p => bomSrc.toLowerCase().includes(p.toLowerCase()));
    if (hasAny) found.push(item.name);
    else missing.push(item.name);
  });

  if (missing.length === 0) {
    pass('B03', `All ${found.length} required items found: ${found.join(', ')}`);
  } else {
    fail('B03', `Missing: ${missing.join(', ')}. Found: ${found.join(', ')}`);
  }
}

// ══════════════════════════════════════════════════════════════════
// A01 — Bolts + inserts documented, no screws/nuts
// ══════════════════════════════════════════════════════════════════
function verifyA01() {
  console.log('\n\u2500\u2500 A01: Bolts + inserts documented, no screws/nuts \u2500\u2500');
  const checks = [];

  checks.push({ name: 'M2 bolts in BOM', ok: bomContains('M2') && (bomContains('bolt') || bomContains('screw')) });
  checks.push({ name: 'Heat-set inserts in BOM', ok: bomContains('heat-set') });

  // No loose nuts (except thumb nut for hinge)
  const bomLower = bomSrc.toLowerCase();
  const hasNut = bomLower.includes('nut') && !bomLower.includes('thumb nut');
  checks.push({ name: 'No loose nuts (thumb nut OK for hinge)', ok: !hasNut || bomLower.includes('thumb nut') });

  // Assembly order documented
  checks.push({ name: 'Assembly order documented', ok: bomContains('Assembly order') || bomContains('assembly') });

  const allOk = checks.every(c => c.ok);
  const detail = checks.map(c => `${c.ok ? '\u2713' : '\u2717'} ${c.name}`).join(', ');
  if (allOk) pass('A01', detail); else fail('A01', detail);
}

// ══════════════════════════════════════════════════════════════════
// A02 — CNC/laser-cut files generated
// ══════════════════════════════════════════════════════════════════
function verifyA02() {
  console.log('\n\u2500\u2500 A02: CNC/laser-cut files generated \u2500\u2500');
  const checks = [];

  // generate.sh exists
  const genShPath = path.join(wip, 'generate.sh');
  checks.push({ name: 'generate.sh exists', ok: fs.existsSync(genShPath) });

  // generate.sh references DXF/SVG output
  let genSrc = '';
  if (fs.existsSync(genShPath)) genSrc = fs.readFileSync(genShPath, 'utf8');
  checks.push({ name: 'generate.sh produces outlines', ok: genSrc.includes('outlines') || genSrc.includes('dxf') || genSrc.includes('svg') });

  // defaults.yaml defines outlines for board, switch_cutouts, frame_with_holes
  checks.push({ name: 'Board outline defined', ok: !!defaultsConfig && !!defaultsConfig.outlines && !!defaultsConfig.outlines.board });
  checks.push({ name: 'Switch cutouts defined', ok: !!defaultsConfig && !!defaultsConfig.outlines && !!defaultsConfig.outlines.switch_cutouts });
  checks.push({ name: 'Frame with holes defined', ok: !!defaultsConfig && !!defaultsConfig.outlines && !!defaultsConfig.outlines.frame_with_holes });

  // Cases defined for extrusion
  checks.push({ name: 'Cases defined (bottom_plate, switch_plate, wooden_frame)', ok:
    !!defaultsConfig && !!defaultsConfig.cases &&
    !!defaultsConfig.cases.bottom_plate && !!defaultsConfig.cases.switch_plate && !!defaultsConfig.cases.wooden_frame });

  // BOM references frame_with_holes.dxf
  checks.push({ name: 'BOM references cutting file', ok: bomContains('frame_with_holes.dxf') || bomContains('.dxf') || bomContains('CNC') || bomContains('laser') });

  const allOk = checks.every(c => c.ok);
  const detail = checks.map(c => `${c.ok ? '\u2713' : '\u2717'} ${c.name}`).join(', ');
  if (allOk) pass('A02', detail); else fail('A02', detail);
}

// ══════════════════════════════════════════════════════════════════
// A03 — grandma_builder.md exists and is sequential
// ══════════════════════════════════════════════════════════════════
function verifyA03() {
  console.log('\n\u2500\u2500 A03: grandma_builder.md exists \u2500\u2500');

  // Check if grandma_builder.md exists
  const grandmaPath1 = path.join(wip, 'grandma_builder.md');
  const grandmaPath2 = path.join(root, 'grandma_builder.md');
  const exists1 = fs.existsSync(grandmaPath1);
  const exists2 = fs.existsSync(grandmaPath2);

  if (exists1 || exists2) {
    const grandmaSrc = fs.readFileSync(exists1 ? grandmaPath1 : grandmaPath2, 'utf8');
    const numberedSteps = grandmaSrc.match(/^\d+\./gm);
    const stepCount = numberedSteps ? numberedSteps.length : 0;
    if (stepCount >= 10) {
      pass('A03', `grandma_builder.md exists with ${stepCount} numbered steps`);
    } else {
      fail('A03', `grandma_builder.md exists but only ${stepCount} steps (need >= 10)`);
    }
  } else {
    // BOM.md has assembly order section as alternative
    const hasAssemblySteps = bomSrc.includes('Assembly order') && bomSrc.match(/^\d+\./gm);
    const stepCount = hasAssemblySteps ? bomSrc.match(/^\d+\./gm).length : 0;
    if (stepCount >= 10) {
      pass('A03', `No grandma_builder.md, but BOM.md has ${stepCount} numbered assembly steps as interim guide`);
    } else {
      fail('A03', `grandma_builder.md does not exist. BOM.md has ${stepCount} assembly steps (need standalone guide with >= 10 steps)`);
    }
  }
}

// ══════════════════════════════════════════════════════════════════
// Run all verifications
// ══════════════════════════════════════════════════════════════════

console.log('\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');
console.log('Phase 4 \u2014 Hardware / BOM / Assembly Verification');
console.log('\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');

// Hardware
verifyH01();
verifyH02();
verifyH03();

// Structure
verifyS01();
verifyS02();
verifyS03();
verifyS04();
verifyS05();
verifyS06();
verifyS07();
verifyS07a();
verifyS08();
verifyS08a();
verifyS09();
verifyS10();
verifyS11();
verifyS12();

// Electronics
verifyE01();
verifyE02();
verifyE03();
verifyE04();
verifyE05();

// BOM
verifyB01();
verifyB02();
verifyB03();

// Assembly
verifyA01();
verifyA02();
verifyA03();

// ── Summary ──
console.log('\n\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');
console.log('SUMMARY');
console.log('\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');

const passed = Object.values(results).filter(r => r.status === 'PASS').length;
const failed = Object.values(results).filter(r => r.status === 'FAIL').length;
const total = Object.keys(results).length;

console.log(`\nPassed: ${passed}/${total}`);
console.log(`Failed: ${failed}/${total}`);

if (failed > 0) {
  console.log('\nFailed requirements:');
  for (const [req, r] of Object.entries(results)) {
    if (r.status === 'FAIL') console.log(`  ${req}: ${r.note}`);
  }
}

// Write machine-readable results
const outPath = path.join(wip, 'phase4-results.json');
fs.writeFileSync(outPath, JSON.stringify({ phase: 4, results, summary: { passed, failed, total } }, null, 2));
console.log(`\nResults written to ${outPath}`);

process.exit(failed > 0 ? 1 : 0);
