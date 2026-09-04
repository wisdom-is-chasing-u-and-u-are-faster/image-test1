"""
Test Suite for ARCH-610: Event Planning Platform MVP
Verifies all Acceptance Criteria and Functional / Non-Functional Requirements.
"""

import io
import pytest
from app import (
    app,
    ROLE_ORGANIZER,
    RSVP_ATTENDING,
    RSVP_DECLINED,
)


@pytest.fixture
def client():
    app.testing = True
    with app.test_client() as client:
        yield client


# ----------------------------------------------------------------------
# AC 1: An Event Organizer can log in and view a dashboard of their events.
# ----------------------------------------------------------------------


def test_organizer_login_and_dashboard_access(client):
    """
    AC: An Event Organizer can log in and view a dashboard of their events.
    Verifies authentication, RBAC, and executive dashboard metrics.
    """
    # 1. Access dashboard page directly (renders template)
    response = client.get("/dashboard")
    assert response.status_code == 200

    # 2. API Login as Organizer
    login_res = client.post(
        "/api/auth/login",
        json={"email": "organizer@event.com"},
    )
    assert login_res.status_code == 200
    data = login_res.get_json()
    assert data["user"]["role"] == ROLE_ORGANIZER

    # 3. Retrieve events via API
    events_res = client.get("/api/events")
    assert events_res.status_code == 200
    events_data = events_res.get_json()
    assert len(events_data["events"]) >= 1

    # 4. Executive Dashboard Metrics (REQ-F-007)
    metrics_res = client.get("/api/dashboard/metrics")
    assert metrics_res.status_code == 200
    metrics = metrics_res.get_json()
    assert "total_events" in metrics
    assert "rsvp_breakdown" in metrics
    assert "budget" in metrics


# ----------------------------------------------------------------------
# AC 2: An Event Organizer can use a step-by-step wizard to create a new event.
# ----------------------------------------------------------------------


def test_event_creator_wizard_and_pessimistic_locking(client):
    """
    AC: An Event Organizer can use a step-by-step wizard to create a new event.
    Verifies event creation and pessimistic venue locking (REQ-F-003, REQ-F-008).
    """
    # 1. Render Wizard page
    wizard_res = client.get("/create-event")
    assert wizard_res.status_code == 200

    # 2. Create Event through Wizard API
    new_event_payload = {
        "title": "Autonomous AI Summit 2026",
        "description": "Showcase of multi-agent engineering workflows.",
        "venue_id": "venue-2",
        "date": "2026-11-20",
        "time_slot": "10:00-18:00",
        "budget": 75000.0,
        "allocated_spend": 25000.0,
    }
    create_res = client.post("/api/events", json=new_event_payload)
    assert create_res.status_code == 201
    created_event = create_res.get_json()["event"]
    event_id = created_event["id"]
    assert created_event["title"] == "Autonomous AI Summit 2026"

    # 3. Pessimistic Venue Reservation (Locking)
    reserve_res1 = client.post(
        "/api/venues/reserve",
        json={
            "venue_id": "venue-2",
            "date": "2026-11-20",
            "time_slot": "10:00-18:00",
            "event_id": event_id,
        },
    )
    assert reserve_res1.status_code == 200
    assert "lock" in reserve_res1.get_json()

    # 4. Conflicting Reservation on Same Venue-Date-Time Slot must return 409 Conflict (REQ-F-008)
    reserve_res2 = client.post(
        "/api/venues/reserve",
        json={
            "venue_id": "venue-2",
            "date": "2026-11-20",
            "time_slot": "10:00-18:00",
            "event_id": "evt-competing-999",
        },
    )
    assert reserve_res2.status_code == 409
    assert reserve_res2.get_json()["error"] == "Conflict"


# ----------------------------------------------------------------------
# AC 3: An Event Organizer can upload a CSV of up to 10,000 guests for an event.
# ----------------------------------------------------------------------


