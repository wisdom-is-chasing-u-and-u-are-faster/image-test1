"""Unit and API integration tests for Onboarding & Compliance REST APIs."""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db import init_db


@pytest.fixture
def client():
    init_db()
    with TestClient(app) as client:
        yield client


def test_health_check(client):
    """Verifies GET /health endpoint returns 200 OK."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "digital-savings" in data["service"]


def test_initiate_account_success(client):
    """Verifies POST /api/v1/onboarding/accounts/initiate creates approved application (REQ-F-008)."""
    payload = {
        "full_name": "Samuel Jackson",
        "email": "samuel@example.com",
        "ssn": "123456789",
        "id_document_uploaded": True,
        "liveness_verified": True,
        "language": "en"
    }
    response = client.post("/api/v1/onboarding/accounts/initiate", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "application_id" in data
    assert data["status"] == "APPROVED"
    assert data["cif_number"].startswith("CIF-")
    assert data["dda_number"].startswith("DDA-")


def test_initiate_account_aml_flagged(client):
    """Verifies that high-risk applicants are flagged for compliance review."""
    payload = {
        "full_name": "PEP Politician",
        "email": "pep.leader@example.com",
        "ssn": "987654321",
        "id_document_uploaded": True,
        "liveness_verified": True,
        "language": "es"
    }
    response = client.post("/api/v1/onboarding/accounts/initiate", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "IN_REVIEW"
    assert data["verification_stage"] == "AML_REVIEW_REQUIRED"


def test_get_account_status(client):
    """Verifies GET /api/v1/onboarding/accounts/<id>/status returns masked PII and banking IDs (REQ-F-009)."""
    response = client.get("/api/v1/onboarding/accounts/app-seed-001/status")
    assert response.status_code == 200
    data = response.json()
    assert data["application_id"] == "app-seed-001"
    assert data["full_name"] == "Alex Rivera"
    assert data["ssn_masked"] == "******102"
    assert data["status"] == "APPROVED"


def test_get_account_status_not_found(client):
    """Verifies status endpoint handles non-existent IDs cleanly."""
    response = client.get("/api/v1/onboarding/accounts/non-existent-app-999/status")
    assert response.status_code == 404


def test_compliance_list_and_decision(client):
    """Verifies Compliance Portal list applications and decision triage (REQ-F-013)."""
    list_res = client.get("/api/v1/compliance/applications")
    assert list_res.status_code == 200
    list_data = list_res.json()
    assert list_data["total"] >= 3

    # Submit approval decision for flagged seed app
    dec_payload = {
        "decision": "APPROVE",
        "notes": "Manual verification approved by senior officer",
        "reviewer_id": "officer-maria"
    }
    dec_res = client.post("/api/v1/compliance/applications/app-seed-002/decision", json=dec_payload)
    assert dec_res.status_code == 200
    dec_data = dec_res.json()
    assert dec_data["status"] == "APPROVED"
    assert dec_data["cif_number"].startswith("CIF-")
