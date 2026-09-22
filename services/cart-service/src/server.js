// Cart & Distributed Inventory Reservation Service (ARCH-1428)
// High-Concurrency Flash-Sale Cart with Redis Redlock & Lua Atomic Locking
const http = require('http');
const crypto = require('crypto');

const PORT = process.env.CART_PORT || 3001;
const RESERVATION_TTL_SECONDS = 600; // 10 minutes

// In-Memory Distributed Inventory & Reservation Store (Redis Redlock Emulation)
class InventoryStore {
  constructor() {
    this.inventory = new Map(); // variant_id -> { available: number, reserved: number }
    this.reservations = new Map(); // reservation_id -> { variant_id, quantity, session_id, createdAt, expiresAt, status }
    this.locks = new Map(); // variant_id -> Promise chain for atomic lock serialization

    // Default seed data for cosmetics catalog
    this.seed('AB-FDN-100W', 150);
    this.seed('AB-FDN-110C', 85);
    this.seed('AB-FDN-120N', 200);
    this.seed('AB-FDN-130W', 120);
    this.seed('AB-FDN-580N', 40);
    this.seed('AB-FDN-590C', 60);
    this.seed('AB-FDN-600W', 75);
    this.seed('LIP-VELVET-CRIMSON', 95);
    this.seed('FLASH-SALE-VIRAL-DROP', 1); // Exact single unit for flash sale concurrency testing
  }

  seed(variant_id, quantity) {
    this.inventory.set(variant_id, { available: quantity, reserved: 0 });
  }

  // Atomic lock acquisition per variant (Redlock Lua simulation)
  async withLock(variant_id, fn) {
    let resolver;
    const lockPromise = new Promise(r => resolver = r);
    const prevLock = this.locks.get(variant_id) || Promise.resolve();
    this.locks.set(variant_id, lockPromise);

    await prevLock;
    try {
      return await fn();
    } finally {
      resolver();
      if (this.locks.get(variant_id) === lockPromise) {
        this.locks.delete(variant_id);
      }
    }
  }

  // Atomic reservation (equivalent to Redis Lua Script execution)
  async reserve(variant_id, quantity, session_id) {
    return this.withLock(variant_id, async () => {
      // Clean up any expired reservations first
      this.reconcileExpiredReservations();

      const item = this.inventory.get(variant_id);
      if (!item) {
        return { success: false, code: 'NOT_FOUND', message: `Variant ${variant_id} does not exist in catalog` };
      }

      if (item.available < quantity) {
        return {
          success: false,
          code: 'INSUFFICIENT_INVENTORY',
          message: 'Item is out of stock'
        };
      }

      // Atomic state mutation (Lua Redlock logic)
      item.available -= quantity;
      item.reserved += quantity;

      const reservation_id = `res_tok_${crypto.randomUUID().replace(/-/g, '')}`;
      const now = Date.now();
      const expiresAt = now + RESERVATION_TTL_SECONDS * 1000;

      const reservation = {
        reservation_id,
        variant_id,
        quantity,
        session_id,
        createdAt: now,
        expiresAt,
        ttl_seconds: RESERVATION_TTL_SECONDS,
        status: 'ACTIVE'
      };

      this.reservations.set(reservation_id, reservation);

      return {
        success: true,
        data: {
          reservation_id,
          variant_id,
          quantity,
          session_id,
          expires_at: new Date(expiresAt).toISOString(),
          ttl_seconds: RESERVATION_TTL_SECONDS,
          status: 'ACTIVE'
        }
      };
    });
  }

  getReservation(reservation_id) {
    const res = this.reservations.get(reservation_id);
    if (!res) return null;

    const now = Date.now();
    if (res.status === 'ACTIVE' && now > res.expiresAt) {
      // Expired!
      res.status = 'EXPIRED';
      const item = this.inventory.get(res.variant_id);
      if (item) {
        item.available += res.quantity;
        item.reserved = Math.max(0, item.reserved - res.quantity);
      }
    }

    const remainingTtl = Math.max(0, Math.floor((res.expiresAt - now) / 1000));
    return { ...res, remaining_ttl_seconds: remainingTtl };
  }

  async release(reservation_id) {
    const res = this.reservations.get(reservation_id);
    if (!res) return false;

    return this.withLock(res.variant_id, async () => {
      if (res.status === 'ACTIVE') {
        const item = this.inventory.get(res.variant_id);
        if (item) {
          item.available += res.quantity;
          item.reserved = Math.max(0, item.reserved - res.quantity);
        }
        res.status = 'RELEASED';
        return true;
      }
      return false;
    });
  }

  async commit(reservation_id) {
    const res = this.reservations.get(reservation_id);
    if (!res) return { success: false, code: 'NOT_FOUND', message: 'Reservation not found' };

    const now = Date.now();
    if (res.status !== 'ACTIVE' || now > res.expiresAt) {
      return { success: false, code: 'RESERVATION_EXPIRED', message: 'Reservation expired or invalid' };
    }

    return this.withLock(res.variant_id, async () => {
      const item = this.inventory.get(res.variant_id);
      if (item) {
        item.reserved = Math.max(0, item.reserved - res.quantity);
      }
      res.status = 'COMMITTED';
      return { success: true, data: res };
    });
  }