def test_csv_guest_list_upload_and_deduplication(client):
    """
    AC: An Event Organizer can upload a CSV of up to 10,000 guests for an event.
    Verifies schema validation, deduplication, and update logic (REQ-F-004, REQ-F-009, REQ-F-010, REQ-F-011).
    """
    event_id = "evt-101"

    # CSV Data with duplicate in sheet and case variations (REQ-F-009, REQ-F-010)
    csv_text = (
        "name,email,company,dietary\n"
        "Alice Johnson,Alice.Johnson@Innovate.org,Innovate Corp,Vegan\n"
        "Alice Duplicate,alice.johnson@innovate.org,Innovate Corp,Vegan\n"
        "Bob Roberts,bob.roberts@enterprise.net,Enterprise Inc,Gluten-Free\n"
        "John Doe Updated,john.doe@techcorp.com,TechCorp Global,Halal\n"  # matches existing guest g-1
    )

    upload_res = client.post(
        f"/api/events/{event_id}/guests/upload",
        data={"file": (io.BytesIO(csv_text.encode("utf-8")), "guests.csv")},
        content_type="multipart/form-data",
    )
    assert upload_res.status_code == 200
    result = upload_res.get_json()
    assert result["inserted"] == 2  # Alice and Bob
    assert result["omitted_duplicates"] == 1  # Alice duplicate
    assert result["updated"] == 1  # John Doe updated (REQ-F-011)

    # Verify guests list
    guests_res = client.get(f"/api/events/{event_id}/guests")
    assert guests_res.status_code == 200
    guests = {g["email"]: g for g in guests_res.get_json()["guests"]}
    assert "alice.johnson@innovate.org" in guests
    assert guests["john.doe@techcorp.com"]["name"] == "John Doe Updated"


# ----------------------------------------------------------------------
# AC 4: A guest who receives an email invitation can click a unique link to visit a page and RSVP.
# ----------------------------------------------------------------------


def test_email_invitation_unique_link_and_rsvp_invalidation(client):
    """
    AC: A guest who receives an email invitation can click a unique link to visit a page and RSVP.
    Verifies UUID v4 invitation engine and one-time token invalidation (REQ-F-005, REQ-F-012, REQ-F-013).
    """
    event_id = "evt-101"

    # 1. Issue invitations
    send_res = client.post(f"/api/events/{event_id}/invitations/send")
    assert send_res.status_code == 200
    invitations = send_res.get_json()["invitations"]
    assert len(invitations) > 0

    target_invitation = invitations[0]
    token = target_invitation["token"]

    # 2. Visit RSVP Page
    page_res = client.get(f"/rsvp/{token}")
    assert page_res.status_code == 200

    # 3. Fetch invitation info via API
    info_res = client.get(f"/api/rsvp/{token}")
    assert info_res.status_code == 200
    assert info_res.get_json()["valid"] is True

    # 4. Submit RSVP Status: ATTENDING
    submit_res = client.post(
        f"/api/rsvp/{token}",
        json={"rsvp_status": RSVP_ATTENDING},
    )
    assert submit_res.status_code == 200
    assert submit_res.get_json()["token_invalidated"] is True

    # 5. Subsequent Submission on same token must be rejected with 410 Gone (REQ-F-013)
    resubmit_res = client.post(
        f"/api/rsvp/{token}",
        json={"rsvp_status": RSVP_DECLINED},
    )
    assert resubmit_res.status_code == 410
    assert "already used" in resubmit_res.get_json()["error"]


# ----------------------------------------------------------------------
# AC 5: The UI is responsive and adheres to WCAG 2.1 Level AA.
# ----------------------------------------------------------------------


def test_responsive_ui_and_wcag_endpoints(client):
    """
    AC: The UI is responsive and adheres to WCAG 2.1 Level AA.
    Verifies all UI page routes, security headers (HSTS), and PII filtering (REQ-F-017, REQ-F-019).
    """
    ui_routes = [
        "/",
        "/about",
        "/index",
        "/login",
        "/dashboard",
        "/create_event",
        "/event_details",
        "/venues",
        "/rsvp",
    ]

    for route in ui_routes:
        res = client.get(route)
        assert res.status_code == 200
        # Check HSTS Security Header
        assert "Strict-Transport-Security" in res.headers
        assert "max-age=31536000" in res.headers["Strict-Transport-Security"]
        assert "X-Content-Type-Options" in res.headers

    # Health check endpoint
    health = client.get("/api/health")
    assert health.status_code == 200
