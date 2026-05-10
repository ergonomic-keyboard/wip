#!/usr/bin/env node
// Requirement status tracker — tiny HTTP server
// Serves req-tracker.html and persists user review status per git commit.
// Usage: node req-tracker.js [port]

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = parseInt(process.argv[2] || '8099', 10);
const DIR = __dirname;
const STATUS_DIR = path.join(DIR, 'req-status');
const REQUIREMENTS_FILE = path.join(DIR, 'final_requirements.md');

// Ensure status dir exists
if (!fs.existsSync(STATUS_DIR)) fs.mkdirSync(STATUS_DIR);

function git(cmd) {
  return execSync(cmd, { cwd: DIR, encoding: 'utf8' }).trim();
}

function currentCommit() {
  try { return git('git rev-parse --short HEAD'); } catch { return 'unknown'; }
}

function commitList() {
  try {
    const raw = git('git log --oneline -50');
    return raw.split('\n').map(line => {
      const sp = line.indexOf(' ');
      return { hash: line.slice(0, sp), msg: line.slice(sp + 1) };
    });
  } catch { return []; }
}

function statusFile(hash) {
  return path.join(STATUS_DIR, `${hash}.json`);
}

function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return {}; }
}

// Migrate old SKIP statuses to FAIL
function migrateSkipToFail(data) {
  let changed = false;
  for (const [k, v] of Object.entries(data)) {
    if (v && typeof v === 'object' && v.status === 'SKIP') {
      v.status = 'FAIL'; changed = true;
    } else if (typeof v === 'string' && v === 'SKIP') {
      data[k] = 'FAIL'; changed = true;
    }
  }
  return changed;
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}

// If no status file for this commit, inherit from nearest commit that has one
function ensureStatus(hash) {
  const f = statusFile(hash);
  if (fs.existsSync(f)) return;
  const allCommits = commitList();
  const idx = allCommits.findIndex(c => c.hash === hash);
  if (idx < 0) return;
  // Search both directions: older first (idx+1..), then newer (idx-1..0)
  const candidates = [];
  for (let i = idx + 1; i < allCommits.length; i++) candidates.push(allCommits[i].hash);
  for (let i = idx - 1; i >= 0; i--) candidates.push(allCommits[i].hash);
  for (const ch of candidates) {
    const prev = statusFile(ch);
    if (fs.existsSync(prev)) {
      const prevData = readJSON(prev);
      const inherited = {};
      for (const [k, v] of Object.entries(prevData)) {
        let s = '';
        if (v && typeof v === 'object') { s = v.status || ''; }
        else if (typeof v === 'string') { s = v; }
        if (s === 'SKIP') s = 'FAIL';
        inherited[k] = { status: s, comment: '' };
      }
      writeJSON(f, inherited);
      return;
    }
  }
}

// Migrate old req-status.json to current commit if no per-commit file exists
function migrateOldStatus() {
  const oldFile = path.join(DIR, 'req-status.json');
  if (!fs.existsSync(oldFile)) return;
  const hash = currentCommit();
  const f = statusFile(hash);
  if (!fs.existsSync(f)) {
    const data = readJSON(oldFile);
    if (Object.keys(data).length > 0) {
      writeJSON(f, data);
    }
  }
}

migrateOldStatus();

