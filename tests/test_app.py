import os
import sys
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

import pytest  # noqa: E402
import uuid  # noqa: E402
from app import app as flask_app  # noqa: E402

API_KEY = "test-api-key-123"


@pytest.fixture
def client():
    # Configure Flask app for testing
    flask_app.config["TESTING"] = True
    with flask_app.test_client() as client:
        yield client

# --- Authentication Tests ---


def test_missing_api_key(client):
    """
    Endpoints should return 401 Unauthorized if the X-API-Key is missing.
    """
    # GET endpoint
    response = client.get("/api/v1/content/home")
    assert response.status_code == 401
    assert response.get_json() == {"error": "Unauthorized"}

    # POST endpoint
    response = client.post("/api/v1/leads", json={"name": "John Doe", "email": "john@example.com"})
    assert response.status_code == 401
    assert response.get_json() == {"error": "Unauthorized"}


def test_invalid_api_key(client):
    """
    Endpoints should return 401 Unauthorized if the X-API-Key is incorrect.
    """
    headers = {"X-API-Key": "wrong-key"}
    response = client.get("/api/v1/content/home", headers=headers)
    assert response.status_code == 401
    assert response.get_json() == {"error": "Unauthorized"}


# --- Content Service Tests ---

def test_get_content_success(client):
    """
    GET /api/v1/content/<page_slug> should return 200 OK and page details for valid slugs.
    """
    headers = {"X-API-Key": API_KEY}

    # Test 'home' page slug
    response = client.get("/api/v1/content/home", headers=headers)
    assert response.status_code == 200
    data = response.get_json()
    assert "title" in data
    assert "tagline" in data
    assert "content" in data
    assert data["title"] == "Welcome to Our Corporate Website"

    # Test 'about' page slug
    response = client.get("/api/v1/content/about", headers=headers)
    assert response.status_code == 200
    assert response.get_json()["title"] == "About Us"


def test_get_content_not_found(client):
    """
    GET /api/v1/content/<page_slug> should return 404 Not Found for non-existing slugs.
    """
    headers = {"X-API-Key": API_KEY}
    response = client.get("/api/v1/content/contact", headers=headers)
    assert response.status_code == 404
    assert response.get_json() == {"error": "Page not found"}


# --- Lead Capture Service Tests ---

def test_post_lead_success(client):
    """
    POST /api/v1/leads should return 201 Created and a valid UUID lead_id on success.
    """
    headers = {"X-API-Key": API_KEY}
    payload = {
        "name": "Jane Doe",
        "email": "jane.doe@example.com",
        "message": "Hello, I am interested in your services."
    }
    response = client.post("/api/v1/leads", json=payload, headers=headers)
    assert response.status_code == 201

    data = response.get_json()
    assert "lead_id" in data
    # Verify lead_id is a valid UUID
    val = uuid.UUID(data["lead_id"], version=4)
    assert str(val) == data["lead_id"]


def test_post_lead_missing_fields(client):
    """
    POST /api/v1/leads should return 400 Bad Request if name or email is missing.
    """
    headers = {"X-API-Key": API_KEY}

    # Missing email
    response = client.post("/api/v1/leads", json={"name": "No Email"}, headers=headers)
    assert response.status_code == 400
    assert "Missing required fields" in response.get_json()["error"]

    # Missing name
    response = client.post("/api/v1/leads", json={"email": "no_name@example.com"}, headers=headers)
    assert response.status_code == 400
    assert "Missing required fields" in response.get_json()["error"]


def test_post_lead_invalid_email(client):
    """
    POST /api/v1/leads should return 400 Bad Request if the email format is invalid.
    """
    headers = {"X-API-Key": API_KEY}
    payload = {
        "name": "Jane Doe",
        "email": "invalid-email-format",
        "message": "Hello"
    }
    response = client.post("/api/v1/leads", json=payload, headers=headers)
    assert response.status_code == 400
    assert response.get_json() == {"error": "Invalid email format"}


def test_post_lead_not_json(client):
    """
    POST /api/v1/leads should return 400 Bad Request if request body is not JSON.
    """
    headers = {"X-API-Key": API_KEY}
    response = client.post("/api/v1/leads", data="not json data", headers=headers)
    assert response.status_code == 400
    assert "must be JSON" in response.get_json()["error"]
