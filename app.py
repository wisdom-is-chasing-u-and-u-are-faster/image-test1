from typing import Dict, Any, List, Tuple
from flask import Flask, render_template, jsonify, request, Response

app = Flask(__name__)

# In-memory configuration & state store for Security Dashboard
rate_limit_config: Dict[str, Any] = {
    "default_threshold": 1000,
    "burst_limit": 1500,
    "redis_host": "redis-cluster.internal",
    "policy": "sliding-window",
    "updated_at": "2026-08-11T12:00:00Z"
}

mainframe_pool_state: Dict[str, Any] = {
    "total_connections": 50,
    "active_connections": 12,
    "idle_connections": 38,
    "mtls_status": "ENABLED_TLS1_3",
    "health_status": "HEALTHY",
    "latency_ms": 3.2
}

reconciliation_records: List[Dict[str, Any]] = [
    {
        "batch_id": "BATCH-20260811-001",
        "status": "PASSED",
        "total_records": 45000,
        "mismatched_records": 0,
        "verified_at": "2026-08-11T11:45:00Z",
        "hash_chain_verified": True
    },
    {
        "batch_id": "BATCH-20260811-002",
        "status": "PASSED",
        "total_records": 48200,
        "mismatched_records": 0,
        "verified_at": "2026-08-11T11:50:00Z",
        "hash_chain_verified": True
    }
]


# Web View Routes
@app.route("/")
def index() -> str:
    """Render main index dashboard."""
    return render_template("index.html")


@app.route("/main-dashboard")
def main_dashboard() -> str:
    """AC: The UI must provide a dashboard to visualize rate-limiting and autoscaling behavior."""
    return render_template("main-dashboard.html")


@app.route("/rate-limiting")
def rate_limiting_page() -> str:
    """AC: The UI must allow users to configure rate-limiting thresholds."""
    return render_template("rate-limiting.html")


@app.route("/audit-log-reconciliation")
def audit_log_reconciliation_page() -> str:
    """AC: The UI must allow users to view the results of the audit log reconciliation."""
    return render_template("audit-log-reconciliation.html")


@app.route("/upstream-services")
def upstream_services_page() -> str:
    """AC: The UI must display the status of the mainframe connection pool."""
    return render_template("upstream-services.html")


@app.route("/security-events")
def security_events_page() -> str:
    """Render security events overview."""
    return render_template("security-events.html")


# REST API Endpoints
@app.route("/api/metrics/autoscaling", methods=["GET"])
def get_autoscaling_metrics() -> Response:
    """
    AC: The UI must provide a dashboard to visualize rate-limiting and autoscaling behavior.
    Returns real-time rate limiting and HorizontalPodAutoscaler metrics.
    """
    metrics = {
        "rate_limiting": {
            "current_rps": 850,
            "threshold_rps": rate_limit_config["default_threshold"],
            "dropped_requests": 0,
            "blocked_ips": 3
        },
        "autoscaling": {
            "target_cpu_percent": 70,
            "current_cpu_percent": 45,
            "min_replicas": 3,
            "max_replicas": 15,
            "current_replicas": 5
        }
    }
    return jsonify(metrics)


@app.route("/api/audit-log/reconciliation", methods=["GET"])
def get_audit_log_reconciliation() -> Response:
    """
    AC: The UI must allow users to view the results of the audit log reconciliation.
    Returns reconciliation test results and verification logs.
    """
    return jsonify({
        "status": "SUCCESS",
        "total_batches": len(reconciliation_records),
        "results": reconciliation_records
    })


@app.route("/api/rate-limiting/config", methods=["GET", "POST"])
def manage_rate_limiting_config() -> Tuple[Response, int]:
    """
    AC: The UI must allow users to configure rate-limiting thresholds.
    Handles getting and updating rate limiting configurations.
    """
    if request.method == "POST":
        data = request.get_json() or {}
        if "default_threshold" in data:
            rate_limit_config["default_threshold"] = int(data["default_threshold"])
        if "burst_limit" in data:
            rate_limit_config["burst_limit"] = int(data["burst_limit"])
        if "policy" in data:
            rate_limit_config["policy"] = str(data["policy"])
        return jsonify({
            "message": "Rate limiting configuration updated successfully",
            "config": rate_limit_config
        }), 200

    return jsonify(rate_limit_config), 200


@app.route("/api/mainframe/pool-status", methods=["GET"])
def get_mainframe_pool_status() -> Response:
    """
    AC: The UI must display the status of the mainframe connection pool.
    Returns active connection count, idle pool capacity, mTLS status and latency.
    """
    return jsonify(mainframe_pool_state)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
