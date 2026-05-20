const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

const PORT = Number(process.env.PORT || 4173);
const ROOT = __dirname;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

const server = http.createServer(async (request, response) => {
  try {
    if (request.method === 'POST' && request.url === '/api/check-link') {
      await handleCheckLink(request, response);
      return;
    }

    if (request.method !== 'GET') {
      sendJson(response, 405, { error: 'Method not allowed' });
      return;
    }

    const url = new URL(request.url, `http://${request.headers.host}`);
    const requestedPath = url.pathname === '/' ? '/index.html' : url.pathname;
    const filePath = path.normalize(path.join(ROOT, requestedPath));

    if (!filePath.startsWith(ROOT)) {
      sendJson(response, 403, { error: 'Forbidden' });
      return;
    }

    const ext = path.extname(filePath);
    const file = await fs.readFile(filePath);
    response.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    response.end(file);
  } catch (error) {
    if (error.code === 'ENOENT') {
      sendJson(response, 404, { error: 'Not found' });
      return;
    }
    sendJson(response, 500, { error: error.message });
  }
});

async function handleCheckLink(request, response) {
  const body = await readBody(request);
  const { liveUrl, targetUrl } = JSON.parse(body || '{}');

  if (!isHttpUrl(liveUrl) || !isHttpUrl(targetUrl)) {
    sendJson(response, 400, { error: 'Both URLs must start with http:// or https://' });
    return;
  }

  const fetchResponse = await fetch(liveUrl, {
    redirect: 'follow',
    headers: {
      'User-Agent': 'BacklinkDesk/1.0 (+local backlink checker)'
    }
  });

  if (!fetchResponse.ok) {
    sendJson(response, 200, {
      found: false,
      statusCode: fetchResponse.status,
      error: `Page returned ${fetchResponse.status}`
    });
    return;
  }

  const html = await fetchResponse.text();
  const link = findLink(html, targetUrl);
  sendJson(response, 200, {
    found: link.found,
    nofollow: link.nofollow,
    statusCode: fetchResponse.status
  });
}

function findLink(html, targetUrl) {
  const normalizedTarget = normalizeUrl(targetUrl);
  const hrefRegex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi;
  let match;

  while ((match = hrefRegex.exec(html)) !== null) {
    if (normalizeUrl(match[1]) === normalizedTarget) {
      return {
        found: true,
        nofollow: /rel=["'][^"']*nofollow[^"']*["']/i.test(match[0])
      };
    }
  }

  return { found: false, nofollow: false };
}

function normalizeUrl(value) {
  return String(value || '')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/$/, '');
}

function isHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        request.destroy();
        reject(new Error('Request too large'));
      }
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

function sendJson(response, status, payload) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

server.listen(PORT, () => {
  console.log(`Backlink Desk running at http://localhost:${PORT}`);
});
