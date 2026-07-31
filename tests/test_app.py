import pytest
import io
from app import (
    app, demands, alerts, donors, audit_logs, appointments, center_capacities,
    hash_password, verify_password, encrypt_phi, decrypt_phi,
    generate_jwt_token, verify_jwt_token
)


@pytest.fixture
def client():
    app.config["TESTING"] = True
    app.config["WTF_CSRF_ENABLED"] = False
    with app.test_client() as client:
        yield client


def test_home_redirect(client):
    """Test that visiting root redirects to login page when not authenticated."""
    response = client.get("/")
    assert response.status_code == 302
    assert "/login/hospital" in response.headers["Location"]


def test_login_hospital(client):
    """Test login as hospital user."""
    response = client.post("/login/hospital", data={
        "username": "Mercy Hospital",
        "password": "password123"
    }, follow_redirects=True)
    assert response.status_code == 200
    assert b"Welcome, Mercy Hospital" in response.data


def test_login_admin(client):
    """Test login as administrator user."""
    response = client.post("/login/admin", data={
        "username": "admin_district",
        "password": "password123"
    }, follow_redirects=True)
    assert response.status_code == 200
    assert b"Hospital Request Verification Queue" in response.data


def test_create_demand(client):
    """Test creating a blood demand request with district and urgency."""
    client.post(
        "/login/hospital",
        data={
            "username": "Mercy Hospital",
            "password": "123"})

    data = {
        "blood_type": "B+",
        "units": "8",
        "notes": "Urgent surgery",
        "urgency": "Emergency",
        "district": "North District",
        "document": (io.BytesIO(b"dummy compliance contents"), "test_compliance.pdf")
    }
    response = client.post(
        "/hospital/create-demand",
        data=data,
        content_type="multipart/form-data",
        follow_redirects=True)
    assert response.status_code == 200
    assert b"Blood demand request submitted successfully" in response.data

    latest_demand = demands[-1]
    assert latest_demand["blood_type"] == "B+"
    assert latest_demand["units"] == 8
    assert latest_demand["filename"] == "test_compliance.pdf"
    assert latest_demand["urgency"] == "Emergency"
    assert latest_demand["district"] == "North District"


def test_verify_demand_approve(client):
    """Test that admin can approve a pending demand and emit alert."""
    demand_id = len(demands) + 1
    demands.append({
        "id": demand_id,
        "hospital": "Mercy Hospital",
        "blood_type": "O-",
        "units": 2,
        "filename": "some_doc.pdf",
        "status": "Pending",
        "urgency": "Urgent",
        "district": "Downtown"
    })

    client.post(
        "/login/admin",
        data={
            "username": "admin_district",
            "password": "123"})

    response = client.post(
        f"/admin/verify/{demand_id}",
        data={"action": "approve"},
        follow_redirects=True)
    assert response.status_code == 200
    assert b"Approved demand" in response.data
    assert demands[-1]["status"] == "Approved"
    assert alerts[-1]["blood_type"] == "O-"


def test_verify_demand_reject(client):
    """Test that admin can reject a pending demand."""
    demand_id = len(demands) + 1
    demands.append({
        "id": demand_id,
        "hospital": "Mercy Hospital",
        "blood_type": "AB-",
        "units": 1,
        "filename": "some_doc.pdf",
        "status": "Pending",
        "urgency": "Routine",
        "district": "West Hills"
    })

    client.post(
        "/login/admin",
        data={"username": "admin_district", "password": "123"})

    response = client.post(
        f"/admin/verify/{demand_id}",
        data={"action": "reject"},
        follow_redirects=True)
    assert response.status_code == 200
    assert b"Rejected demand" in response.data
    assert demands[-1]["status"] == "Rejected"


def test_donor_registration_and_age_validation(client):
    """Test voluntary donor registration, age constraint validation, and login."""
    # Test age under 16 rejection
    response_underage = client.post("/donor/register", data={
        "name": "Underage Kid",
        "username": "kid15",
        "age": "15",
        "gender": "Male",
        "blood_group": "A+",
        "last_donation": ""
    }, follow_redirects=True)
    assert b"Minimum legal age is 16" in response_underage.data

    # Test valid registration
    response = client.post("/donor/register", data={
        "name": "Jane Doe",
        "username": "janedoe",
        "age": "24",
        "gender": "Female",
        "blood_group": "B-",
        "last_donation": "2025-10-10"
    }, follow_redirects=True)
    assert response.status_code == 200
    assert b"Registration successful" in response.data

    registered_donor = next((d for d in donors if d["username"] == "janedoe"), None)
    assert registered_donor is not None
    assert registered_donor["name"] == "Jane Doe"
    assert registered_donor["blood_group"] == "B-"


