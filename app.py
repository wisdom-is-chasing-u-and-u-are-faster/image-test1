"""
Event Planning Platform MVP - Core Application
Implements ARCH-610: UI Pages + Requirements for multi-tenant Event Management.
"""

import csv
import io
import logging
import os
import re
import threading
import uuid
from datetime import datetime
from functools import wraps
from typing import Any, Callable, Dict, List, Tuple, cast

from flask import (
    Flask,
    Response,
    jsonify,
    redirect,
    render_template,
    request,
    session,
    url_for,
)

# ----------------------------------------------------------------------
# Logging and PII Filtering Setup (REQ-F-017)
# ----------------------------------------------------------------------


class PIIMaskingFilter(logging.Filter):
    """Filters PII elements (emails, tokens, phone numbers) from application log payloads."""

    EMAIL_REGEX = re.compile(r"[\w\.-]+@[\w\.-]+\.\w+")
    PHONE_REGEX = re.compile(r"\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b")

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            record.msg = self.EMAIL_REGEX.sub("[MASKED_EMAIL]", record.msg)
            record.msg = self.PHONE_REGEX.sub("[MASKED_PHONE]", record.msg)
        return True


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("event_platform")
logger.addFilter(PIIMaskingFilter())

# ----------------------------------------------------------------------
# App Initialization & Security Headers (REQ-F-018, REQ-F-019)
# ----------------------------------------------------------------------

app = Flask(__name__, template_folder="templates")
app.secret_key = os.environ.get("APP_SESSION_KEY", "event-platform-dev-session-key-2026")


@app.after_request
def apply_security_headers(response: Response) -> Response:
    """Enforce HSTS and secure response headers."""
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response


# ----------------------------------------------------------------------
# In-Memory Storage & Thread-Safe Locking (REQ-F-003, REQ-N-009)
# ----------------------------------------------------------------------

storage_lock = threading.RLock()

# Predefined Roles (REQ-F-015)
ROLE_ADMIN = "PLATFORM_ADMIN"
ROLE_ORGANIZER = "EVENT_ORGANIZER"
ROLE_ATTENDEE = "ATTENDEE"

# Predefined RSVP Statuses (REQ-F-016)
RSVP_PENDING = "PENDING"
RSVP_ATTENDING = "ATTENDING"
RSVP_DECLINED = "DECLINED"
RSVP_TENTATIVE = "TENTATIVE"

USERS: Dict[str, Dict[str, Any]] = {
    "admin@platform.com": {
        "id": "u-admin",
        "email": "admin@platform.com",
        "name": "Platform Admin",
        "role": ROLE_ADMIN,
    },
    "organizer@event.com": {
        "id": "u-organizer",
        "email": "organizer@event.com",
        "name": "Sarah Jenkins",
        "role": ROLE_ORGANIZER,
    },
    "attendee@guest.com": {
        "id": "u-attendee",
        "email": "attendee@guest.com",
        "name": "Alex Smith",
        "role": ROLE_ATTENDEE,
    },
}

VENUES: Dict[str, Dict[str, Any]] = {
    "venue-1": {
        "id": "venue-1",
        "name": "The Grand Atrium",
        "location": "Downtown Metro",
        "capacity": 500,
        "price_per_hour": 350.0,
        "amenities": ["Audio/Visual", "Catering Kitchen", "Valet Parking"],
    },
    "venue-2": {
        "id": "venue-2",
        "name": "Skyline Rooftop Lounge",
        "location": "Harbor District",
        "capacity": 200,
        "price_per_hour": 500.0,
        "amenities": ["Panoramic Views", "Cocktail Bar", "Sound System"],
    },
    "venue-3": {
        "id": "venue-3",
        "name": "Silicon Innovation Hall",
        "location": "Tech Park",
        "capacity": 1000,
        "price_per_hour": 800.0,
        "amenities": ["Livestream Stage", "High-speed Fiber", "Breakout Rooms"],
    },
}

