const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const DATA_DIR = path.join(__dirname, 'data');
const TOKENS_FILE = path.join(DATA_DIR, 'tokens.json');
const PUBLIC_DIR = path.join(__dirname, 'public');
const PORT = process.env.PORT || 3000;
const DOOR_WEBHOOK_URL = process.env.DOOR_WEBHOOK_URL || '';

function loadTokens() {
  if (!fs.existsSync(TOKENS_FILE)) return {};
  return JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8'));
}

function saveTokens(tokens) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
}

function newToken() {
  return crypto.randomBytes(24).toString('base64url');
}

// Bootstrap: create a first admin/unlock token if none exist yet.
function ensureInitialToken() {
  const tokens = loadTokens();
  if (Object.keys(tokens).length === 0) {
    const token = newToken();
    tokens[token] = { label: 'หลัก', createdAt: new Date().toISOString() };
    saveTokens(tokens);
    console.log('\n=== สร้าง token แรกให้แล้ว ===');
    console.log(`เปิดลิงก์นี้บนมือถือ (ครั้งแรกครั้งเดียว) เพื่อลงทะเบียนเครื่อง:`);
    console.log(`  http://<เครื่องเซิร์ฟเวอร์>:${PORT}/?t=${token}`);
    console.log('==============================\n');
  }
  return tokens;
}

function triggerDoor() {
  if (!DOOR_WEBHOOK_URL) {
    console.log('[unlock] โหมดจำลอง - ยังไม่ได้ตั้งค่า DOOR_WEBHOOK_URL ให้ต่อฮาร์ดแวร์จริง');
    return Promise.resolve({ simulated: true });
  }
  return new Promise((resolve) => {
    try {
      const target = new URL(DOOR_WEBHOOK_URL);
      const lib = target.protocol === 'https:' ? https : http;
      const req = lib.request(target, { method: 'POST', timeout: 5000 }, (res) => {
        resolve({ simulated: false, status: res.statusCode });
      });
      req.on('error', (err) => {
        console.error('[unlock] เรียก DOOR_WEBHOOK_URL ไม่สำเร็จ:', err.message);
        resolve({ simulated: false, error: err.message });
      });
      req.end();
    } catch (err) {
      console.error('[unlock] DOOR_WEBHOOK_URL ไม่ถูกต้อง:', err.message);
      resolve({ simulated: false, error: err.message });
    }
  });
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

function serveStatic(req, res, pathname) {
  const filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Not found');
    }
    const ext = path.extname(filePath);
    const type = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript' }[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': `${type}; charset=utf-8` });
    res.end(content);
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1e6) req.destroy();
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'POST' && url.pathname === '/api/unlock') {
    const raw = await readBody(req);
    let body;
    try {
      body = JSON.parse(raw || '{}');
    } catch {
      return sendJson(res, 400, { ok: false, error: 'invalid json' });
    }
    const tokens = loadTokens();
    const entry = tokens[body.token];
    if (!entry) {
      return sendJson(res, 401, { ok: false, error: 'unauthorized' });
    }
    const result = await triggerDoor();
    console.log(`[unlock] เปิดประตูโดย "${entry.label}" เวลา ${new Date().toISOString()}`);
    return sendJson(res, 200, { ok: true, label: entry.label, ...result });
  }

  if (req.method === 'POST' && url.pathname === '/api/enroll') {
    const raw = await readBody(req);
    let body;
    try {
      body = JSON.parse(raw || '{}');
    } catch {
      return sendJson(res, 400, { ok: false, error: 'invalid json' });
    }
    const tokens = loadTokens();
    if (!tokens[body.adminToken]) {
      return sendJson(res, 401, { ok: false, error: 'unauthorized' });
    }
    const label = (body.label || 'ไม่มีชื่อ').slice(0, 50);
    const token = newToken();
    tokens[token] = { label, createdAt: new Date().toISOString() };
    saveTokens(tokens);
    return sendJson(res, 200, { ok: true, token, label });
  }

  if (req.method === 'GET' && url.pathname === '/api/verify') {
    const tokens = loadTokens();
    const entry = tokens[url.searchParams.get('t')];
    return sendJson(res, 200, { ok: !!entry, label: entry ? entry.label : null });
  }

  if (req.method === 'GET') {
    return serveStatic(req, res, url.pathname);
  }

  res.writeHead(404);
  res.end('Not found');
});

ensureInitialToken();
server.listen(PORT, () => {
  console.log(`เซิร์ฟเวอร์เปิดประตูรันอยู่ที่ http://localhost:${PORT}`);
  if (!DOOR_WEBHOOK_URL) {
    console.log('หมายเหตุ: ยังไม่ได้ตั้งค่า DOOR_WEBHOOK_URL จึงทำงานเป็นโหมดจำลองอยู่');
  }
});
