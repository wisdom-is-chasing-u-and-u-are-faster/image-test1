import pytest
import os


import hashlib
from main_app import app, get_db, init_db, encrypt_ssn, decrypt_ssn, log_audit


@pytest.fixture
def client():
    app.config["TESTING"] = True
    app.config["WTF_CSRF_ENABLED"] = False
    # Use an in-memory or custom test DB path
    test_db = os.path.join(os.path.dirname(__file__), "test_db.sqlite")
    if os.path.exists(test_db):
        os.remove(test_db)
    import main_app as app_mod
    app_mod.DATABASE = test_db

    with app.test_client() as client:
        with app.app_context():
            init_db()
        yield client

    if os.path.exists(test_db):
        os.remove(test_db)


def test_ssn_encryption_decryption(client):
    """REQ-F-002: System must encrypt patient's SSN before database storage."""
    original_ssn = "123-45-6789"
    encrypted = encrypt_ssn(original_ssn)
    assert encrypted != original_ssn

    decrypted = decrypt_ssn(encrypted)
    assert decrypted == original_ssn


def test_patient_registration_and_login_mfa(client):
    """REQ-F-001, REQ-F-003, REQ-N-009: Registration, login, and mandatory MFA."""
    # Register patient
    resp = client.post("/registration.html", data={
        "name": "Sarah Connor",
        "dob": "1965-11-10",
        "ssn": "999-88-7777",
        "email": "sarah@skynet.com",
        "phone": "555-4321",
        "password": "terminator123"
    }, follow_redirects=True)
    assert resp.status_code == 200

    # Check that SSN is encrypted in DB
    with app.app_context():
        db = get_db()
        row = db.execute(
            "SELECT ssn FROM users WHERE email = 'sarah@skynet.com'").fetchone()
        assert row is not None
        assert row["ssn"] != "999-88-7777"
        assert decrypt_ssn(row["ssn"]) == "999-88-7777"

    # Log in
    resp_login = client.post("/login.html", data={
        "email": "sarah@skynet.com",
        "password": "terminator123"
    }, follow_redirects=True)
    # Redirects to MFA
    assert b"MFA Verification" in resp_login.data

    # Complete MFA
    resp_mfa = client.post("/mfa.html", data={
        "mfa_code": "123456"
    }, follow_redirects=True)
    # Redirects to patient dashboard
    assert b"Welcome, Sarah Connor!" in resp_mfa.data


def test_immutable_audit_logging_chain(client):
    """REQ-F-011, REQ-F-012: Immutable cryptographic audit trail."""
    with app.app_context():
        # Write multiple audit logs
        log_audit(1, "WRITE", "Action 1")
        log_audit(1, "WRITE", "Action 2")
        log_audit(1, "READ", "Action 3")

        db = get_db()
        logs = db.execute(
            "SELECT * FROM audit_logs ORDER BY id ASC").fetchall()
        assert len(logs) >= 3

        # Verify the chain integrity
        prev_hash = "0" * 64
        for log in logs:
            assert log["previous_hash"] == prev_hash
            # Recompute hash
            hash_input = f"{log['timestamp']}|{log['user_id']}|{log['action']}|{log['details']}|{prev_hash}"
            expected_hash = hashlib.sha256(hash_input.encode()).hexdigest()
            assert log["hash"] == expected_hash
            prev_hash = log["hash"]


def test_slot_locking_and_double_booking_prevention(client):
    """REQ-F-007, REQ-F-009: 5-minute locks and double-booking prevention."""
    # Register and log in 2 users
    client.post("/registration.html", data={
        "name": "Patient One", "dob": "1990-01-01", "ssn": "111-22-3333",
        "email": "p1@email.com", "phone": "555-1111", "password": "password"
    })
    client.post("/registration.html", data={
        "name": "Patient Two", "dob": "1990-02-02", "ssn": "222-33-4444",
        "email": "p2@email.com", "phone": "555-2222", "password": "password"
    })

    # Log in Patient One
    client.post(
        "/login.html",
        data={
            "email": "p1@email.com",
            "password": "password"})
    client.post("/mfa.html", data={"mfa_code": "123456"})

    # Lock slot 1
    resp = client.post(
        "/book-appointment.html",
        data={
            "action": "lock",
            "slot_id": "1"})
    assert b"Lock acquired" in resp.data

    # Log in Patient Two in a new session (simulate via clean client)
    with app.test_client() as client2:
        client2.post(
            "/login.html",
            data={
                "email": "p2@email.com",
                "password": "password"})
        client2.post("/mfa.html", data={"mfa_code": "123456"})

        # Try locking slot 1 as Patient Two -> Should Fail
        resp2 = client2.post(
            "/book-appointment.html",
            data={
                "action": "lock",
                "slot_id": "1"})
        assert b"locked by another patient" in resp2.data

    # Confirm booking as Patient One
    resp_conf = client.post(
        "/book-appointment.html",
        data={
            "action": "confirm",
            "slot_id": "1"})
    assert b"Booking confirmed!" in resp_conf.data

    # Try to book the same slot as Patient Two -> Should Fail (Double-booking
    # prevention)
    with app.test_client() as client2:
        client2.post(
            "/login.html",
            data={
                "email": "p2@email.com",
                "password": "password"})
        client2.post("/mfa.html", data={"mfa_code": "123456"})
        resp2_conf = client2.post(
            "/book-appointment.html",
            data={
                "action": "confirm",
                "slot_id": "1"})
        assert b"already booked" in resp2_conf.data


