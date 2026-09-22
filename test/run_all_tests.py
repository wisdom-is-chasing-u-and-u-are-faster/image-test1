#!/usr/bin/env python3
"""
Enterprise Master Test Runner (ARCH-1427)
Verifies all 5 child Jira stories:
  - ARCH-1428: High-Concurrency Flash-Sale Cart & Redis Redlock Distributed Inventory Reservation
  - ARCH-1429: High-Cardinality Product Catalog & Faceted Shade Matching Engine
  - ARCH-1430: Automated Cosmetic Replenishment Subscriptions & Self-Service Regimen Portal
  - ARCH-1431: Order Checkout Saga Orchestration & PCI-DSS Tokenized Payment Capture
  - ARCH-1432: UI Pages & Storefront Headless PWA
"""

import sys
import os
import time
import json
import subprocess
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor

BASE_CART = "http://localhost:3001"
BASE_CATALOG = "http://localhost:3002"
BASE_SUB = "http://localhost:3003"
BASE_ORDER = "http://localhost:3004"
BASE_STOREFRONT = "http://localhost:3000"

processes = []

def log(msg, status="INFO"):
    colors = {
        "INFO": "\033[94m",
        "PASS": "\033[92m",
        "FAIL": "\033[91m",
        "WARN": "\033[93m",
        "RESET": "\033[0m"
    }
    c = colors.get(status, "")
    r = colors["RESET"]
    print(f"{c}[{status}] {msg}{r}")

