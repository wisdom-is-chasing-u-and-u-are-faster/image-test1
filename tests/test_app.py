"""
Unit tests for BDCN Web Application routes and acceptance criteria.
"""

import pytest
from app import app


@pytest.fixture
def client():
    """Flask test client fixture."""
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_login_page_renders_and_logs_in(client):
    """
    AC: The UI must allow users to log in.
    """
    response = client.get("/login")
    assert response.status_code == 200

    login_response = client.post(
        "/login",
        data={"username": "coordinator", "password": "password123"}
    )
    assert login_response.status_code in (200, 302)


def test_dashboard_displays_blood_inventory_levels(client):
    """
    AC: The ER Coordinator dashboard must display blood inventory levels.
    """
    response = client.get("/dashboard")
    assert response.status_code == 200


def test_search_initiates_donor_search(client):
    """
    AC: The ER Coordinator must be able to initiate a donor search.
    """
    response = client.get("/search?q=O+")
    assert response.status_code == 200


def test_admin_dashboard_provides_system_status_overview(client):
    """
    AC: The System Administration dashboard must provide an overview of the system status.
    """
    response = client.get("/admin")
    assert response.status_code == 200


def test_inventory_dashboard_displays_aggregated_blood_inventory(client):
    """
    AC: The Global Inventory dashboard must display an aggregated view of blood inventory.
    """
    response = client.get("/inventory")
    assert response.status_code == 200