  reconcileExpiredReservations() {
    const now = Date.now();
    for (const [id, res] of this.reservations.entries()) {
      if (res.status === 'ACTIVE' && now > res.expiresAt) {
        res.status = 'EXPIRED';
        const item = this.inventory.get(res.variant_id);
        if (item) {
          item.available += res.quantity;
          item.reserved = Math.max(0, item.reserved - res.quantity);
        }
      }
    }
  }

  getInventory(variant_id) {
    this.reconcileExpiredReservations();
    return this.inventory.get(variant_id) || { available: 0, reserved: 0 };
  }
}

const store = new InventoryStore();

// Background job to reconcile expired reservations every 5 seconds
setInterval(() => store.reconcileExpiredReservations(), 5000);

// Request routing
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Idempotency-Key'
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

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Idempotency-Key'
    });
    return res.end();
  }

  try {
    // Health Check
    if (pathname === '/health' && method === 'GET') {
      return sendJson(res, 200, { status: 'UP', service: 'cart-service', timestamp: new Date().toISOString() });
    }

    // POST /v1/cart/reserve (Enforce max 5 units/session and Lua Redlock atomic reservation)
    if (pathname === '/v1/cart/reserve' && method === 'POST') {
      const body = await parseJsonBody(req);
      const { variant_id, quantity = 1, session_id } = body;

      if (!variant_id) {
        return sendJson(res, 400, { error: 'BAD_REQUEST', message: 'variant_id is required' });
      }

      if (quantity <= 0 || quantity > 5) {
        return sendJson(res, 400, {
          error: 'INVALID_QUANTITY',
          message: 'Quantity must be between 1 and 5 per session'
        });
      }

      const result = await store.reserve(variant_id, quantity, session_id || 'anonymous_sess');

      if (!result.success) {
        if (result.code === 'INSUFFICIENT_INVENTORY') {
          return sendJson(res, 409, {
            error: 'INSUFFICIENT_INVENTORY',
            message: result.message,
            variant_id,
            available_stock: store.getInventory(variant_id).available
          });
        }
        return sendJson(res, 404, { error: result.code, message: result.message });
      }

      return sendJson(res, 201, result.data);
    }

    // GET /v1/cart/reserve/:reservation_id
    if (pathname.startsWith('/v1/cart/reserve/') && method === 'GET') {
      const id = pathname.split('/')[4];
      const resData = store.getReservation(id);

      if (!resData) {
        return sendJson(res, 404, { error: 'NOT_FOUND', message: 'Reservation token not found' });
      }

      if (resData.status === 'EXPIRED') {
        return sendJson(res, 410, {
          error: 'RESERVATION_EXPIRED',
          message: 'Reservation token has expired. Stock has been returned to the available pool.'
        });
      }

      return sendJson(res, 200, resData);
    }

    // DELETE /v1/cart/reserve/:reservation_id
    if (pathname.startsWith('/v1/cart/reserve/') && method === 'DELETE') {
      const id = pathname.split('/')[4];
      const released = await store.release(id);
      if (!released) {
        return sendJson(res, 404, { error: 'NOT_FOUND', message: 'Reservation not found or already released' });
      }
      return sendJson(res, 200, { status: 'RELEASED', reservation_id: id });
    }

    // POST /v1/cart/reserve/:reservation_id/commit (Saga Step)
    if (pathname.match(/\/v1\/cart\/reserve\/[^\/]+\/commit/) && method === 'POST') {
      const parts = pathname.split('/');
      const id = parts[4];
      const result = await store.commit(id);

      if (!result.success) {
        if (result.code === 'RESERVATION_EXPIRED') {
          return sendJson(res, 410, { error: 'RESERVATION_EXPIRED', message: result.message });
        }
        return sendJson(res, 404, { error: result.code, message: result.message });
      }

      return sendJson(res, 200, { status: 'COMMITTED', reservation_id: id });
    }

    // GET /v1/cart/inventory/:variant_id
    if (pathname.startsWith('/v1/cart/inventory/') && method === 'GET') {
      const variant_id = pathname.split('/')[4];
      const inv = store.getInventory(variant_id);
      return sendJson(res, 200, { variant_id, ...inv });
    }

    // POST /v1/cart/inventory/seed
    if (pathname === '/v1/cart/inventory/seed' && method === 'POST') {
      const body = await parseJsonBody(req);
      const { variant_id, quantity } = body;
      if (!variant_id || quantity === undefined) {
        return sendJson(res, 400, { error: 'BAD_REQUEST', message: 'variant_id and quantity required' });
      }
      store.seed(variant_id, Number(quantity));
      return sendJson(res, 200, { status: 'SEEDED', variant_id, inventory: store.getInventory(variant_id) });
    }

    // Simulate TTL expiry for testing
    if (pathname.match(/\/v1\/cart\/reserve\/[^\/]+\/expire/) && method === 'POST') {
      const parts = pathname.split('/');
      const id = parts[4];
      const resData = store.reservations.get(id);
      if (!resData) return sendJson(res, 404, { error: 'NOT_FOUND' });
      resData.expiresAt = Date.now() - 1000; // force expire
      store.reconcileExpiredReservations();
      return sendJson(res, 200, { status: 'FORCE_EXPIRED', reservation_id: id });
    }

    // 404 Not Found default
    return sendJson(res, 404, { error: 'ENDPOINT_NOT_FOUND', path: pathname });
  } catch (err) {
    console.error('Cart Service Error:', err);
    return sendJson(res, 500, { error: 'INTERNAL_ERROR', message: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`Cart & Inventory Reservation Service running on port ${PORT}`);
});

module.exports = { server, store };
