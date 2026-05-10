#!/usr/bin/env node
// Generates req-tracker-data.json for static GitHub Pages deployment.
// Bundles final_requirements.md + the latest status file into a single JSON.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DIR = __dirname;
const STATUS_DIR = path.join(DIR, 'req-status');
const REQUIREMENTS_FILE = path.join(DIR, 'final_requirements.md');
const OUTPUT = path.join(DIR, 'req-tracker-data.json');

function git(cmd) {
  return execSync(cmd, { cwd: DIR, encoding: 'utf8' }).trim();
}

let commitHash = 'unknown';
let commitMsg = '';
try {
  commitHash = git('git rev-parse --short HEAD');
  commitMsg = git('git log -1 --format=%s');
} catch {}

// Find the best status file: current commit, or most recent
let userStatus = {};
const statusFile = path.join(STATUS_DIR, `${commitHash}.json`);
if (fs.existsSync(statusFile)) {
  userStatus = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
} else {
  // Find most recent status file by mtime
  try {
    const files = fs.readdirSync(STATUS_DIR).filter(f => f.endsWith('.json'));
    if (files.length > 0) {
      files.sort((a, b) => fs.statSync(path.join(STATUS_DIR, b)).mtimeMs - fs.statSync(path.join(STATUS_DIR, a)).mtimeMs);
      userStatus = JSON.parse(fs.readFileSync(path.join(STATUS_DIR, files[0]), 'utf8'));
      console.log(`No status for ${commitHash}, using ${files[0]}`);
    }
  } catch {}
}

// Migrate SKIP -> FAIL
for (const [k, v] of Object.entries(userStatus)) {
  if (v && typeof v === 'object' && v.status === 'SKIP') v.status = 'FAIL';
  else if (typeof v === 'string' && v === 'SKIP') userStatus[k] = { status: 'FAIL', comment: '' };
}

const requirements = fs.readFileSync(REQUIREMENTS_FILE, 'utf8');

const data = {
  requirements,
  commits: [{ hash: commitHash, msg: commitMsg }],
  currentCommit: commitHash,
  selectedCommit: commitHash,
  userStatus,
};

fs.writeFileSync(OUTPUT, JSON.stringify(data));
console.log(`Built ${OUTPUT} (${(fs.statSync(OUTPUT).size / 1024).toFixed(1)} KB)`);