# Pessimistic Locking Store: key = "venue_id:date:time_slot" -> reservation_dict
VENUE_LOCKS: Dict[str, Dict[str, Any]] = {}

EVENTS: Dict[str, Dict[str, Any]] = {
    "evt-101": {
        "id": "evt-101",
        "title": "Global Tech Summit 2026",
        "description": "Annual conference bringing together tech leaders and visionaries.",
        "organizer_email": "organizer@event.com",
        "venue_id": "venue-1",
        "date": "2026-10-15",
        "time_slot": "09:00-17:00",
        "budget": 50000.0,
        "allocated_spend": 32000.0,
        "status": "PUBLISHED",
        "created_at": "2026-09-01T10:00:00Z",
    }
}

GUESTS: Dict[str, Dict[str, Dict[str, Any]]] = {
    "evt-101": {
        "john.doe@techcorp.com": {
            "id": "g-1",
            "name": "John Doe",
            "email": "john.doe@techcorp.com",
            "company": "TechCorp",
            "rsvp_status": RSVP_ATTENDING,
            "dietary": "None",
        },
        "jane.smith@innovate.io": {
            "id": "g-2",
            "name": "Jane Smith",
            "email": "jane.smith@innovate.io",
            "company": "Innovate IO",
            "rsvp_status": RSVP_PENDING,
            "dietary": "Vegetarian",
        },
    }
}

# RSVP Invitations: token (UUID v4) -> Invitation info
INVITATIONS: Dict[str, Dict[str, Any]] = {
    "3fa85f64-5717-4562-b3fc-2c963f66afa6": {
        "token": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "event_id": "evt-101",
        "guest_email": "jane.smith@innovate.io",
        "guest_name": "Jane Smith",
        "used": False,
        "created_at": "2026-09-04T12:00:00Z",
    }
}

# ----------------------------------------------------------------------
# Auth & RBAC Decorators (REQ-F-001, REQ-F-015)
# ----------------------------------------------------------------------


def login_required(f: Callable[..., Any]) -> Callable[..., Any]:
    @wraps(f)
    def decorated_function(*args: Any, **kwargs: Any) -> Any:
        if "user" not in session:
            if request.path.startswith("/api/"):
                return jsonify({"error": "Unauthorized", "message": "Authentication required"}), 401
            return redirect(url_for("login_page"))
        return f(*args, **kwargs)

    return decorated_function


def roles_required(*allowed_roles: str) -> Callable[..., Any]:
    def decorator(f: Callable[..., Any]) -> Callable[..., Any]:
        @wraps(f)
        def decorated_function(*args: Any, **kwargs: Any) -> Any:
            if "user" not in session:
                if request.path.startswith("/api/"):
                    return jsonify({"error": "Unauthorized"}), 401
                return redirect(url_for("login_page"))

            user_role = session["user"].get("role")
            if user_role not in allowed_roles:
                if request.path.startswith("/api/"):
                    return jsonify({"error": "Forbidden", "message": "Insufficient permissions"}), 403
                return render_template("login.html", error="Forbidden: Insufficient privileges"), 403
            return f(*args, **kwargs)

        return decorated_function

    return decorator


# ----------------------------------------------------------------------
# UI Route Handlers (Templates)
# ----------------------------------------------------------------------


@app.route("/")
@app.route("/about")
def about_page() -> str:
    return render_template("about.html")


@app.route("/index")
def index_page() -> str:
    return render_template("index.html")


@app.route("/login", methods=["GET", "POST"])
def login_page() -> Any:
    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        user = USERS.get(email)
        if user:
            session["user"] = {
                "id": user["id"],
                "email": user["email"],
                "name": user["name"],
                "role": user["role"],
            }
            return redirect(url_for("dashboard_page"))
        return render_template("login.html", error="Invalid user account.")
    return render_template("login.html")


@app.route("/logout")
def logout() -> Any:
    session.pop("user", None)
    return redirect(url_for("login_page"))


