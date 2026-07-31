import pytest
from app import app


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_home_redirect(client):
    response = client.get("/")
    assert response.status_code == 302


def test_donor_registration_login_and_profile_management(client):
    # Registration
    reg_response = client.post("/donor/register", data={
        "full_name": "Jane Doe",
        "email": "jane@example.com",
        "blood_type": "O-"
    }, follow_redirects=True)
    assert reg_response.status_code == 200
    assert b"Donor Profile Management" in reg_response.data

    # Profile Update
    profile_response = client.post("/donor/profile", data={
        "full_name": "Jane Smith",
        "blood_type": "O-"
    }, follow_redirects=True)
    assert profile_response.status_code == 200
    assert b"Jane Smith" in profile_response.data


def test_hospital_coordinators_create_blood_requests_and_view_dashboard(client):
    # Login as hospital
    client.post("/login/hospital", data={"hospital_name": "General Hospital"})

    # Create demand
    create_response = client.post("/hospital/create-demand", data={
        "blood_type": "A+",
        "units_needed": "2",
        "urgency": "High"
    }, follow_redirects=True)
    assert create_response.status_code == 200
    assert b"Hospital Blood Request Dashboard" in create_response.data
    assert b"A+" in create_response.data


def test_admin_system_statistics_dashboard(client):
    response = client.get("/admin/dashboard")
    assert response.status_code == 200
    assert b"Administrative System Statistics Dashboard" in response.data
    assert b"Total Registered Donors" in response.data
    assert b"Total Blood Demands" in response.data


def test_responsive_ui_and_viewport_meta_tags(client):
    response = client.get("/login/donor")
    assert response.status_code == 200
    assert b'name="viewport"' in response.data
