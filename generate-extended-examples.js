#!/usr/bin/env node
// generate-extended-examples.js — Generates extended example JSONs with computed switch positions
// This resolves the known blocker: example JSONs lack computed switch positions.

'use strict';

const fs = require('fs');
const path = require('path');
const fitting = require('./fitting');

const examplesDir = path.join(__dirname, 'examples');
const extendedDir = path.join(__dirname, 'examples', 'extended');

if (!fs.existsSync(extendedDir)) {
  fs.mkdirSync(extendedDir, { recursive: true });
}

const files = fs.readdirSync(examplesDir).filter(f => f.endsWith('.json'));
let count = 0;

files.forEach(file => {
  const inputPath = path.join(examplesDir, file);
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

  if (!data.positions) {
    console.log(`SKIP: ${file} — no positions field`);
    return;
  }

  // Check minimum tap counts
  let valid = true;
  for (const col of fitting.ALL_COLUMNS) {
    const taps = data.positions[col];
    if (!taps || taps.length < 2) {
      console.log(`WARN: ${file} — column ${col} has ${taps ? taps.length : 0} taps (need ≥2 for fitting)`);
    }
  }

  const extended = fitting.generateExtendedJSON(data);

  // Write extended JSON
  const outPath = path.join(extendedDir, file);
  fs.writeFileSync(outPath, JSON.stringify(extended, null, 2));
  count++;

  // Summary
  const nSwitches = Object.values(extended.computedSwitches).reduce((sum, col) => sum + col.length, 0);
  console.log(`OK: ${file} → ${nSwitches} switches, PPM=${extended.calibratedPPM.toFixed(4)}`);
});

console.log(`\nGenerated ${count} extended example JSONs in ${extendedDir}`);