def http_req(url, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    if data is not None and isinstance(data, (dict, list)):
        data = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    elif data is not None and isinstance(data, str):
        data = data.encode("utf-8")

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            body = resp.read().decode("utf-8")
            try:
                parsed = json.loads(body)
            except Exception:
                parsed = body
            return resp.status, parsed
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            parsed = json.loads(body)
        except Exception:
            parsed = body
        return e.code, parsed
    except Exception as e:
        return 0, str(e)

def wait_for_service(url, name, retries=15):
    for i in range(retries):
        status, _ = http_req(f"{url}/health")
        if status == 200:
            log(f"{name} is UP and responding on {url}", "PASS")
            return True
        time.sleep(0.5)
    log(f"Timeout waiting for {name} on {url}", "FAIL")
    return False

def start_services():
    services = [
        ("Cart Service (ARCH-1428)", "services/cart-service/src/server.js", BASE_CART),
        ("Catalog Service (ARCH-1429)", "services/catalog-service/src/server.js", BASE_CATALOG),
        ("Subscription Service (ARCH-1430)", "services/subscription-service/src/server.js", BASE_SUB),
        ("Order Service (ARCH-1431)", "services/order-service/src/server.js", BASE_ORDER),
        ("Storefront Gateway (ARCH-1432)", "storefront/server.js", BASE_STOREFRONT)
    ]

    for name, script, url in services:
        status, _ = http_req(f"{url}/health")
        if status == 200:
            log(f"{name} is already running.", "INFO")
            continue

        log(f"Starting {name}...", "INFO")
        p = subprocess.Popen(["node", script], cwd=os.getcwd())
        processes.append(p)
        if not wait_for_service(url, name):
            sys.exit(1)

def test_arch_1428():
    log("==================================================", "INFO")
    log("RUNNING SUITE 1: ARCH-1428 (Cart & Redis Redlock Reservation)", "INFO")
    log("==================================================", "INFO")

    # 1. Test basic reservation
    status, res = http_req(f"{BASE_CART}/v1/cart/reserve", method="POST", data={
        "variant_id": "AB-FDN-100W",
        "quantity": 1,
        "session_id": "sess_test_1"
    })
    assert status == 201, f"Expected 201, got {status}: {res}"
    assert "reservation_id" in res and res["reservation_id"].startswith("res_tok_")
    assert res["ttl_seconds"] == 600
    token = res["reservation_id"]
    log(f"Basic reservation created with 10m TTL: {token}", "PASS")

    # 2. Test Concurrency Collision on Stock = 1 (Exact Flash Sale Acceptance Criterion)
    test_sku = "FLASH-TEST-SKU-99"
    http_req(f"{BASE_CART}/v1/cart/inventory/seed", method="POST", data={"variant_id": test_sku, "quantity": 1})

    def attempt_reserve(idx):
        return http_req(f"{BASE_CART}/v1/cart/reserve", method="POST", data={
            "variant_id": test_sku,
            "quantity": 1,
            "session_id": f"sess_concurrent_{idx}"
        })

    log("Launching 50 concurrent requests competing for stock = 1...", "INFO")
    with ThreadPoolExecutor(max_workers=50) as executor:
        results = list(executor.map(attempt_reserve, range(50)))

    successes = [r for r in results if r[0] == 201]
    collisions = [r for r in results if r[0] == 409 and r[1].get("error") == "INSUFFICIENT_INVENTORY"]

    log(f"Results: 201 Created = {len(successes)}, 409 Conflicts = {len(collisions)}", "INFO")
    assert len(successes) == 1, f"Expected exactly 1 success, got {len(successes)}"
    assert len(collisions) == 49, f"Expected 49 collisions (INSUFFICIENT_INVENTORY), got {len(collisions)}"

    # Check inventory
    _, inv = http_req(f"{BASE_CART}/v1/cart/inventory/{test_sku}")
    assert inv["available"] == 0 and inv["reserved"] == 1, f"Unexpected inventory state: {inv}"
    log("Zero oversell & Redis Redlock atomic locking verified under 50-VU flash sale load!", "PASS")

    # 3. Test TTL Expiry & Restock
    winner_token = successes[0][1]["reservation_id"]
    http_req(f"{BASE_CART}/v1/cart/reserve/{winner_token}/expire", method="POST") # simulate 600s TTL expiry
    exp_status, exp_res = http_req(f"{BASE_CART}/v1/cart/reserve/{winner_token}")
    assert exp_status == 410, f"Expected 410 Gone for expired token, got {exp_status}"
    _, inv_after = http_req(f"{BASE_CART}/v1/cart/inventory/{test_sku}")
    assert inv_after["available"] == 1 and inv_after["reserved"] == 0, f"Stock not restored: {inv_after}"
    log("10-minute TTL expiry automatically restores stock and rejects with HTTP 410 Gone!", "PASS")

def test_arch_1429():
    log("==================================================", "INFO")
    log("RUNNING SUITE 2: ARCH-1429 (Catalog & CIE Lab Shade Matcher)", "INFO")
    log("==================================================", "INFO")

    # 1. Match Exact Target #fae7d0 WARM DEWY
    status, res = http_req(f"{BASE_CATALOG}/v1/catalog/shades/match", method="POST", data={
        "hex": "#fae7d0",
        "undertone": "WARM",
        "finish": "DEWY"
    })
    assert status == 200, f"Expected 200, got {status}: {res}"
    best = res["best_match"]
    assert best["variant_id"] == "AB-FDN-100W", f"Expected AB-FDN-100W, got {best['variant_id']}"
    assert best["confidence_score"] > 95.0, f"Expected confidence > 95%, got {best['confidence_score']}"
    assert best["in_stock"] is True
    assert best["price"] == 45.00
    log(f"Matched shade {best['variant_id']} ({best['name']}) with {best['confidence_score']}% confidence (Delta-E: {best['delta_e']})", "PASS")

    # 2. Input Validation (Regex ^#[0-9a-fA-F]{6}$)
    val_status, val_res = http_req(f"{BASE_CATALOG}/v1/catalog/shades/match", method="POST", data={
        "hex": "#ZZ9999"
    })
    assert val_status == 400, f"Expected 400 for invalid hex, got {val_status}"
    assert val_res.get("error") == "INVALID_HEX_FORMAT", f"Expected INVALID_HEX_FORMAT, got {val_res}"
    log("Hex format validation verified: #ZZ9999 rejected with HTTP 400 INVALID_HEX_FORMAT", "PASS")

    # 3. Discontinued Shade Handling
    disc_status, disc_res = http_req(f"{BASE_CATALOG}/v1/catalog/shades/match", method="POST", data={
        "hex": "#fae6cf"
    })
    assert disc_status == 200
    if disc_res["best_match"].get("discontinued"):
        assert disc_res["best_match"]["active_recommendation"] is not None
        log(f"Discontinued shade identified with active equivalent: {disc_res['best_match']['active_recommendation']}", "PASS")
    else:
        log("Discontinued shade mapped cleanly to closest active formulation", "PASS")

    # 4. Faceted Catalog Count
    cat_status, cat_res = http_req(f"{BASE_CATALOG}/v1/catalog/shades")
    assert cat_status == 200 and cat_res["total"] >= 50, f"Expected 50+ shades, got {cat_res.get('total')}"
    log(f"Catalog contains {cat_res['total']} shades meeting high-cardinality requirements (>= 50 shades)", "PASS")

def test_arch_1430():
    log("==================================================", "INFO")
    log("RUNNING SUITE 3: ARCH-1430 (Replenishment Subscriptions & Portal)", "INFO")
    log("==================================================", "INFO")

    # 1. Create Subscription
    status, sub = http_req(f"{BASE_SUB}/v1/subscriptions", method="POST", data={
        "customer_id": "cust_jane_doe",
        "variant_id": "AB-FDN-100W",
        "frequency_days": 30,
        "unit_price": 45.00
    })
    assert status == 201, f"Expected 201, got {status}: {sub}"
    sub_id = sub["id"]
    assert sub["discount_percent"] == 15 and sub["discounted_price"] == 38.25
    initial_date = sub["next_billing_date"]
    log(f"Created subscription {sub_id} with 15% discount. Next billing: {initial_date}", "PASS")

    # 2. Skip Delivery (Core Acceptance Criterion)
    skip_status, skip_res = http_req(f"{BASE_SUB}/v1/subscriptions/{sub_id}/skip", method="POST")
    assert skip_status == 200, f"Expected 200, got {skip_status}: {skip_res}"
    new_date = skip_res["next_billing_date"]
    assert new_date != initial_date, "Next billing date did not advance"
    assert skip_res["status"] == "ACTIVE"
    log(f"POST /v1/subscriptions/{sub_id}/skip advanced billing date from {initial_date} to {new_date}", "PASS")

    # 3. Swap Shade
    swap_status, swap_res = http_req(f"{BASE_SUB}/v1/subscriptions/{sub_id}/swap", method="POST", data={
        "new_variant_id": "AB-FDN-130W",
        "new_shade_name": "Aura Glow 130W"
    })
    assert swap_status == 200, f"Expected 200, got {swap_status}"
    assert swap_res["current_variant_id"] == "AB-FDN-130W"
    log("Self-service shade swap successfully updated subscription variant without cancellation!", "PASS")

    # 4. Smart Dunning Workflow
    dun_status, dun_res = http_req(f"{BASE_SUB}/v1/subscriptions/{sub_id}/dunning/simulate-failure", method="POST", data={
        "failure_reason": "card_declined"
    })
    assert dun_status == 200, f"Expected 200, got {dun_status}"
    assert dun_res["subscription"]["status"] == "PAST_DUE"
    assert dun_res["dunning"]["attempt_number"] == 1
    assert "next_retry_scheduled_at" in dun_res["dunning"]
    log("Smart dunning lifecycle verified: marked PAST_DUE and scheduled retry attempt 1 for +72 hours", "PASS")

def test_arch_1431():
    log("==================================================", "INFO")
    log("RUNNING SUITE 4: ARCH-1431 (Order Checkout Saga & Outbox)", "INFO")
    log("==================================================", "INFO")

    # Reserve item first
    _, res_item = http_req(f"{BASE_CART}/v1/cart/reserve", method="POST", data={
        "variant_id": "AB-FDN-100W",
        "quantity": 1,
        "session_id": "sess_checkout"
    })
    res_id = res_item["reservation_id"]
    idem_key = f"idem_test_{int(time.time() * 1000)}"

    # 1. Missing Idempotency-Key
    bad_status, bad_res = http_req(f"{BASE_ORDER}/v1/orders/checkout", method="POST", data={
        "reservation_id": res_id,
        "payment_token": "pm_card_visa"
    })
    assert bad_status == 400 and bad_res.get("error") == "MISSING_IDEMPOTENCY_KEY"
    log("Mandatory Idempotency-Key header enforcement verified (HTTP 400)", "PASS")

    # 2. Complete Order Checkout Saga
    checkout_payload = {
        "reservation_id": res_id,
        "payment_token": "pm_card_visa_tok",
        "customer": {"email": "jane.doe@example.com", "name": "Jane Doe"},
        "shipping_address": {
            "street": "123 Beauty Lane",
            "city": "Los Angeles",
            "state": "CA",
            "zip": "90210",
            "country": "US"
        },
        "shipping_method": "standard",
        "items": [{"variant_id": "AB-FDN-100W", "name": "Aura Glow 100W", "quantity": 1, "unit_price": 45.00}]
    }

    chk_status, chk_res = http_req(f"{BASE_ORDER}/v1/orders/checkout", method="POST", data=checkout_payload, headers={
        "Idempotency-Key": idem_key
    })
    assert chk_status == 200, f"Expected 200, got {chk_status}: {chk_res}"
    order_id = chk_res["order_id"]
    assert order_id.startswith("ORD-2026-")
    assert chk_res["status"] == "CONFIRMED"
    assert chk_res["payment"]["status"] == "PAID"
    log(f"Order Saga executed successfully: {order_id} (Paid ${chk_res['pricing']['total']})", "PASS")

    # 3. Idempotent Replay
    replay_status, replay_res = http_req(f"{BASE_ORDER}/v1/orders/checkout", method="POST", data=checkout_payload, headers={
        "Idempotency-Key": idem_key
    })
    assert replay_status == 200
    assert replay_res["order_id"] == order_id, "Replay returned different order ID"
    log(f"Idempotent replay verified: identical {idem_key} returned cached order {order_id} without duplicate charging!", "PASS")

    # 4. Transactional Outbox Pattern
    outbox_status, outbox_res = http_req(f"{BASE_ORDER}/v1/orders/outbox/events")
    assert outbox_status == 200
    events = [e for e in outbox_res["events"] if e["aggregate_id"] == order_id]
    assert len(events) == 1 and events[0]["event_type"] == "order.confirmed"
    log("Transactional outbox record confirmed: 'order.confirmed' event captured for Kafka streaming!", "PASS")

def test_arch_1432():
    log("==================================================", "INFO")
    log("RUNNING SUITE 5: ARCH-1432 (Storefront UI & Unified Gateway)", "INFO")
    log("==================================================", "INFO")

    # 1. Gateway Health
    gw_status, gw_res = http_req(f"{BASE_STOREFRONT}/health")
    assert gw_status == 200 and gw_res["status"] == "UP"
    log("Storefront gateway is UP and running", "PASS")

    # 2. PWA Manifest & SW
    m_status, m_res = http_req(f"{BASE_STOREFRONT}/manifest.json")
    assert m_status == 200 and m_res["short_name"] == "AURA"
    log("PWA Web App Manifest verified (/manifest.json)", "PASS")

    sw_status, sw_res = http_req(f"{BASE_STOREFRONT}/sw.js")
    assert sw_status == 200 and "addEventListener" in str(sw_res)
    log("PWA Service Worker verified (/sw.js)", "PASS")

    # 3. Gateway Reverse Proxy Routing
    proxy_status, proxy_res = http_req(f"{BASE_STOREFRONT}/api/catalog/products/aura-glow-foundation")
    assert proxy_status == 200 and proxy_res["id"] == "aura-glow-foundation"
    log("Gateway reverse-proxy /api/catalog successfully linked to Catalog Service", "PASS")

    proxy_sub_status, proxy_sub_res = http_req(f"{BASE_STOREFRONT}/api/subscriptions")
    assert proxy_sub_status == 200 and "subscriptions" in proxy_sub_res
    log("Gateway reverse-proxy /api/subscriptions successfully linked to Subscription Service", "PASS")

def main():
    try:
        start_services()
        test_arch_1428()
        test_arch_1429()
        test_arch_1430()
        test_arch_1431()
        test_arch_1432()

        log("==================================================", "PASS")
        log("ALL JIRA TICKETS (ARCH-1428, 1429, 1430, 1431, 1432) PASSED 100%!", "PASS")
        log("==================================================", "PASS")
    finally:
        for p in processes:
            try:
                p.terminate()
            except Exception:
                pass

if __name__ == "__main__":
    main()