@app.route("/dashboard")
def dashboard_page() -> Any:
    current_user = session.get("user")
    return render_template("dashboard.html", user=current_user)


@app.route("/create-event")
@app.route("/create_event")
def create_event_page() -> Any:
    return render_template("create_event.html", venues=list(VENUES.values()))


@app.route("/event_details")
@app.route("/event_details/<event_id>")
@app.route("/events/<event_id>")
def event_details_page(event_id: str = "evt-101") -> Any:
    event = EVENTS.get(event_id, EVENTS.get("evt-101"))
    return render_template("event_details.html", event=event)


@app.route("/venues")
def venues_page() -> Any:
    return render_template("venues.html", venues=list(VENUES.values()))


@app.route("/rsvp")
@app.route("/rsvp/<token>")
def rsvp_page(token: str = "") -> Any:
    invitation = INVITATIONS.get(token) if token else None
    return render_template("rsvp.html", token=token, invitation=invitation)


# ----------------------------------------------------------------------
# REST API Endpoints
# ----------------------------------------------------------------------


@app.route("/api/health", methods=["GET"])
def health_check() -> Tuple[Response, int]:
    return jsonify({"status": "healthy", "service": "event-platform-mvp", "version": "1.0.0"}), 200


@app.route("/api/auth/login", methods=["POST"])
def api_login() -> Tuple[Response, int]:
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()

    user = USERS.get(email)
    if not user:
        logger.warning(f"Failed login attempt for {email}")
        return jsonify({"error": "Invalid credentials"}), 401

    session["user"] = {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
    }
    logger.info(f"User {email} logged in with role {user['role']}")
    return jsonify({"message": "Login successful", "user": session["user"]}), 200


@app.route("/api/auth/logout", methods=["POST"])
def api_logout() -> Tuple[Response, int]:
    session.pop("user", None)
    return jsonify({"message": "Logged out successfully"}), 200


@app.route("/api/auth/me", methods=["GET"])
def api_current_user() -> Tuple[Response, int]:
    if "user" in session:
        return jsonify({"authenticated": True, "user": session["user"]}), 200
    return jsonify({"authenticated": False, "user": None}), 200


@app.route("/api/events", methods=["GET", "POST"])
def api_events() -> Tuple[Response, int]:
    with storage_lock:
        if request.method == "POST":
            data = request.get_json(silent=True) or {}
            title = data.get("title", "").strip()
            if not title:
                return jsonify({"error": "Event title is required"}), 400

            event_id = f"evt-{uuid.uuid4().hex[:8]}"
            new_event = {
                "id": event_id,
                "title": title,
                "description": data.get("description", ""),
                "organizer_email": session.get("user", {}).get("email", "organizer@event.com"),
                "venue_id": data.get("venue_id", "venue-1"),
                "date": data.get("date", datetime.utcnow().strftime("%Y-%m-%d")),
                "time_slot": data.get("time_slot", "09:00-17:00"),
                "budget": float(data.get("budget", 10000.0)),
                "allocated_spend": float(data.get("allocated_spend", 0.0)),
                "status": "PUBLISHED",
                "created_at": datetime.utcnow().isoformat() + "Z",
            }
            EVENTS[event_id] = new_event
            GUESTS[event_id] = {}
            logger.info(f"Created new event {event_id}: {title}")
            return jsonify({"message": "Event created", "event": new_event}), 201

        return jsonify({"events": list(EVENTS.values())}), 200


@app.route("/api/events/<event_id>", methods=["GET", "PUT", "DELETE"])
def api_event_detail(event_id: str) -> Tuple[Response, int]:
    with storage_lock:
        if event_id not in EVENTS:
            return jsonify({"error": "Event not found"}), 404

        if request.method == "DELETE":
            del EVENTS[event_id]
            GUESTS.pop(event_id, None)
            return jsonify({"message": "Event deleted"}), 200

        if request.method == "PUT":
            data = request.get_json(silent=True) or {}
            event = EVENTS[event_id]
            for key in ["title", "description", "venue_id", "date", "time_slot", "budget", "allocated_spend"]:
                if key in data:
                    event[key] = data[key]
            return jsonify({"message": "Event updated", "event": event}), 200

        return jsonify({"event": EVENTS[event_id]}), 200


