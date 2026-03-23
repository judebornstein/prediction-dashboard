const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const CONFIG_PATH = path.join(__dirname, 'telegram-config.json');

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

// ===== Telegram Config =====
function loadTelegramConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch {
    return { botToken: '', chatId: '' };
  }
}

function saveTelegramConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

function sendTelegramMessage(text) {
  return new Promise((resolve, reject) => {
    const config = loadTelegramConfig();
    if (!config.botToken || !config.chatId) {
      return reject(new Error('Telegram not configured'));
    }
    const payload = JSON.stringify({
      chat_id: config.chatId,
      text,
      parse_mode: 'HTML',
    });
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${config.botToken}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const body = JSON.parse(Buffer.concat(chunks).toString());
        if (body.ok) resolve(body);
        else reject(new Error(body.description || 'Telegram API error'));
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ===== Helper: read JSON body =====
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString()));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function jsonResponse(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// ===== Proxy =====
function proxyRequest(targetUrl, res) {
  https.get(targetUrl, proxyRes => {
    const chunks = [];
    proxyRes.on('data', chunk => chunks.push(chunk));
    proxyRes.on('end', () => {
      const body = Buffer.concat(chunks);
      res.writeHead(proxyRes.statusCode, {
        'Content-Type': proxyRes.headers['content-type'] || 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(body);
    });
  }).on('error', err => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  });
}

// ===== Server =====
const server = http.createServer(async (req, res) => {
  const parsed = new URL(req.url, `http://localhost:${PORT}`);

  // --- Telegram endpoints ---

  if (parsed.pathname === '/api/setup-telegram' && req.method === 'POST') {
    try {
      const { botToken, chatId } = await readBody(req);
      if (!botToken || !chatId) return jsonResponse(res, 400, { error: 'botToken and chatId are required' });
      saveTelegramConfig({ botToken, chatId });
      return jsonResponse(res, 200, { ok: true, message: 'Telegram config saved' });
    } catch (err) {
      return jsonResponse(res, 400, { error: err.message });
    }
  }

  if (parsed.pathname === '/api/get-telegram' && req.method === 'GET') {
    const config = loadTelegramConfig();
    return jsonResponse(res, 200, {
      configured: !!(config.botToken && config.chatId),
      chatId: config.chatId || '',
      botTokenSet: !!config.botToken,
    });
  }

  if (parsed.pathname === '/api/test-telegram' && req.method === 'POST') {
    try {
      await sendTelegramMessage('✅ Prediction Dashboard connected successfully!\n\nYou will receive whale signal alerts here.');
      return jsonResponse(res, 200, { ok: true, message: 'Test message sent' });
    } catch (err) {
      return jsonResponse(res, 500, { error: err.message });
    }
  }

  if (parsed.pathname === '/api/send-signal' && req.method === 'POST') {
    try {
      const { market, whaleCount, side, avgEntry } = await readBody(req);
      const text = [
        '🐋 <b>WHALE SIGNAL DETECTED</b>',
        '',
        `<b>Market:</b> ${market}`,
        `<b>Whales aligned:</b> ${whaleCount}`,
        `<b>Side:</b> ${side}`,
        `<b>Avg entry:</b> ${avgEntry}`,
        '',
        `<a href="http://localhost:3000">View dashboard</a>`,
      ].join('\n');
      await sendTelegramMessage(text);
      return jsonResponse(res, 200, { ok: true });
    } catch (err) {
      return jsonResponse(res, 500, { error: err.message });
    }
  }

  // --- Proxy routes ---

  if (parsed.pathname.startsWith('/api/odds/')) {
    const apiPath = parsed.pathname.replace('/api/odds/', '/v4/');
    const target = `https://api.the-odds-api.com${apiPath}${parsed.search || ''}`;
    return proxyRequest(target, res);
  }

  if (parsed.pathname.startsWith('/api/polymarket-data/')) {
    const apiPath = parsed.pathname.replace('/api/polymarket-data/', '/');
    const target = `https://data-api.polymarket.com${apiPath}${parsed.search || ''}`;
    return proxyRequest(target, res);
  }

  // --- Static files ---

  let filePath = parsed.pathname === '/' ? '/index.html' : parsed.pathname;
  filePath = path.join(__dirname, filePath);

  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Prediction Dashboard running at http://localhost:${PORT}`);
});
