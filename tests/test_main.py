import os
import json
import html
import pytest
from main import app, load_content


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_load_content():
    """Verify that CMS content.json is loaded correctly and contains required schema fields."""
    content = load_content()
    assert content is not None
    assert "site_name" in content
    assert "services" in content
    assert "team" in content
    assert "locations" in content


def test_home_route(client):
    """Verify homepage loads successfully with required elements."""
    response = client.get("/")
    assert response.status_code == 200
    html_content = response.data.decode("utf-8")
    assert "Vertex IT Services" in html_content
    assert "Service Track Matrix" in html_content
    assert "Our Key Architectural Drivers" in html_content


def test_service_routes(client):
    """Verify that all four service tracks defined in content load successfully."""
    content = load_content()
    services = content.get("services", {})

    # Assert we have the 4 required tracks
    assert "cloud-migration" in services
    assert "app-development" in services
    assert "data-analytics" in services
    assert "ai-agentic-systems" in services

    for track_key in services.keys():
        response = client.get(f"/services/{track_key}")
        assert response.status_code == 200
        html_content = response.data.decode("utf-8")
        # Use html.escape to match the title exactly (for characters like &
        # amp;)
        escaped_title = html.escape(services[track_key]["title"])
        assert escaped_title in html_content or services[track_key]["title"] in html_content
        assert "Technical Architecture Diagram" in html_content


def test_invalid_service_route(client):
    """Verify invalid service sub-pages return a 404 error."""
    response = client.get("/services/invalid-track-key")
    assert response.status_code == 404
    html_content = response.data.decode("utf-8")
    assert "404 - Not Found" in html_content or "Not Found" in html_content


def test_about_route(client):
    """Verify About Us page renders leadership team and location information."""
    response = client.get("/about")
    assert response.status_code == 200
    html_content = response.data.decode("utf-8")
    assert "Our Leadership Team" in html_content
    assert "Global Operations Hubs" in html_content
    assert "Arjun Mehta" in html_content
    assert "Pune, India" in html_content


def test_submit_lead_success(client):
    """Verify form submission endpoints correctly validate fields and log details."""
    # Ensure any previous log is removed or we test fresh appends
    if os.path.exists("leads.log"):
        os.remove("leads.log")

    payload = {
        "name": "Jane Doe",
        "email": "jane.doe@example.com",
        "company": "Acme Corp",
        "service_track": "AI & Agentic Systems",
        "message": "We need help scaling our LLM pipelines."
    }

    response = client.post("/submit-lead", data=payload)
    assert response.status_code == 200
    json_resp = json.loads(response.data.decode("utf-8"))
    assert json_resp["status"] == "SUCCESS"
    assert json_resp["message"] == "Lead captured successfully!"

    # Verify that the lead was logged in the log file
    assert os.path.exists("leads.log")
    with open("leads.log", "r", encoding="utf-8") as f:
        log_content = f.read()
        assert "Jane Doe" in log_content
        assert "jane.doe@example.com" in log_content
        assert "Acme Corp" in log_content


def test_submit_lead_missing_required_fields(client):
    """Verify validation fails when required name or email fields are absent."""
    payload = {
        "company": "Acme Corp",
        "service_track": "Cloud Migration"
    }
    response = client.post("/submit-lead", data=payload)
    assert response.status_code == 400
    json_resp = json.loads(response.data.decode("utf-8"))
    assert json_resp["status"] == "ERROR"
    assert "required" in json_resp["message"]
