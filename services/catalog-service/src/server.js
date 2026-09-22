// Catalog & Faceted Shade Matching Engine (ARCH-1429)
const http = require('http');
const { calculateDeltaE, calculateConfidence } = require('./color');
const { SHADES, PRODUCTS } = require('./catalog_data');

const PORT = process.env.CATALOG_PORT || 3002;
const HEX_REGEX = /^#[0-9a-fA-F]{6}$/;

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;
  const method = req.method;

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  try {
    // Health Check
    if (pathname === '/health' && method === 'GET') {
      return sendJson(res, 200, { status: 'UP', service: 'catalog-service', total_shades: SHADES.length });
    }

    // POST /v1/catalog/shades/match (ARCH-1429)
    if (pathname === '/v1/catalog/shades/match' && method === 'POST') {
      const body = await parseJsonBody(req);
      const { hex, undertone, finish, depth } = body;

      // 1. Validation: regex ^#[0-9a-fA-F]{6}$
      if (!hex || !HEX_REGEX.test(hex)) {
        return sendJson(res, 400, {
          error: 'INVALID_HEX_FORMAT',
          message: 'Hex color code must match ^#[0-9a-fA-F]{6}$'
        });
      }

      // 2. Compute Delta-E for all non-discontinued shades (or filter)
      let candidates = SHADES;

      // Optional filters
      if (undertone) {
        const u = undertone.toUpperCase();
        candidates = candidates.filter(s => s.undertone === u || !s.undertone);
      }
      if (finish) {
        const f = finish.toUpperCase();
        candidates = candidates.filter(s => s.finish === f || !s.finish);
      }
      if (depth) {
        const d = depth.toUpperCase();
        candidates = candidates.filter(s => s.depth === d || !s.depth);
      }

      // If filters are too restrictive, fallback to all shades
      if (candidates.length === 0) {
        candidates = SHADES;
      }

      // Rank by Delta-E
      const scored = candidates.map(shade => {
        const deltaE = calculateDeltaE(hex, shade.hex);
        const confidence = calculateConfidence(deltaE);
        return {
          ...shade,
          delta_e: parseFloat(deltaE.toFixed(2)),
          confidence_score: confidence
        };
      }).sort((a, b) => a.delta_e - b.delta_e);

      const bestMatch = scored[0];
      const recommendations = scored.slice(1, 4);

      // Check if best match is discontinued
      let discontinuedNotice = null;
      if (bestMatch.is_discontinued) {
        discontinuedNotice = {
          warning: "Selected shade is discontinued",
          active_equivalent: bestMatch.active_equivalent_variant_id,
          recommended_active_shade: bestMatch.recommended_active_shade
        };
      }

      return sendJson(res, 200, {
        query: { hex, undertone, finish, depth },
        best_match: {
          variant_id: bestMatch.variant_id,
          name: bestMatch.name,
          hex: bestMatch.hex,
          undertone: bestMatch.undertone,
          finish: bestMatch.finish,
          depth: bestMatch.depth,
          price: bestMatch.price,
          in_stock: bestMatch.in_stock,
          confidence_score: bestMatch.confidence_score,
          delta_e: bestMatch.delta_e,
          discontinued: !!bestMatch.is_discontinued,
          active_recommendation: bestMatch.recommended_active_shade || null
        },
        recommendations: recommendations.map(r => ({
          variant_id: r.variant_id,
          name: r.name,
          hex: r.hex,
          undertone: r.undertone,
          finish: r.finish,
          price: r.price,
          confidence_score: r.confidence_score
        })),
        discontinued_notice: discontinuedNotice
      });
    }

    // GET /v1/catalog/products
    if (pathname === '/v1/catalog/products' && method === 'GET') {
      const category = url.searchParams.get('category');
      const search = url.searchParams.get('search');
      let list = [...PRODUCTS];

      if (category) {
        list = list.filter(p => p.category.toLowerCase().includes(category.toLowerCase()));
      }
      if (search) {
        list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.tagline.toLowerCase().includes(search.toLowerCase()));
      }

      return sendJson(res, 200, { products: list, count: list.length });
    }

    // GET /v1/catalog/products/:id
    if (pathname.startsWith('/v1/catalog/products/') && method === 'GET') {
      const id = pathname.split('/')[4];
      const product = PRODUCTS.find(p => p.id === id);
      if (!product) {
        return sendJson(res, 404, { error: 'PRODUCT_NOT_FOUND', message: `Product ${id} not found` });
      }
      return sendJson(res, 200, product);
    }

    // GET /v1/catalog/shades
    if (pathname === '/v1/catalog/shades' && method === 'GET') {
      const undertone = url.searchParams.get('undertone');
      const finish = url.searchParams.get('finish');
      const depth = url.searchParams.get('depth');

      let list = [...SHADES];
      if (undertone) list = list.filter(s => s.undertone === undertone.toUpperCase());
      if (finish) list = list.filter(s => s.finish === finish.toUpperCase());
      if (depth) list = list.filter(s => s.depth === depth.toUpperCase());

      return sendJson(res, 200, { shades: list, total: list.length });
    }

    return sendJson(res, 404, { error: 'NOT_FOUND', path: pathname });
  } catch (err) {
    console.error('Catalog Service Error:', err);
    return sendJson(res, 500, { error: 'INTERNAL_ERROR', message: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`Catalog & Shade Matching Engine running on port ${PORT}`);
});

module.exports = { server };