const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.md':   'text/plain',
};

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => resolve(body));
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // API: GET /api/data — return requirements + commits + status for a commit
  if (url.pathname === '/api/data' && req.method === 'GET') {
    const hash = url.searchParams.get('commit') || currentCommit();
    ensureStatus(hash);
    const requirements = fs.readFileSync(REQUIREMENTS_FILE, 'utf8');
    const commits = commitList();
    const userStatus = readJSON(statusFile(hash));
    if (migrateSkipToFail(userStatus)) writeJSON(statusFile(hash), userStatus);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ requirements, commits, currentCommit: currentCommit(), selectedCommit: hash, userStatus }));
    return;
  }

  // API: POST /api/status?commit=<hash> — save user status for a commit
  if (url.pathname === '/api/status' && req.method === 'POST') {
    const hash = url.searchParams.get('commit') || currentCommit();
    const body = await readBody(req);
    try {
      const data = JSON.parse(body);
      writeJSON(statusFile(hash), data);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{"ok":true}');
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // API: POST /api/edit-requirement — edit requirement text in final_requirements.md
  if (url.pathname === '/api/edit-requirement' && req.method === 'POST') {
    const body = await readBody(req);
    try {
      const { id, newText } = JSON.parse(body);
      if (!id || !newText) throw new Error('id and newText required');
      let md = fs.readFileSync(REQUIREMENTS_FILE, 'utf8');
      const eid = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Match single-line or multiline requirement (up to next ** or ## or ---)
      const re = new RegExp(`(\\*\\*(?:REQ-)?${eid}\\*\\*\\s*[—–-]\\s*)([\\s\\S]*?)(?=\\n\\*\\*|\\n##|\\n---|$)`, 'g');
      const match = re.exec(md);
      if (!match) throw new Error(`${id} not found in requirements`);
      md = md.slice(0, match.index) + match[1] + newText + md.slice(match.index + match[0].length);
      fs.writeFileSync(REQUIREMENTS_FILE, md);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{"ok":true}');
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // API: POST /api/delete-requirement — remove a requirement from final_requirements.md
  if (url.pathname === '/api/delete-requirement' && req.method === 'POST') {
    const body = await readBody(req);
    try {
      const { id } = JSON.parse(body);
      if (!id) throw new Error('id required');
      let md = fs.readFileSync(REQUIREMENTS_FILE, 'utf8');
      const eid = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Match the full requirement block including leading newlines
      const re = new RegExp(`\\n*\\*\\*(?:REQ-)?${eid}\\*\\*\\s*[—–-]\\s*[\\s\\S]*?(?=\\n\\*\\*|\\n##|\\n---|$)`, 'g');
      const match = re.exec(md);
      if (!match) throw new Error(`${id} not found`);
      md = md.slice(0, match.index) + md.slice(match.index + match[0].length);
      fs.writeFileSync(REQUIREMENTS_FILE, md);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{"ok":true}');
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // API: POST /api/add-requirement — add a requirement to a specific section
  // Supports afterId to insert after a specific requirement (for sub-requirements)
  if (url.pathname === '/api/add-requirement' && req.method === 'POST') {
    const body = await readBody(req);
    try {
      const { id, text, afterSection, afterId } = JSON.parse(body);
      if (!id || !text) throw new Error('id and text required');
      let md = fs.readFileSync(REQUIREMENTS_FILE, 'utf8');
      const newReq = '\n**REQ-' + id + '** — ' + text + '\n';
      const lines = md.split('\n');
      let inserted = false;

      // If afterId is provided, insert after the last line of that requirement
      if (afterId) {
        const eid = afterId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(`^\\*\\*(?:REQ-)?${eid}\\*\\*\\s*[—–-]`);
        for (let i = 0; i < lines.length; i++) {
          if (re.test(lines[i])) {
            // Skip multiline content of this requirement
            let j = i + 1;
            while (j < lines.length && lines[j] && !lines[j].match(/^\*\*/) && !lines[j].match(/^##/) && !lines[j].match(/^---/)) {
              j++;
            }
            lines.splice(j, 0, newReq);
            inserted = true;
            break;
          }
        }
      }

      // Fallback: insert at end of section
      if (!inserted && afterSection) {
        let sectionStart = -1;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].match(/^## /) && lines[i].includes(afterSection)) {
            sectionStart = i; break;
          }
        }
        if (sectionStart >= 0) {
          let insertAt = lines.length;
          for (let i = sectionStart + 1; i < lines.length; i++) {
            if (lines[i].match(/^---/) || (lines[i].match(/^## /) && i > sectionStart)) {
              insertAt = i; break;
            }
          }
          lines.splice(insertAt, 0, newReq);
          inserted = true;
        }
      }

      if (!inserted) {
        lines.push(newReq);
      }

      md = lines.join('\n');
      fs.writeFileSync(REQUIREMENTS_FILE, md);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{"ok":true}');
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Static file serving
  let filePath = url.pathname === '/' ? '/req-tracker.html' : url.pathname;
  filePath = path.join(DIR, filePath);
  if (!filePath.startsWith(DIR)) { res.writeHead(403); res.end('Forbidden'); return; }

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} in use, killing existing process...`);
    try { execSync(`fuser -k ${PORT}/tcp`, { stdio: 'ignore' }); } catch {}
    setTimeout(() => server.listen(PORT), 500);
  } else {
    throw err;
  }
});

server.listen(PORT, () => {
  console.log(`Requirement tracker: http://localhost:${PORT}`);
  console.log(`Status dir: ${STATUS_DIR}`);
  console.log(`Current commit: ${currentCommit()}`);
});
