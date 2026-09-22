// Automated Cosmetic Replenishment Subscriptions & Self-Service Regimen Portal (ARCH-1430)
const http = require('http');
const crypto = require('crypto');

const PORT = process.env.SUBSCRIPTION_PORT || 3003;

class SubscriptionStore {
  constructor() {
    this.subscriptions = new Map();
    this.dunningLogs = [];

    // Seed default subscription for Jane Doe (matches design wireframe account_subscriptions.html)
    this.seed({
      id: "sub_auraglow_001",
      customer_id: "cust_jane_doe",
      customer_name: "Jane Doe",
      customer_email: "jane.doe@example.com",
      product_id: "aura-glow-foundation",
      product_name: "Aura Glow Foundation",
      variant_id: "AB-FDN-130W",
      shade_name: "130W",
      quantity: 1,
      unit_price: 45.00,
      discount_percent: 15,
      discounted_price: 38.25,
      frequency_days: 60,
      status: "PAUSED",
      next_billing_date: "2026-10-01",
      created_at: "2026-08-01T10:00:00Z",
      consecutive_failed_payments: 0,
      dunning_step: 0
    });

    this.seed({
      id: "sub_lipstick_002",
      customer_id: "cust_jane_doe",
      customer_name: "Jane Doe",
      customer_email: "jane.doe@example.com",
      product_id: "matte-velvet-lipstick",
      product_name: "Matte Velvet Lipstick",
      variant_id: "LIP-VELVET-CRIMSON",
      shade_name: "Crimson",
      quantity: 1,
      unit_price: 28.00,
      discount_percent: 15,
      discounted_price: 23.80,
      frequency_days: 30,
      status: "ACTIVE",
      next_billing_date: "2026-10-15",
      created_at: "2026-08-15T12:00:00Z",
      consecutive_failed_payments: 0,
      dunning_step: 0
    });
  }

  seed(data) {
    this.subscriptions.set(data.id, data);
  }

  create(data) {
    const id = `sub_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const now = new Date();
    const frequency = data.frequency_days || 30;

    const nextBilling = new Date(now);
    nextBilling.setDate(nextBilling.getDate() + frequency);

    const unitPrice = data.unit_price || 45.00;
    const discount = 15;
    const discountedPrice = parseFloat((unitPrice * 0.85).toFixed(2));

    const sub = {
      id,
      customer_id: data.customer_id || "cust_guest",
      customer_name: data.customer_name || "Guest Customer",
      customer_email: data.customer_email || "guest@example.com",
      product_id: data.product_id || "aura-glow-foundation",
      product_name: data.product_name || "Aura Glow Foundation",
      variant_id: data.variant_id || "AB-FDN-100W",
      shade_name: data.shade_name || "100W",
      quantity: data.quantity || 1,
      unit_price: unitPrice,
      discount_percent: discount,
      discounted_price: discountedPrice,
      frequency_days: frequency,
      status: "ACTIVE",
      next_billing_date: nextBilling.toISOString().split('T')[0],
      created_at: now.toISOString(),
      consecutive_failed_payments: 0,
      dunning_step: 0
    };

    this.subscriptions.set(id, sub);
    return sub;
  }

  get(id) {
    return this.subscriptions.get(id) || null;
  }

  listByCustomer(customer_id) {
    return Array.from(this.subscriptions.values()).filter(s => !customer_id || s.customer_id === customer_id);
  }

  skip(id) {
    const sub = this.subscriptions.get(id);
    if (!sub) return null;

    const currentBilling = new Date(sub.next_billing_date);
    const newBilling = new Date(currentBilling);
    newBilling.setDate(newBilling.getDate() + sub.frequency_days);

    const prevDateStr = sub.next_billing_date;
    const newDateStr = newBilling.toISOString().split('T')[0];

    sub.next_billing_date = newDateStr;
    sub.status = "ACTIVE"; // remains active

    return {
      subscription_id: sub.id,
      status: sub.status,
      previous_billing_date: prevDateStr,
      next_billing_date: newDateStr,
      frequency_days: sub.frequency_days,
      message: `Delivery successfully skipped by ${sub.frequency_days} days`
    };
  }

  swap(id, new_variant_id, new_shade_name) {
    const sub = this.subscriptions.get(id);
    if (!sub) return null;

    const prevVariant = sub.variant_id;
    const prevShade = sub.shade_name;

    sub.variant_id = new_variant_id;
    sub.shade_name = new_shade_name || new_variant_id;

    return {
      subscription_id: sub.id,
      previous_variant_id: prevVariant,
      previous_shade: prevShade,
      current_variant_id: sub.variant_id,
      current_shade: sub.shade_name,
      status: sub.status,
      message: "Foundation shade swapped successfully for upcoming shipments"
    };
  }

  simulateDunningFailure(id, failureReason = "card_declined") {
    const sub = this.subscriptions.get(id);
    if (!sub) return null;

    sub.consecutive_failed_payments += 1;
    sub.dunning_step += 1;
    sub.status = "PAST_DUE";

    // Schedule retry: Day 1 (immediate), Day 3 (72h), Day 5, Day 7
    const retryDate = new Date();
    retryDate.setHours(retryDate.getHours() + 72); // 72 hours later

    const dunningEvent = {
      subscription_id: sub.id,
      failure_reason: failureReason,
      attempt_number: sub.consecutive_failed_payments,
      status: sub.status,
      next_retry_scheduled_at: retryDate.toISOString(),
      dunning_notification_dispatched: true,
      card_update_url: `https://aura-cosmetics.com/account/billing/update?sub=${sub.id}`,
      timestamp: new Date().toISOString()
    };