def test_social_login(client):
    """Test OAuth/Social login mockup for Google, Apple, and Facebook."""
    response = client.get("/login/social/google", follow_redirects=True)
    assert response.status_code == 200
    assert b"Successfully authenticated via Google" in response.data


def test_security_and_crypto_helpers():
    """Test Argon2id hashing and AES-256-GCM PHI encryption utilities."""
    password = "superSecretPassword123"
    hashed = hash_password(password)
    assert verify_password(password, hashed) is True
    assert not verify_password("wrong_password", hashed)

    phi_text = "O-Negative; Medical History: Non-smoker"
    encrypted = encrypt_phi(phi_text)
    assert encrypted.startswith("ENC:")
    decrypted = decrypt_phi(encrypted)
    assert decrypted == phi_text


def test_jwt_generation_and_verification():
    """Test JWT token generation and verification."""
    token = generate_jwt_token({"username": "test_donor"}, "Donor")
    payload = verify_jwt_token(token)
    assert payload is not None
    assert payload["sub"] == "test_donor"
    assert payload["role"] == "Donor"


def test_donor_health_questionnaire(client):
    """Test donor pre-screening health questionnaire & 56-day eligibility machine."""
    client.post("/login/donor", data={"username": "johndoe", "password": "password123"})

    # Post questionnaire with health indicators triggering deferral
    response = client.post("/donor/health-questionnaire", data={
        "has_fever": "yes",
        "recent_surgery": "no",
        "medications": "no"
    }, follow_redirects=True)
    assert response.status_code == 200
    assert b"DEFERRED" in response.data

    target_donor = next(d for d in donors if d["username"] == "johndoe")
    assert target_donor["eligibility_status"] == "DEFERRED"


def test_center_capacity_and_appointment_booking(client):
    """Test center capacity updates, appointment slot booking, double-booking prevention, and QR endpoint."""
    # Login as admin to set capacity
    client.post("/login/admin", data={"username": "admin_district", "password": "123"})
    client.post("/center/capacity", data={
        "center_name": "Downtown Center",
        "operating_hours": "08:00 - 17:00",
        "slot_limit": "5"
    })
    assert center_capacities["Downtown Center"]["slot_limit"] == 5

    # Login as donor janesmith
    client.post("/login/donor", data={"username": "janesmith", "password": "password123"})

    # Book appointment
    res_book = client.post("/donor/book-appointment", data={
        "center": "Downtown Center",
        "slot_time": "11:00 AM"
    }, follow_redirects=True)
    assert res_book.status_code == 200
    assert b"Appointment successfully booked" in res_book.data

    # Test double-booking rule prevention
    res_double = client.post("/donor/book-appointment", data={
        "center": "Downtown Center",
        "slot_time": "11:00 AM"
    }, follow_redirects=True)
    assert b"You already have an active appointment scheduled" in res_double.data

    # Verify QR Code endpoint
    appt = next(a for a in appointments if a["donor_username"] == "janesmith")
    res_qr = client.get(f"/donor/qr-code/{appt['id']}")
    assert res_qr.status_code == 200
    json_data = res_qr.get_json()
    assert json_data["qr_token"] == appt["qr_token"]


def test_hospital_emergency_broadcast_and_audit(client):
    """Test hospital emergency donor broadcast initiation and audit logging."""
    client.post("/login/hospital", data={"username": "General Hospital", "password": "123"})

    res_broadcast = client.post("/hospital/broadcast", data={
        "blood_type": "AB-",
        "district": "Downtown",
        "units_needed": "10"
    }, follow_redirects=True)
    assert res_broadcast.status_code == 200
    assert b"Emergency Broadcast" in res_broadcast.data

    latest_log = audit_logs[-1]
    assert "EMERGENCY BROADCAST INITIATED" in latest_log["action"]
    assert "AB-" in latest_log["details"]
