import pytest
from app import app


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_main_dashboard_visualize_rate_limiting_autoscaling_behavior(client):
    """
    AC: The UI must provide a dashboard to visualize rate-limiting and autoscaling behavior.
    """
    # Test HTML route rendering
    response = client.get("/main-dashboard")
    assert response.status_code == 200

    # Test API endpoint returning autoscaling & rate-limiting metrics
    api_response = client.get("/api/metrics/autoscaling")
    assert api_response.status_code == 200
    data = api_response.get_json()
    assert "rate_limiting" in data
    assert "autoscaling" in data
    assert "current_rps" in data["rate_limiting"]
    assert "current_replicas" in data["autoscaling"]


def test_view_results_audit_log_reconciliation(client):
    """
    AC: The UI must allow users to view the results of the audit log reconciliation.
    """
    # Test HTML route rendering
    response = client.get("/audit-log-reconciliation")
    assert response.status_code == 200

    # Test API endpoint returning reconciliation records
    api_response = client.get("/api/audit-log/reconciliation")
    assert api_response.status_code == 200
    data = api_response.get_json()
    assert data["status"] == "SUCCESS"
    assert len(data["results"]) >= 1
    assert "batch_id" in data["results"][0]


def test_configure_rate_limiting_thresholds(client):
    """
    AC: The UI must allow users to configure rate-limiting thresholds.
    """
    # Test HTML route rendering
    response = client.get("/rate-limiting")
    assert response.status_code == 200

    # Test GET config API
    get_res = client.get("/api/rate-limiting/config")
    assert get_res.status_code == 200
    config = get_res.get_json()
    assert "default_threshold" in config

    # Test POST config API update
    post_res = client.post(
        "/api/rate-limiting/config",
        json={"default_threshold": 2500, "burst_limit": 3000}
    )
    assert post_res.status_code == 200
    updated_data = post_res.get_json()
    assert updated_data["config"]["default_threshold"] == 2500
    assert updated_data["config"]["burst_limit"] == 3000


def test_display_status_mainframe_connection_pool(client):
    """
    AC: The UI must display the status of the mainframe connection pool.
    """
    # Test HTML route rendering
    response = client.get("/upstream-services")
    assert response.status_code == 200

    # Test API endpoint returning pool status
    api_response = client.get("/api/mainframe/pool-status")
    assert api_response.status_code == 200
    data = api_response.get_json()
    assert "active_connections" in data
    assert "idle_connections" in data
    assert "mtls_status" in data
    assert data["health_status"] == "HEALTHY"


def test_index_and_security_events_routes(client):
    """
    Test index and security events routes.
    """
    res1 = client.get("/")
    assert res1.status_code == 200

    res2 = client.get("/security-events")
    assert res2.status_code == 200
