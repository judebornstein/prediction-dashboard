const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

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

const server = http.createServer((req, res) => {
  const parsed = new URL(req.url, `http://localhost:${PORT}`);

  // Proxy: /api/odds/* -> api.the-odds-api.com/v4/*
  if (parsed.pathname.startsWith('/api/odds/')) {
    const apiPath = parsed.pathname.replace('/api/odds/', '/v4/');
    const target = `https://api.the-odds-api.com${apiPath}${parsed.search || ''}`;
    return proxyRequest(target, res);
  }

  // Proxy: /api/polymarket-data/* -> data-api.polymarket.com/*
  if (parsed.pathname.startsWith('/api/polymarket-data/')) {
    const apiPath = parsed.pathname.replace('/api/polymarket-data/', '/');
    const target = `https://data-api.polymarket.com${apiPath}${parsed.search || ''}`;
    return proxyRequest(target, res);
  }

  // Static files
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