# ----------------------------------------------------------------------
# Pessimistic Venue Locking Engine (REQ-F-003, REQ-F-008, REQ-N-009)
# ----------------------------------------------------------------------


@app.route("/api/venues", methods=["GET"])
def api_venues() -> Tuple[Response, int]:
    return jsonify({"venues": list(VENUES.values()), "active_locks": list(VENUE_LOCKS.keys())}), 200


@app.route("/api/venues/reserve", methods=["POST"])
def api_reserve_venue() -> Tuple[Response, int]:
    """
    Pessimistic distributed locking engine for venue reservations.
    Rejects locked venue-date-time combinations with 409 Conflict.
    """
    data = request.get_json(silent=True) or {}
    venue_id = data.get("venue_id")
    date_str = data.get("date")
    time_slot = data.get("time_slot", "09:00-17:00")
    event_id = data.get("event_id", "evt-general")

    if not venue_id or not date_str:
        return jsonify({"error": "venue_id and date are required"}), 400

    if venue_id not in VENUES:
        return jsonify({"error": "Invalid venue_id"}), 404

    lock_key = f"{venue_id}:{date_str}:{time_slot}"

    with storage_lock:
        # Check if already locked by another event
        existing_lock = VENUE_LOCKS.get(lock_key)
        if existing_lock and existing_lock.get("event_id") != event_id:
            logger.warning(
                f"Pessimistic lock conflict on {lock_key} requested by {event_id}, "
                f"already held by {existing_lock['event_id']}"
            )
            return (
                jsonify(
                    {
                        "error": "Conflict",
                        "code": 409,
                        "message": f"Venue {venue_id} is already reserved and locked for {date_str} ({time_slot}).",
                        "held_by": existing_lock["event_id"],
                    }
                ),
                409,
            )

        # Acquire pessimistic lock
        VENUE_LOCKS[lock_key] = {
            "lock_key": lock_key,
            "venue_id": venue_id,
            "date": date_str,
            "time_slot": time_slot,
            "event_id": event_id,
            "locked_at": datetime.utcnow().isoformat() + "Z",
        }
        logger.info(f"Pessimistic lock acquired for {lock_key} by {event_id}")

    return (
        jsonify(
            {
                "message": "Venue reserved successfully",
                "lock": VENUE_LOCKS[lock_key],
            }
        ),
        200,
    )


# ----------------------------------------------------------------------
# Guest List Ingestion & Deduplication (REQ-F-004, REQ-F-009, REQ-F-010, REQ-F-011)
# ----------------------------------------------------------------------


@app.route("/api/events/<event_id>/guests", methods=["GET"])
def api_get_guests(event_id: str) -> Tuple[Response, int]:
    with storage_lock:
        if event_id not in EVENTS:
            return jsonify({"error": "Event not found"}), 404
        guest_list = list(GUESTS.get(event_id, {}).values())
        return jsonify({"guests": guest_list, "total": len(guest_list)}), 200


def _parse_csv_records(csv_content: str) -> Tuple[List[Dict[str, str]], List[str]]:
    """Helper to parse and validate CSV schema."""
    reader = csv.DictReader(io.StringIO(csv_content))
    fieldnames = [f.strip().lower() for f in (reader.fieldnames or [])]
    rows = list(reader)
    return rows, fieldnames


