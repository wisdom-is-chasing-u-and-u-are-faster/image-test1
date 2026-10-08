"""End-to-end integration and smoke verification test suite."""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db import init_db


@pytest.fixture
def client():
    init_db()
    with TestClient(app) as client:
        yield client


def test_full_onboarding_to_compliance_triage_flow(client):
    """
    Executes end-to-end workflow:
    1. Static index page load
    2. Submitting application
    3. Status check
    4. Compliance Portal listing & approval
    """
    # 1. User loads landing page
    res_index = client.get("/")
    assert res_index.status_code == 200
    assert "Digital Bank" in res_index.text

    # 2. User submits onboarding application
    payload = {
        "full_name": "Elena Rostova",
        "email": "elena.rostova@example.com",
        "ssn": "888123456",
        "id_document_uploaded": True,
        "liveness_verified": True,
        "language": "en"
    }
    res_initiate = client.post("/api/v1/onboarding/accounts/initiate", json=payload)
    assert res_initiate.status_code == 201
    initiate_data = res_initiate.json()
    app_id = initiate_data["application_id"]
    assert initiate_data["status"] == "APPROVED"
    assert initiate_data["cif_number"].startswith("CIF-")
    assert initiate_data["dda_number"].startswith("DDA-")

    # 3. User checks application status
    res_status = client.get(f"/api/v1/onboarding/accounts/{app_id}/status")
    assert res_status.status_code == 200
    status_data = res_status.json()
    assert status_data["ssn_masked"] == "******456"
    assert status_data["status"] == "APPROVED"

    # 4. Compliance Officer lists applications and reviews
    res_portal = client.get("/api/v1/compliance/applications")
    assert res_portal.status_code == 200
    portal_data = res_portal.json()
    assert any(a["application_id"] == app_id for a in portal_data["applications"])
