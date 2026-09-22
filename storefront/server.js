// Storefront Web Server & Unified API Gateway (ARCH-1432)
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.STOREFRONT_PORT || 3000;

const SERVICE_MAP = {
  '/api/cart': 'http://localhost:3001/v1/cart',
  '/api/catalog': 'http://localhost:3002/v1/catalog',
  '/api/subscriptions': 'http://localhost:3003/v1/subscriptions',
  '/api/orders': 'http://localhost:3004/v1/orders'
};

const PUBLIC_DIR = path.join(__dirname, 'public');

function serveStaticFile(res, filePath, contentType = 'text/html') {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not Found');
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
}

// Forward request to microservices
async function proxyRequest(targetBaseUrl, pathSuffix, req, res) {
  const url = `${targetBaseUrl}${pathSuffix}`;

  return new Promise((resolve) => {
    let bodyChunks = [];
    req.on('data', chunk => bodyChunks.push(chunk));
    req.on('end', async () => {
      const bodyBuffer = Buffer.concat(bodyChunks);

      try {
        const fetchHeaders = {};
        for (const [k, v] of Object.entries(req.headers)) {
          if (['host', 'content-length'].includes(k.toLowerCase())) continue;
          fetchHeaders[k] = v;
        }

        const fetchOptions = {
          method: req.method,
          headers: fetchHeaders
        };

        if (['POST', 'PUT', 'PATCH'].includes(req.method) && bodyBuffer.length > 0) {
          fetchOptions.body = bodyBuffer;
        }

        const backendResponse = await fetch(url, fetchOptions);
        const data = await backendResponse.arrayBuffer();

        const responseHeaders = {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': backendResponse.headers.get('content-type') || 'application/json'
        };

        res.writeHead(backendResponse.status, responseHeaders);
        res.end(Buffer.from(data));
        resolve();
      } catch (err) {
        console.error(`Proxy Error forwarding to ${url}:`, err.message);
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'BAD_GATEWAY', message: err.message, target: url }));
        resolve();
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // Handle CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Idempotency-Key'
    });
    return res.end();
  }

  // Check API reverse proxies
  for (const [prefix, target] of Object.entries(SERVICE_MAP)) {
    if (pathname === prefix || pathname.startsWith(prefix + '/') || pathname.startsWith(prefix + '?')) {
      const suffix = pathname.slice(prefix.length) + parsedUrl.search;
      return await proxyRequest(target, suffix, req, res);
    }
  }

  // Health check
  if (pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'UP', service: 'storefront-pwa' }));
  }

  // Static files
  if (pathname === '/manifest.json') {
    return serveStaticFile(res, path.join(PUBLIC_DIR, 'manifest.json'), 'application/manifest+json');
  }
  if (pathname === '/sw.js') {
    return serveStaticFile(res, path.join(PUBLIC_DIR, 'sw.js'), 'application/javascript');
  }

  // Default to SPA index.html for all page routes
  return serveStaticFile(res, path.join(PUBLIC_DIR, 'index.html'), 'text/html');
});

server.listen(PORT, () => {
  console.log(`Aura Cosmetics Storefront & Gateway listening on port ${PORT}`);
});

module.exports = { server };
