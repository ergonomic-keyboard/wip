#!/usr/bin/env node
// Generate compliance_scorecard.md from the current commit's req-status JSON.
// This makes the JSON the single source of truth for counter data.
//
// Usage: node generate-scorecard.js

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DIR = __dirname;
const STATUS_DIR = path.join(DIR, 'req-status');
const REQ_FILE = path.join(DIR, 'final_requirements.md');
const SCORECARD = path.join(DIR, 'compliance_scorecard.md');

function currentCommit() {
  try { return execSync('git rev-parse --short HEAD', { cwd: DIR, encoding: 'utf8' }).trim(); }
  catch { return 'unknown'; }
}

const hash = currentCommit();
const statusFile = path.join(STATUS_DIR, `${hash}.json`);
if (!fs.existsSync(statusFile)) { console.error(`No status file for ${hash}`); process.exit(1); }

const status = JSON.parse(fs.readFileSync(statusFile, 'utf8'));

// Parse requirements to get section groupings
const md = fs.readFileSync(REQ_FILE, 'utf8');
const lines = md.split('\n');
const sections = []; // { title, reqs: [{id, text}] }
let cur = null;
for (const line of lines) {
  const sec = line.match(/^## (.+)/);
  if (sec) { cur = { title: sec[1], reqs: [] }; sections.push(cur); continue; }
  const req = line.match(/^\*\*(?:REQ-)?([A-Z0-9a-z_.-]+)\*\*\s*[—–-]\s*(.*)/);
  if (req && cur) { cur.reqs.push({ id: req[1], text: req[2].slice(0, 80) }); }
}

// Status mapping from internal to scorecard
function mapStatus(s) {
  if (!s) return 'NOT_STARTED';
  const map = { PASS: 'SELF_PASS', ASSUME: 'SELF_PASS', FAIL: 'USER_FAIL' };
  return map[s] || s;
}

// Build scorecard
let out = `# Compliance Scorecard

> Auto-generated from req-status/${hash}.json. Edit counter data in the req-tracker UI, then re-run \`node generate-scorecard.js\`.

## Legend

- **Self-attempts**: How many times I ran my own verification and thought it passed
- **Self-fails**: How many times my own verification caught a failure (good — caught before user saw it)
- **User corrections**: How many times the user inspected and told me it was wrong (bad — I missed it)
- **Status**: \`NOT_STARTED\` | \`IN_PROGRESS\` | \`SELF_PASS\` | \`USER_PASS\` | \`USER_FAIL\` | \`BLOCKED\`
`;

for (const sec of sections) {
  if (!sec.reqs.length) continue;
  const isDG = sec.title.includes('Design Guidelines');
  out += `\n## ${sec.title}\n\n`;
  if (isDG) {
    out += `| DG | Status | Notes |\n`;
    out += `|----|--------|-------|\n`;
  } else {
    out += `| REQ | Status | Self-attempts | Self-fails | User corrections | Notes |\n`;
    out += `|-----|--------|--------------|------------|-----------------|-------|\n`;
  }
  for (const r of sec.reqs) {
    const s = status[r.id] || {};
    const st = mapStatus(s.status);
    const att = s.selfAttempts || 0;
    const fl = s.selfFails || 0;
    const cor = s.userCorrections || 0;
    const notes = (s.comment || '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
    if (isDG) {
      out += `| ${r.id} | ${st} | ${notes} |\n`;
    } else {
      out += `| ${r.id} | ${st} | ${att} | ${fl} | ${cor} | ${notes} |\n`;
    }
  }
}

// Totals
const allReqs = sections.flatMap(s => s.reqs);
const supReqs = allReqs.filter(r => {
  const line = md.split('\n').find(l => l.includes(`**${r.id}**`) || l.includes(`**REQ-${r.id}**`));
  return line && line.includes('SUPERSEDED');
});
const activeReqs = allReqs.filter(r => !supReqs.includes(r));
const pass = activeReqs.filter(r => { const s = (status[r.id] || {}).status; return s === 'PASS' || s === 'ASSUME'; }).length;
const fail = activeReqs.filter(r => (status[r.id] || {}).status === 'FAIL').length;
const notStarted = activeReqs.filter(r => !(status[r.id] || {}).status).length;
let totalCorr = 0;
for (const v of Object.values(status)) totalCorr += (v.userCorrections || 0);

out += `\n## Totals\n\n`;
out += `| Metric | Count |\n`;
out += `|--------|-------|\n`;
out += `| Total requirements | ${allReqs.length} |\n`;
out += `| Self-verified PASS | ${pass} |\n`;
out += `| Superseded | ${supReqs.length} |\n`;
out += `| Currently USER_FAIL | ${fail} |\n`;
out += `| Not started | ${notStarted} |\n`;
out += `| Total user corrections | ${totalCorr} |\n`;

fs.writeFileSync(SCORECARD, out);
console.log(`Scorecard generated: ${SCORECARD} (${allReqs.length} requirements from ${hash})`);
