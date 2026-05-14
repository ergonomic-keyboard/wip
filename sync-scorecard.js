#!/usr/bin/env node
// One-shot script: parse compliance_scorecard.md and merge counter data + notes
// into the current commit's req-status JSON file.
//
// Usage: node sync-scorecard.js
//
// Reads compliance_scorecard.md table rows, extracts per-requirement:
//   selfAttempts, selfFails, userCorrections, comment (Notes column)
// Merges into req-status/<currentCommit>.json, preserving existing user status.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DIR = __dirname;
const SCORECARD = path.join(DIR, 'compliance_scorecard.md');
const STATUS_DIR = path.join(DIR, 'req-status');

function currentCommit() {
  try { return execSync('git rev-parse --short HEAD', { cwd: DIR, encoding: 'utf8' }).trim(); }
  catch { return 'unknown'; }
}

const hash = currentCommit();
const statusFile = path.join(STATUS_DIR, `${hash}.json`);

console.log(`Syncing scorecard → ${statusFile}`);

// Read existing status
let status = {};
if (fs.existsSync(statusFile)) {
  status = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
}

// Parse scorecard
const md = fs.readFileSync(SCORECARD, 'utf8');
const lines = md.split('\n');

// Match table rows like: | L01 | SELF_PASS | 2 | 0 | 1 | Some notes here |
// Also match DG rows:    | DG-01 | SELF_PASS | [AI] notes... |
const reqRowRe = /^\|\s*([A-Z][A-Za-z0-9._-]+)\s*\|\s*(\S+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(.*?)\s*\|$/;
const dgRowRe = /^\|\s*(DG-\d+)\s*\|\s*(\S+)\s*\|\s*(.*?)\s*\|$/;

let merged = 0;
let skipped = 0;

for (const line of lines) {
  let match = reqRowRe.exec(line);
  if (match) {
    let reqId = match[1];
    // Strip REQ- prefix if present (scorecard uses bare IDs)
    reqId = reqId.replace(/^REQ-/, '');
    const selfAttempts = parseInt(match[3], 10);
    const selfFails = parseInt(match[4], 10);
    const userCorrections = parseInt(match[5], 10);
    const notes = match[6].trim();

    // Ensure entry exists
    if (!status[reqId]) {
      status[reqId] = { status: '', comment: '' };
    }
    if (typeof status[reqId] === 'string') {
      status[reqId] = { status: status[reqId], comment: '' };
    }

    // Merge counters — always overwrite from scorecard (source of truth)
    status[reqId].selfAttempts = selfAttempts;
    status[reqId].selfFails = selfFails;
    status[reqId].userCorrections = userCorrections;

    // Merge notes into comment if the existing comment is empty
    // (don't overwrite user-entered comments from the web UI)
    if (notes && !status[reqId].comment) {
      status[reqId].comment = notes;
    }

    merged++;
    continue;
  }

  // DG rows have no counter columns, just notes
  match = dgRowRe.exec(line);
  if (match) {
    let reqId = match[1];
    const notes = match[3].trim();
    if (!status[reqId]) {
      status[reqId] = { status: '', comment: '' };
    }
    if (typeof status[reqId] === 'string') {
      status[reqId] = { status: status[reqId], comment: '' };
    }
    // DG rows don't have counter columns — set to 0
    if (status[reqId].selfAttempts === undefined) status[reqId].selfAttempts = 0;
    if (status[reqId].selfFails === undefined) status[reqId].selfFails = 0;
    if (status[reqId].userCorrections === undefined) status[reqId].userCorrections = 0;
    if (notes && !status[reqId].comment) {
      status[reqId].comment = notes;
    }
    merged++;
  }
}

// Write back
fs.writeFileSync(statusFile, JSON.stringify(status, null, 2) + '\n');
console.log(`Done: ${merged} requirements merged into ${hash}.json`);

// Verify a few known entries
const l01 = status['L01'];
console.log(`  L01: attempts=${l01?.selfAttempts}, fails=${l01?.selfFails}, corrections=${l01?.userCorrections}`);
const s07 = status['S07'];
console.log(`  S07: attempts=${s07?.selfAttempts}, fails=${s07?.selfFails}, corrections=${s07?.userCorrections}`);
const r37 = status['R37'];
console.log(`  R37: attempts=${r37?.selfAttempts}, fails=${r37?.selfFails}, corrections=${r37?.userCorrections}`);