@app.route("/api/events/<event_id>/guests/upload", methods=["POST"])
def api_upload_guests_csv(event_id: str) -> Tuple[Response, int]:
    """
    CSV Ingestion engine supporting up to 10,000 records per file.
    Executes case-insensitive email deduplication, omits duplicate rows in sheet,
    and updates existing guest records.
    """
    with storage_lock:
        if event_id not in EVENTS:
            return jsonify({"error": "Event not found"}), 404

    csv_content = ""
    if "file" in request.files:
        file_obj = request.files["file"]
        csv_content = file_obj.read().decode("utf-8", errors="ignore")
    elif request.data:
        csv_content = request.data.decode("utf-8", errors="ignore")
    elif request.is_json and "csv_data" in (request.get_json(silent=True) or {}):
        json_data = request.get_json(silent=True) or {}
        csv_content = cast(str, json_data.get("csv_data", ""))

    if not csv_content.strip():
        return jsonify({"error": "No CSV content provided"}), 400

    rows, fieldnames = _parse_csv_records(csv_content)
    if "email" not in fieldnames:
        return jsonify({"error": "Invalid CSV schema. Missing required column 'email'"}), 422

    seen_in_batch: set = set()
    inserted_count = 0
    updated_count = 0
    omitted_count = 0

    with storage_lock:
        event_guests = GUESTS.setdefault(event_id, {})

        for row in rows:
            normalized_row = {k.strip().lower(): v.strip() for k, v in row.items() if k}
            raw_email = normalized_row.get("email", "")
            if not raw_email or "@" not in raw_email:
                continue

            normalized_email = raw_email.lower()

            # REQ-F-010: Duplicate guest records within uploaded sheet omitted
            if normalized_email in seen_in_batch:
                omitted_count += 1
                continue
            seen_in_batch.add(normalized_email)

            guest_name = normalized_row.get("name", normalized_email.split("@")[0].capitalize())
            company = normalized_row.get("company", "Independent")
            dietary = normalized_row.get("dietary", "Standard")

            # REQ-F-011: Matching existing guests flagged for update rather than redundant insertion
            if normalized_email in event_guests:
                existing = event_guests[normalized_email]
                existing["name"] = guest_name
                existing["company"] = company
                existing["dietary"] = dietary
                updated_count += 1
            else:
                event_guests[normalized_email] = {
                    "id": f"g-{uuid.uuid4().hex[:8]}",
                    "name": guest_name,
                    "email": normalized_email,
                    "company": company,
                    "rsvp_status": RSVP_PENDING,
                    "dietary": dietary,
                }
                inserted_count += 1

    logger.info(
        f"CSV Ingestion for {event_id}: {inserted_count} inserted, {updated_count} updated, {omitted_count} omitted"
    )
    return (
        jsonify(
            {
                "status": "SUCCESS",
                "inserted": inserted_count,
                "updated": updated_count,
                "omitted_duplicates": omitted_count,
                "total_guests": len(GUESTS[event_id]),
            }
        ),
        200,
    )


# ----------------------------------------------------------------------
# Invitation Engine & RSVP Token Lifecycle (REQ-F-005, REQ-F-012, REQ-F-013)
# ----------------------------------------------------------------------


@app.route("/api/events/<event_id>/invitations/send", methods=["POST"])
def api_send_invitations(event_id: str) -> Tuple[Response, int]:
    """Generates unique UUID v4 tokens for event guests."""
    with storage_lock:
        if event_id not in EVENTS:
            return jsonify({"error": "Event not found"}), 404

        guests = GUESTS.get(event_id, {})
        generated = []
        for email, guest in guests.items():
            token = str(uuid.uuid4())
            INVITATIONS[token] = {
                "token": token,
                "event_id": event_id,
                "guest_email": email,
                "guest_name": guest["name"],
                "used": False,
                "created_at": datetime.utcnow().isoformat() + "Z",
            }
            generated.append({"email": email, "token": token, "rsvp_url": f"/rsvp/{token}"})

    logger.info(f"Generated {len(generated)} invitation tokens for {event_id}")
    return jsonify({"message": f"Issued {len(generated)} invitations", "invitations": generated}), 200