    if (sub.consecutive_failed_payments >= 4) {
      sub.status = "SUSPENDED";
      dunningEvent.status = "SUSPENDED";
      dunningEvent.message = "Maximum dunning retries reached. Subscription suspended.";
    }

    this.dunningLogs.push(dunningEvent);
    return { subscription: sub, dunning: dunningEvent };
  }
}

const store = new SubscriptionStore();

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  try {
    // Health Check
    if (pathname === '/health' && method === 'GET') {
      return sendJson(res, 200, { status: 'UP', service: 'subscription-service', count: store.subscriptions.size });
    }

    // POST /v1/subscriptions (Create)
    if (pathname === '/v1/subscriptions' && method === 'POST') {
      const body = await parseJsonBody(req);
      const sub = store.create(body);
      return sendJson(res, 201, sub);
    }

    // GET /v1/subscriptions (List)
    if (pathname === '/v1/subscriptions' && method === 'GET') {
      const customer_id = url.searchParams.get('customer_id');
      const list = store.listByCustomer(customer_id);
      return sendJson(res, 200, { subscriptions: list, total: list.length });
    }

    // POST /v1/subscriptions/:id/skip (ARCH-1430 Core Acceptance Criterion)
    if (pathname.match(/\/v1\/subscriptions\/[^\/]+\/skip/) && method === 'POST') {
      const parts = pathname.split('/');
      const id = parts[3];
      const result = store.skip(id);
      if (!result) {
        return sendJson(res, 404, { error: 'NOT_FOUND', message: `Subscription ${id} not found` });
      }
      return sendJson(res, 200, result);
    }

    // POST /v1/subscriptions/:id/swap (Shade Swapping)
    if (pathname.match(/\/v1\/subscriptions\/[^\/]+\/swap/) && method === 'POST') {
      const parts = pathname.split('/');
      const id = parts[3];
      const body = await parseJsonBody(req);
      const { new_variant_id, new_shade_name } = body;
      if (!new_variant_id) {
        return sendJson(res, 400, { error: 'BAD_REQUEST', message: 'new_variant_id is required' });
      }
      const result = store.swap(id, new_variant_id, new_shade_name);
      if (!result) {
        return sendJson(res, 404, { error: 'NOT_FOUND', message: `Subscription ${id} not found` });
      }
      return sendJson(res, 200, result);
    }

    // POST /v1/subscriptions/:id/dunning/simulate-failure (ARCH-1430 Dunning Lifecycle)
    if (pathname.match(/\/v1\/subscriptions\/[^\/]+\/dunning\/simulate-failure/) && method === 'POST') {
      const parts = pathname.split('/');
      const id = parts[3];
      const body = await parseJsonBody(req);
      const result = store.simulateDunningFailure(id, body.failure_reason || "card_declined");
      if (!result) {
        return sendJson(res, 404, { error: 'NOT_FOUND', message: `Subscription ${id} not found` });
      }
      return sendJson(res, 200, result);
    }

    // GET /v1/subscriptions/:id
    if (pathname.startsWith('/v1/subscriptions/') && method === 'GET') {
      const id = pathname.split('/')[3];
      const sub = store.get(id);
      if (!sub) {
        return sendJson(res, 404, { error: 'NOT_FOUND', message: `Subscription ${id} not found` });
      }
      return sendJson(res, 200, sub);
    }

    return sendJson(res, 404, { error: 'NOT_FOUND', path: pathname });
  } catch (err) {
    console.error('Subscription Service Error:', err);
    return sendJson(res, 500, { error: 'INTERNAL_ERROR', message: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`Replenishment & Subscription Service running on port ${PORT}`);
});

module.exports = { server, store };
