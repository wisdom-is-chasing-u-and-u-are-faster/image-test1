#!/usr/bin/env python3
"""
Platform Launcher for Aura Cosmetics MACH Commerce Platform (ARCH-1427)
Starts all 4 backend microservices and the headless storefront gateway.
"""

import subprocess
import sys
import time
import os

SERVICES = [
    ("Cart Service (ARCH-1428)", "services/cart-service/src/server.js", 3001),
    ("Catalog Service (ARCH-1429)", "services/catalog-service/src/server.js", 3002),
    ("Subscription Service (ARCH-1430)", "services/subscription-service/src/server.js", 3003),
    ("Order Service (ARCH-1431)", "services/order-service/src/server.js", 3004),
    ("Storefront PWA & Gateway (ARCH-1432)", "storefront/server.js", 3000)
]

def main():
    print("=" * 60)
    print("   AURA COSMETICS - ENTERPRISE MACH PLATFORM (ARCH-1427)")
    print("=" * 60)
    procs = []

    try:
        for name, script, port in SERVICES:
            print(f"[*] Starting {name} on port {port}...")
            p = subprocess.Popen(["node", script], cwd=os.getcwd())
            procs.append(p)
            time.sleep(0.5)

        print("\n[+] All services successfully started!")
        print("    -> Storefront PWA Web App: http://localhost:3000")
        print("    -> Cart & Redlock API:     http://localhost:3001")
        print("    -> Catalog & Delta-E API:  http://localhost:3002")
        print("    -> Subscriptions API:      http://localhost:3003")
        print("    -> Order Checkout Saga:    http://localhost:3004")
        print("\nPress Ctrl+C to stop all services.")

        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping services...")
    finally:
        for p in procs:
            try:
                p.terminate()
            except Exception:
                pass
        print("Platform stopped cleanly.")

if __name__ == "__main__":
    main()