@app.route("/api/rsvp/<token>", methods=["GET", "POST"])
def api_rsvp(token: str) -> Tuple[Response, int]:
    """
    Guest RSVP portal endpoint.
    REQ-F-013: Token must be immediately invalidated upon submission.
    """
    with storage_lock:
        invitation = INVITATIONS.get(token)
        if not invitation:
            return jsonify({"error": "Invalid or expired RSVP token"}), 404

        if invitation["used"]:
            return (
                jsonify(
                    {
                        "error": "Token already used",
                        "message": "This RSVP link has already been submitted and is now invalid.",
                    }
                ),
                410,
            )

        event = EVENTS.get(invitation["event_id"], {})

        if request.method == "GET":
            return (
                jsonify(
                    {
                        "valid": True,
                        "token": token,
                        "guest_name": invitation["guest_name"],
                        "guest_email": invitation["guest_email"],
                        "event": {
                            "title": event.get("title"),
                            "date": event.get("date"),
                            "time_slot": event.get("time_slot"),
                            "description": event.get("description"),
                        },
                    }
                ),
                200,
            )

        # POST: Submit RSVP response
        data = request.get_json(silent=True) or {}
        rsvp_status = data.get("rsvp_status", RSVP_ATTENDING).upper()
        if rsvp_status not in [RSVP_ATTENDING, RSVP_DECLINED, RSVP_TENTATIVE]:
            return jsonify({"error": "Invalid RSVP status. Must be ATTENDING, DECLINED, or TENTATIVE"}), 400

        # Invalidate token immediately
        invitation["used"] = True
        invitation["submitted_status"] = rsvp_status
        invitation["submitted_at"] = datetime.utcnow().isoformat() + "Z"

        # Update guest record
        event_id = invitation["event_id"]
        email = invitation["guest_email"]
        if event_id in GUESTS and email in GUESTS[event_id]:
            GUESTS[event_id][email]["rsvp_status"] = rsvp_status

        logger.info(f"RSVP recorded for {email}: {rsvp_status}. Token {token} invalidated.")
        return (
            jsonify(
                {
                    "status": "SUCCESS",
                    "message": f"RSVP confirmed as {rsvp_status}",
                    "token_invalidated": True,
                }
            ),
            200,
        )


# ----------------------------------------------------------------------
# Executive Dashboard Metrics & Budget (REQ-F-007, REQ-N-005, REQ-N-006)
# ----------------------------------------------------------------------


@app.route("/api/dashboard/metrics", methods=["GET"])
def api_dashboard_metrics() -> Tuple[Response, int]:
    with storage_lock:
        total_events = len(EVENTS)
        total_guests = sum(len(guests) for guests in GUESTS.values())

        attending = 0
        declined = 0
        tentative = 0
        pending = 0

        for guests in GUESTS.values():
            for g in guests.values():
                status = g.get("rsvp_status")
                if status == RSVP_ATTENDING:
                    attending += 1
                elif status == RSVP_DECLINED:
                    declined += 1
                elif status == RSVP_TENTATIVE:
                    tentative += 1
                else:
                    pending += 1

        total_budget = sum(e.get("budget", 0.0) for e in EVENTS.values())
        total_allocated = sum(e.get("allocated_spend", 0.0) for e in EVENTS.values())
        budget_utilization = (total_allocated / total_budget * 100.0) if total_budget > 0 else 0.0

        return (
            jsonify(
                {
                    "total_events": total_events,
                    "total_guests": total_guests,
                    "rsvp_breakdown": {
                        "attending": attending,
                        "declined": declined,
                        "tentative": tentative,
                        "pending": pending,
                    },
                    "budget": {
                        "total_budget": total_budget,
                        "total_allocated": total_allocated,
                        "utilization_percent": round(budget_utilization, 1),
                    },
                    "active_venues": len(VENUES),
                    "active_locks": len(VENUE_LOCKS),
                }
            ),
            200,
        )


if __name__ == "__main__":
    app.run()