def test_automatic_invoice_and_claim_creation(client):
    """REQ-F-013, REQ-F-014: Automatic creation of invoices and billing claims."""
    # Register and log in
    client.post("/registration.html", data={
        "name": "Sarah Connor", "dob": "1965-11-10", "ssn": "999-88-7777",
        "email": "sarah@skynet.com", "phone": "555-4321", "password": "password"
    })
    client.post(
        "/login.html",
        data={
            "email": "sarah@skynet.com",
            "password": "password"})
    client.post("/mfa.html", data={"mfa_code": "123456"})

    # Book slot
    client.post(
        "/book-appointment.html",
        data={
            "action": "confirm",
            "slot_id": "1"})

    with app.app_context():
        db = get_db()
        # Invoice should exist
        invoice = db.execute(
            "SELECT * FROM invoices WHERE patient_id = 3").fetchone()
        assert invoice is not None
        assert invoice["amount"] == 150.00
        assert invoice["status"] == "unpaid"

        # Claim should exist
        claim = db.execute(
            "SELECT * FROM claims WHERE patient_id = 3").fetchone()
        assert claim is not None
        assert claim["invoice_id"] == invoice["id"]
        assert claim["amount"] == 150.00
        assert claim["status"] == "pending"


def test_clinician_cancellation(client):
    """REQ-F-010: Clinicians can cancel appointments."""
    # Book appointment as patient
    client.post("/registration.html", data={
        "name": "Sarah Connor", "dob": "1965-11-10", "ssn": "999-88-7777",
        "email": "sarah@skynet.com", "phone": "555-4321", "password": "password"
    })
    client.post(
        "/login.html",
        data={
            "email": "sarah@skynet.com",
            "password": "password"})
    client.post("/mfa.html", data={"mfa_code": "123456"})
    client.post(
        "/book-appointment.html",
        data={
            "action": "confirm",
            "slot_id": "1"})

    # Log in as Clinician (Evelyn Reed)
    client.post("/logout")
    client.post(
        "/login.html",
        data={
            "email": "evelyn@healthwave.com",
            "password": "password123"})
    client.post("/mfa.html", data={"mfa_code": "123456"})

    # Cancel booking
    resp = client.post(
        "/cancel-appointment",
        data={
            "booking_id": "1"},
        follow_redirects=True)
    assert resp.status_code == 200

    with app.app_context():
        db = get_db()
        # Booking status should be cancelled
        booking = db.execute(
            "SELECT status FROM bookings WHERE id = 1").fetchone()
        assert booking["status"] == "cancelled"

        # Slot should be free/unbooked
        slot = db.execute(
            "SELECT booked_by_user_id FROM slots WHERE id = 1").fetchone()
        assert slot["booked_by_user_id"] is None


def test_profile_update(client):
    """REQ-F-004, REQ-F-005: View and edit profile details."""
    # Register and login
    client.post("/registration.html", data={
        "name": "Sarah Connor", "dob": "1965-11-10", "ssn": "999-88-7777",
        "email": "sarah@skynet.com", "phone": "555-4321", "password": "password"
    })
    client.post(
        "/login.html",
        data={
            "email": "sarah@skynet.com",
            "password": "password"})
    client.post("/mfa.html", data={"mfa_code": "123456"})

    # Update profile
    resp = client.post("/patient-profile.html", data={
        "email": "sarah_new@skynet.com",
        "phone": "555-9999"
    }, follow_redirects=True)
    assert resp.status_code == 200

    # Check database update
    with app.app_context():
        db = get_db()
        user = db.execute("SELECT * FROM users WHERE id = 3").fetchone()
        assert user["email"] == "sarah_new@skynet.com"
        assert user["phone"] == "555-9999"
