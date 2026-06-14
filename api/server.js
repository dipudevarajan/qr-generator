// adfreeqr.com analytics API
// Endpoints:
//   POST /api/track  { mode: 'single'|'multi' }  → records event
//   GET  /api/stats  → returns aggregated stats
//
// Country is detected from CF-IPCountry header (Cloudflare) or fallback.
// Storage: SQLite file (zero-config, persistent via volume mount)

const http  = require('http');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || '/data/analytics.db';

// Ensure data dir exists
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts INTEGER NOT NULL,
    mode TEXT NOT NULL,
    country TEXT,
    ip_hash TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts);
  CREATE INDEX IF NOT EXISTS idx_events_country ON events(country);
  CREATE INDEX IF NOT EXISTS idx_events_ip ON events(ip_hash);
`);

// Simple IP hash (privacy - we never store raw IPs)
const crypto = require('crypto');
const SALT = process.env.HASH_SALT || 'adfreeqr-default-salt-change-me';
function hashIP(ip) {
  return crypto.createHash('sha256').update(SALT + ':' + ip).digest('hex').slice(0, 16);
}

function getClientIP(req) {
  return (
    req.headers['cf-connecting-ip'] ||
    req.headers['x-real-ip'] ||
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

function getCountry(req) {
  return (req.headers['cf-ipcountry'] || '').toUpperCase().slice(0,2) || null;
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
  res.end(JSON.stringify(body));
}

// ── Routes ──────────────────────────────────────────────────────────

const insertEvent = db.prepare(`
  INSERT INTO events (ts, mode, country, ip_hash) VALUES (?, ?, ?, ?)
`);

function handleTrack(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk;
    if (body.length > 1024) { req.destroy(); }
  });
  req.on('end', () => {
    try {
      const data = body ? JSON.parse(body) : {};
      const mode = (data.mode === 'multi') ? 'multi' : 'single';
      const country = getCountry(req);
      const ipHash = hashIP(getClientIP(req));
      const ts = Math.floor(Date.now() / 1000);

      insertEvent.run(ts, mode, country, ipHash);
      send(res, 200, { ok: true });
    } catch (e) {
      send(res, 400, { error: 'invalid payload' });
    }
  });
}

const qTotal      = db.prepare(`SELECT COUNT(*) AS c FROM events`);
const qToday      = db.prepare(`SELECT COUNT(*) AS c FROM events WHERE ts >= ?`);
const qWeek       = db.prepare(`SELECT COUNT(*) AS c FROM events WHERE ts >= ?`);
const qUnique     = db.prepare(`SELECT COUNT(DISTINCT ip_hash) AS c FROM events`);
const qByType     = db.prepare(`SELECT mode, COUNT(*) AS c FROM events GROUP BY mode`);
const qByCountry  = db.prepare(`SELECT COALESCE(country,'??') AS code, COUNT(*) AS count FROM events GROUP BY country ORDER BY count DESC LIMIT 20`);
const qDaily      = db.prepare(`SELECT strftime('%Y-%m-%d', ts, 'unixepoch') AS date, COUNT(*) AS count FROM events WHERE ts >= ? GROUP BY date ORDER BY date ASC`);

function handleStats(req, res) {
  const now = Math.floor(Date.now() / 1000);
  const startOfTodayUTC = Math.floor(new Date(new Date().toISOString().slice(0,10)).getTime()/1000);
  const weekAgo  = now - 7 * 86400;
  const days14   = now - 14 * 86400;

  const total = qTotal.get().c;
  const today = qToday.get(startOfTodayUTC).c;
  const week  = qWeek.get(weekAgo).c;
  const unique = qUnique.get().c;

  const typeRows = qByType.all();
  const byType = { single: 0, multi: 0 };
  typeRows.forEach(r => { byType[r.mode] = r.c; });

  const byCountry = qByCountry.all();

  // Build daily array with zero-filled days
  const dailyRaw = qDaily.all(days14);
  const dailyMap = Object.fromEntries(dailyRaw.map(d => [d.date, d.count]));
  const daily = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0,10);
    daily.push({ date: d, count: dailyMap[d] || 0 });
  }

  send(res, 200, { total, today, week, unique, byType, byCountry, daily });
}

// ── Server ──────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  // CORS for tracking endpoint (called from browser)
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'POST' && req.url === '/track') {
    return handleTrack(req, res);
  }
  if (req.method === 'GET' && req.url === '/stats') {
    return handleStats(req, res);
  }
  if (req.method === 'GET' && req.url === '/health') {
    return send(res, 200, { ok: true, uptime: process.uptime() });
  }
  send(res, 404, { error: 'not found' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[adfreeqr-api] listening on :${PORT}`);
  console.log(`[adfreeqr-api] db: ${DB_PATH}`);
});
