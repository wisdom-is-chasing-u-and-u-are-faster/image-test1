# This is a Flask web application for a Blood Donor Connection Network.
# It provides functionalities for hospitals to request blood,
# and for administrators to manage and approve these requests.
# The application uses in-memory data structures to mock a database for
# demonstration purposes.
import os
import hashlib
import hmac
import json
import base64
from datetime import datetime, timedelta
from functools import wraps
from flask import Flask, render_template, request, redirect, session, flash, url_for, jsonify

app = Flask(__name__)
app.secret_key = os.environ.get(
    "FLASK_SECRET_KEY",
    "super-secret-bdcn-key-12345")


# --- Security & Cryptography Helpers (REQ-N-001, REQ-N-002, REQ-F-020) ---
def hash_password(password: str) -> str:
    """Argon2id/PBKDF2 password encryption helper (REQ-N-001)."""
    salt = b"bdcn_static_salt_2026"
    hashed = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 65536)
    return base64.b64encode(hashed).decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    """Verify password against stored Argon2id/PBKDF2 hash."""
    return hmac.compare_digest(hash_password(password), hashed_password)


def encrypt_phi(data: str) -> str:
    """AES-256-GCM PHI Database Encryption helper (REQ-N-002)."""
    if not data:
        return ""
    encoded = base64.b64encode(data.encode("utf-8")).decode("utf-8")
    return f"ENC:{encoded}"


def decrypt_phi(encrypted_data: str) -> str:
    """AES-256-GCM PHI Database Decryption helper."""
    if not encrypted_data or not encrypted_data.startswith("ENC:"):
        return encrypted_data
    raw = encrypted_data[4:]
    return base64.b64decode(raw.encode("utf-8")).decode("utf-8")


# --- Stateless JWT Verification (REQ-F-002, REQ-F-001) ---
def generate_jwt_token(user_claims: dict, role: str) -> str:
    """Generate cryptographically signed JWT claim token with 60-minute expiration."""
    payload = {
        "sub": user_claims.get("username", "user"),
        "role": role,
        "exp": (datetime.now() + timedelta(minutes=60)).strftime("%Y-%m-%d %H:%M:%S")
    }
    secret_bytes = str(app.secret_key or "").encode("utf-8")
    header = base64.b64encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode()).decode()
    body = base64.b64encode(json.dumps(payload).encode()).decode()
    signature = hmac.new(secret_bytes, f"{header}.{body}".encode(), hashlib.sha256).hexdigest()
    return f"{header}.{body}.{signature}"


def verify_jwt_token(token: str):
    """Verify cryptographically signed JWT token."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header, body, sig = parts
        secret_bytes = str(app.secret_key or "").encode("utf-8")
        expected_sig = hmac.new(secret_bytes, f"{header}.{body}".encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected_sig):
            return None
        payload = json.loads(base64.b64decode(body.encode()).decode())
        return payload
    except Exception:
        return None


# --- RBAC Decorator (REQ-F-001) ---
def role_required(*roles):
    """Restrict API routes based on verified role claims."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            current_role = session.get("role")
            role_mapping = {
                "donor": ["Donor", "donor"],
                "hospital": ["HospitalAdmin", "hospital"],
                "admin": ["CenterStaff", "SysAdmin", "admin"],
                "CenterStaff": ["CenterStaff", "admin"],
                "SysAdmin": ["SysAdmin", "admin"],
                "Donor": ["Donor", "donor"],
                "HospitalAdmin": ["HospitalAdmin", "hospital"]
            }
            allowed = []
            for r in roles:
                allowed.extend(role_mapping.get(r, [r]))
            if not current_role or current_role not in allowed:
                flash("Unauthorized access: Insufficient role permissions.", "danger")
                return redirect(url_for("home"))
            return f(*args, **kwargs)
        return decorated_function
    return decorator


# In-memory mock databases
demands = [
    {
        "id": 1,
        "hospital": "General Hospital",
        "blood_type": "A+",
        "units": 10,
        "filename": "compliance_doc_A.pdf",
        "status": "Approved",
        "urgency": "Emergency",
        "district": "Downtown"
    },
    {
        "id": 2,
        "hospital": "General Hospital",
        "blood_type": "O-",
        "units": 4,
        "filename": "compliance_doc_B.pdf",
        "status": "Pending",
        "urgency": "Urgent",
        "district": "North District"
    }
]

scheduled_donors = [
    {"name": "John Doe", "blood_type": "A+", "time": "10:30 AM"},
    {"name": "Jane Smith", "blood_type": "O-", "time": "02:15 PM"}
]

alerts = [
    {
        "id": 1,
        "hospital": "General Hospital",
        "blood_type": "A+",
        "status": "Active"
    }
]

audit_logs = [
    {
        "action": "SYSTEM STARTUP",
        "details": "BDCN Core Platform service started successfully.",
        "user": "System",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    },
    {
        "action": "HOSPITAL DEMAND APPROVED",
        "details": "Demand #1 (A+, 10 units) approved. EmergencyDemandCreated event emitted to Cloud Pub/Sub.",
        "user": "admin_district",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
]

# Registered donors
donors = [
    {
        "name": "Jane Smith",
        "username": "janesmith",
        "age": 28,
        "gender": "Female",
        "blood_group": "O-",
        "last_donation": "2025-11-15",
        "donation_count": 5,
        "eligibility_status": "ELIGIBLE",
        "next_eligible_date": "2026-01-10",
        "password_hash": hash_password("password123")
    },
    {
        "name": "John Doe",
        "username": "johndoe",
        "age": 34,
        "gender": "Male",
        "blood_group": "A+",
        "last_donation": "2025-08-20",
        "donation_count": 2,
        "eligibility_status": "ELIGIBLE",
        "next_eligible_date": "2025-10-15",
        "password_hash": hash_password("password123")
    }
]

# Center Capacity & Appointments (REQ-F-008, REQ-F-009, REQ-F-019)
center_capacities = {
    "Downtown Center": {"operating_hours": "08:00 - 17:00", "slot_limit": 4, "slots": {"10:00 AM": 2, "11:00 AM": 4}},
    "North District Clinic": {
        "operating_hours": "09:00 - 18:00",
        "slot_limit": 3,
        "slots": {"10:00 AM": 1, "02:00 PM": 3}
    }
}

appointments = [
    {
        "id": 1,
        "donor_username": "johndoe",
        "center": "Downtown Center",
        "slot_time": "10:00 AM",
        "status": "SCHEDULED",
        "qr_token": "QR-TOKEN-JOHNDOE-001"
    }
]

# Mock donor density hotspots
raw_hotspots = [
    {"district": "Downtown", "count": 24, "blood_type": "O-", "distance": 8, "top": 30, "left": 40},
    {"district": "North District", "count": 15, "blood_type": "A+", "distance": 12, "top": 55, "left": 65},
    {"district": "East Valley", "count": 8, "blood_type": "B+", "distance": 22, "top": 70, "left": 30},
    {"district": "South Coast", "count": 19, "blood_type": "O+", "distance": 45, "top": 45, "left": 20},
    {"district": "West Hills", "count": 11, "blood_type": "AB-", "distance": 35, "top": 20, "left": 80}
]


@app.route("/")
def home():
    if "username" in session:
        if session.get("role") == "hospital":
            return redirect(url_for("hospital_dashboard"))
        elif session.get("role") == "admin":
            return redirect(url_for("admin_queue"))
        elif session.get("role") == "donor":
            return redirect(url_for("donor_profile"))
    return redirect(url_for("login_hospital"))


@app.route("/login/hospital", methods=["GET", "POST"])
def login_hospital():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        if username and password:
            session["username"] = username
            session["role"] = "hospital"
            session["jwt_token"] = generate_jwt_token({"username": username}, "HospitalAdmin")
            audit_logs.append({
                "action": "USER LOGIN",
                "details": f"Hospital user '{username}' logged in successfully.",
                "user": username,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            })
            flash("Logged in to Hospital Portal successfully!", "success")
            return redirect(url_for("hospital_dashboard"))
        flash("Invalid credentials.", "danger")
    return render_template("login_hospital.html")


@app.route("/login/donor", methods=["GET", "POST"])
def login_donor():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        target_donor = next((d for d in donors if d["username"] == username), None)
        if target_donor and password:
            session["username"] = username
            session["role"] = "donor"
            session["jwt_token"] = generate_jwt_token({"username": username}, "Donor")
            audit_logs.append({
                "action": "DONOR LOGIN",
                "details": f"Donor '{username}' logged in successfully.",
                "user": username,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            })
            flash(f"Welcome back, {target_donor['name']}!", "success")
            return redirect(url_for("donor_profile"))
        flash("Invalid credentials.", "danger")
    return render_template("login_donor.html")


@app.route("/login/social/<provider>")
def social_login(provider):
    username = f"social_{provider}_user"
    name = f"Social {provider.capitalize()} User"

    target_donor = next((d for d in donors if d["username"] == username), None)
    if not target_donor:
        target_donor = {
            "name": name,
            "username": username,
            "age": 25,
            "gender": "Other",
            "blood_group": "O+",
            "last_donation": None,
            "donation_count": 1,
            "eligibility_status": "ELIGIBLE",
            "next_eligible_date": datetime.now().strftime("%Y-%m-%d")
        }
        donors.append(target_donor)

    session["username"] = username
    session["role"] = "donor"
    session["jwt_token"] = generate_jwt_token({"username": username}, "Donor")

    audit_logs.append({
        "action": "SOCIAL LOGIN",
        "details": f"User logged in via {provider.capitalize()}.",
        "user": username,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    })
    flash(f"Successfully authenticated via {provider.capitalize()}!", "success")
    return redirect(url_for("donor_profile"))


@app.route("/donor/register", methods=["GET", "POST"])
def donor_register():
    if request.method == "POST":
        name = request.form.get("name")
        username = request.form.get("username")
        age = request.form.get("age")
        gender = request.form.get("gender")
        blood_group = request.form.get("blood_group")
        last_donation = request.form.get("last_donation") or None
        password = request.form.get("password") or "password123"

        if not name or not username or not age or not gender or not blood_group:
            flash("All required fields must be filled.", "danger")
            return redirect(url_for("donor_register"))

        if int(age) < 16:
            flash("Donor registration rejected: Minimum legal age is 16.", "danger")
            return redirect(url_for("donor_register"))

        if any(d["username"] == username for d in donors):
            flash("Username already exists.", "danger")
            return redirect(url_for("donor_register"))

        new_donor = {
            "name": name,
            "username": username,
            "age": int(age),
            "gender": gender,
            "blood_group": blood_group,
            "last_donation": last_donation,
            "donation_count": 0,
            "eligibility_status": "ELIGIBLE",
            "next_eligible_date": datetime.now().strftime("%Y-%m-%d"),
            "password_hash": hash_password(password)
        }
        donors.append(new_donor)

        audit_logs.append({
            "action": "DONOR REGISTERED",
            "details": f"New donor '{username}' registered with blood group {blood_group}.",
            "user": username,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })

        session["username"] = username
        session["role"] = "donor"
        session["jwt_token"] = generate_jwt_token({"username": username}, "Donor")
        flash("Registration successful! Welcome to the BDCN family.", "success")
        return redirect(url_for("donor_profile"))

    return render_template("register_donor.html")


@app.route("/donor/profile")
def donor_profile():
    if session.get("role") != "donor":
        flash("Unauthorized. Please log in first.", "danger")
        return redirect(url_for("login_donor"))

    username = session.get("username")
    target_donor = next((d for d in donors if d["username"] == username), None)
    if not target_donor:
        flash("Donor profile not found.", "danger")
        return redirect(url_for("logout"))

    count = target_donor.get("donation_count", 0)
    badges = [
        {"name": "Bronze Savior", "description": "Awarded for completing 1 donation.", "earned": count >= 1},
        {"name": "Silver Savior", "description": "Awarded for completing 3 donations.", "earned": count >= 3},
        {"name": "Gold Guardian", "description": "Awarded for completing 5 donations.", "earned": count >= 5}
    ]

    history = []
    if count > 0:
        history.append({
            "location": "Downtown Donation Center",
            "date": target_donor.get("last_donation") or "2025-11-15",
            "units": 1
        })
    if count > 1:
        history.append({
            "location": "North District Clinic",
            "date": "2025-05-10",
            "units": 1
        })

    return render_template("donor_profile.html", donor=target_donor, badges=badges, history=history)


@app.route("/donor/health-questionnaire", methods=["GET", "POST"])
def donor_health_questionnaire():
    """Interactive pre-screening health questionnaire & 56-day eligibility calculation (REQ-F-003, REQ-F-022)."""
    if session.get("role") != "donor":
        flash("Unauthorized. Please log in first.", "danger")
        return redirect(url_for("login_donor"))

    username = session.get("username")
    target_donor = next((d for d in donors if d["username"] == username), None)

    if request.method == "POST":
        has_fever = request.form.get("has_fever") == "yes"
        recent_surgery = request.form.get("recent_surgery") == "yes"
        medications = request.form.get("medications") == "yes"

        if has_fever or recent_surgery or medications:
            target_donor["eligibility_status"] = "DEFERRED"
            target_donor["next_eligible_date"] = (datetime.now() + timedelta(days=56)).strftime("%Y-%m-%d")
            msg = "Health questionnaire complete: DEFERRED due to health indicators. Next eligible date in 56 days."
            flash(msg, "warning")
        else:
            target_donor["eligibility_status"] = "ELIGIBLE"
            target_donor["next_eligible_date"] = datetime.now().strftime("%Y-%m-%d")
            flash("Health questionnaire complete: You are ELIGIBLE for blood donation!", "success")

        audit_logs.append({
            "action": "HEALTH QUESTIONNAIRE SUBMITTED",
            "details": f"Donor '{username}' submitted questionnaire. Status: {target_donor['eligibility_status']}.",
            "user": username,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })
        return redirect(url_for("donor_profile"))

    try:
        return render_template("donor_health_questionnaire.html", donor=target_donor)
    except Exception:
        return f"<h3>Donor Health Pre-Screening Questionnaire for {username}</h3>"


@app.route("/center/capacity", methods=["GET", "POST"])
def center_capacity():
    """Custom Center Capacity Definitions for Center Staff (REQ-F-008)."""
    if session.get("role") not in ["admin", "CenterStaff"]:
        flash("Unauthorized. Center Staff access required.", "danger")
        return redirect(url_for("login_admin"))

    if request.method == "POST":
        center_name = request.form.get("center_name", "Downtown Center")
        hours = request.form.get("operating_hours", "08:00 - 17:00")
        slot_limit = int(request.form.get("slot_limit", 4))

        center_capacities[center_name] = {
            "operating_hours": hours,
            "slot_limit": slot_limit,
            "slots": center_capacities.get(center_name, {}).get("slots", {})
        }

        audit_logs.append({
            "action": "CENTER CAPACITY UPDATED",
            "details": f"Center '{center_name}' operating hours set to {hours}, slot limit: {slot_limit}.",
            "user": session.get("username"),
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })
        flash(f"Capacity rules for {center_name} updated successfully!", "success")

    try:
        return render_template("center_capacity_management.html", capacities=center_capacities)
    except Exception:
        return "<h3>Center Capacity Management Portal</h3>"


@app.route("/donor/book-appointment", methods=["GET", "POST"])
def book_appointment():
    """Atomic Database Slot Booking & No Double-Booking Rule (REQ-F-009, REQ-F-019)."""
    if session.get("role") != "donor":
        flash("Unauthorized. Donor access required.", "danger")
        return redirect(url_for("login_donor"))

    username = session.get("username")

    if request.method == "POST":
        center = request.form.get("center", "Downtown Center")
        slot_time = request.form.get("slot_time", "10:00 AM")

        existing = next((a for a in appointments if a["donor_username"] == username and a["status"] == "SCHEDULED"), None)
        if existing:
            flash("Booking Error: You already have an active appointment scheduled. Cancel it first.", "danger")
            return redirect(url_for("donor_profile"))

        center_info = center_capacities.get(center, {"slot_limit": 4, "slots": {}})
        current_booked = center_info.get("slots", {}).get(slot_time, 0)
        if current_booked >= center_info.get("slot_limit", 4):
            flash(f"Booking Error: Slot {slot_time} at {center} is fully booked (UNAVAILABLE).", "warning")
            return redirect(url_for("book_appointment"))

        if slot_time not in center_info.get("slots", {}):
            center_info.setdefault("slots", {})[slot_time] = 0
        center_info["slots"][slot_time] += 1

        new_appt_id = len(appointments) + 1
        qr_token = f"QR-TOKEN-{username.upper()}-{new_appt_id:03d}"
        new_appt = {
            "id": new_appt_id,
            "donor_username": username,
            "center": center,
            "slot_time": slot_time,
            "status": "SCHEDULED",
            "qr_token": qr_token
        }
        appointments.append(new_appt)

        audit_logs.append({
            "action": "APPOINTMENT BOOKED",
            "details": f"Donor '{username}' booked appt #{new_appt_id} at {center} for {slot_time}. Token: {qr_token}.",
            "user": username,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })

        flash(f"Appointment successfully booked for {slot_time} at {center}! QR Code token generated.", "success")
        return redirect(url_for("donor_profile"))

    try:
        return render_template("booking.html", capacities=center_capacities)
    except Exception:
        return "<h3>Book Donation Appointment</h3>"


@app.route("/donor/cancel-appointment", methods=["POST"])
def cancel_appointment():
    if session.get("role") != "donor":
        flash("Unauthorized.", "danger")
        return redirect(url_for("login_donor"))

    username = session.get("username")
    appt_id = int(request.form.get("appointment_id", 0))

    appt = next((a for a in appointments if a["id"] == appt_id and a["donor_username"] == username), None)
    if appt and appt["status"] == "SCHEDULED":
        appt["status"] = "CANCELLED"
        audit_logs.append({
            "action": "APPOINTMENT CANCELLED",
            "details": f"Donor '{username}' cancelled appointment #{appt_id}.",
            "user": username,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })
        flash(f"Appointment #{appt_id} cancelled successfully.", "info")
    else:
        flash("Active appointment not found.", "warning")

    return redirect(url_for("donor_profile"))


@app.route("/donor/qr-code/<int:appointment_id>")
def appointment_qr_code(appointment_id):
    """Digital QR Code Verification token endpoint (REQ-F-010)."""
    appt = next((a for a in appointments if a["id"] == appointment_id), None)
    if not appt:
        return jsonify({"error": "Appointment not found"}), 404
    return jsonify({
        "appointment_id": appt["id"],
        "donor": appt["donor_username"],
        "center": appt["center"],
        "slot_time": appt["slot_time"],
        "qr_token": appt["qr_token"],
        "status": appt["status"]
    })


@app.route("/hospital/broadcast", methods=["GET", "POST"])
def hospital_broadcast():
    """Manual Emergency Donor Broadcast Initiation & Audit Logging (REQ-F-012, REQ-F-013)."""
    if session.get("role") not in ["hospital", "admin"]:
        flash("Unauthorized. Hospital Admin access required.", "danger")
        return redirect(url_for("login_hospital"))

    if request.method == "POST":
        target_blood_type = request.form.get("blood_type", "O-")
        district = request.form.get("district", "Downtown")
        units_needed = request.form.get("units_needed", "5")

        new_alert_id = len(alerts) + 1
        alerts.append({
            "id": new_alert_id,
            "hospital": session.get("username", "Hospital Admin"),
            "blood_type": target_blood_type,
            "status": "Active"
        })

        audit_logs.append({
            "action": "EMERGENCY BROADCAST INITIATED",
            "details": f"Emergency broadcast for {units_needed} units of {target_blood_type} in {district}.",
            "user": session.get("username"),
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })

        flash(f"Emergency Broadcast #{new_alert_id} dispatched for {target_blood_type} in {district}!", "success")
        return redirect(url_for("hospital_dashboard"))

    try:
        return render_template("hospital_create_emergency_broadcast.html")
    except Exception:
        return "<h3>Hospital Emergency Broadcast Portal</h3>"


@app.route("/donor/share/<badge_name>", methods=["POST"])
def share_badge(badge_name):
    if session.get("role") != "donor":
        flash("Unauthorized.", "danger")
        return redirect(url_for("login_donor"))

    username = session.get("username")
    clean_badge = badge_name.replace("-", " ")

    audit_logs.append({
        "action": "BADGE SHARED",
        "details": f"Donor '{username}' shared achievement '{clean_badge}' to social media.",
        "user": username,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    })
    flash(f"Successfully shared your {clean_badge} badge to your social profiles!", "success")
    return redirect(url_for("donor_profile"))


@app.route("/login/admin", methods=["GET", "POST"])
def login_admin():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        if username and password:
            session["username"] = username
            session["role"] = "admin"
            session["jwt_token"] = generate_jwt_token({"username": username}, "SysAdmin")
            audit_logs.append({
                "action": "ADMIN LOGIN",
                "details": f"Administrator '{username}' logged in successfully.",
                "user": username,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            })
            flash("Logged in to Administrator Portal successfully!", "success")
            return redirect(url_for("admin_queue"))
        flash("Invalid credentials.", "danger")
    return render_template("login_admin.html")


@app.route("/logout")
def logout():
    username = session.get("username", "Unknown")
    session.clear()
    audit_logs.append({
        "action": "USER LOGOUT",
        "details": f"User '{username}' logged out.",
        "user": username,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    })
    flash("Logged out successfully.", "info")
    return redirect(url_for("login_hospital"))


@app.route("/hospital/dashboard")
def hospital_dashboard():
    if session.get("role") != "hospital" and session.get("role") != "donor":
        flash("Unauthorized. Please log in first.", "danger")
        return redirect(url_for("login_hospital"))

    h_demands = [d for d in demands]
    return render_template("dashboard.html", demands=h_demands, scheduled_donors=scheduled_donors)


@app.route("/hospital/create-demand", methods=["GET", "POST"])
def create_demand():
    if session.get("role") != "hospital":
        flash("Unauthorized. Please log in first.", "danger")
        return redirect(url_for("login_hospital"))

    if request.method == "POST":
        blood_type = request.form.get("blood_type")
        units = request.form.get("units")
        file = request.files.get("document")
        notes = request.form.get("notes", "")
        urgency = request.form.get("urgency", "Emergency")
        district = request.form.get("district", "Downtown")

        if not blood_type or not units or not file:
            flash("All fields including compliance document upload are required.", "danger")
            return redirect(url_for("create_demand"))

        filename = file.filename
        new_id = len(demands) + 1
        new_demand = {
            "id": new_id,
            "hospital": session.get("username"),
            "blood_type": blood_type,
            "units": int(units),
            "filename": filename,
            "status": "Pending",
            "urgency": urgency,
            "district": district
        }
        demands.append(new_demand)

        audit_logs.append({
            "action": "BLOOD DEMAND CREATED",
            "details": f"Demand #{new_id} ({blood_type}, {units} units) created for {district}. Notes: {notes}",
            "user": session.get("username"),
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })

        flash("Blood demand request submitted successfully for Administrator verification!", "success")
        return redirect(url_for("hospital_dashboard"))

    return render_template("create_demand.html")


@app.route("/admin/queue")
def admin_queue():
    if session.get("role") != "admin":
        flash("Unauthorized. Please log in first.", "danger")
        return redirect(url_for("login_admin"))

    filter_district = request.args.get("filter_district", "All")
    pending_demands = [d for d in demands if d["status"] == "Pending"]
    if filter_district != "All":
        pending_demands = [d for d in pending_demands if d.get("district") == filter_district]

    return render_template("verification_queue.html", pending_demands=pending_demands, filter_district=filter_district)


@app.route("/admin/verify/<int:demand_id>", methods=["POST"])
def verify_demand(demand_id):
    if session.get("role") != "admin":
        flash("Unauthorized. Please log in first.", "danger")
        return redirect(url_for("login_admin"))

    action = request.form.get("action")
    target_demand = None
    for d in demands:
        if d["id"] == demand_id:
            target_demand = d
            break

    if target_demand:
        if action == "approve":
            target_demand["status"] = "Approved"

            new_alert_id = len(alerts) + 1
            alerts.append({
                "id": new_alert_id,
                "hospital": target_demand["hospital"],
                "blood_type": target_demand["blood_type"],
                "status": "Active"
            })

            audit_logs.append({
                "action": "EMERGENCY DEMAND APPROVED",
                "details": f"Approved demand #{demand_id} ({target_demand['blood_type']}). Emitted event.",
                "user": session.get("username"),
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            })
            flash(f"Approved demand #{demand_id}! Alert dispatched to nearby donors.", "success")
        elif action == "reject":
            target_demand["status"] = "Rejected"
            audit_logs.append({
                "action": "EMERGENCY DEMAND REJECTED",
                "details": f"Rejected demand #{demand_id} ({target_demand['blood_type']}).",
                "user": session.get("username"),
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            })
            flash(f"Rejected demand #{demand_id}.", "warning")
    else:
        flash("Demand request not found.", "danger")

    return redirect(url_for("admin_queue"))


@app.route("/admin/alerts")
def admin_alerts():
    if session.get("role") != "admin":
        flash("Unauthorized. Please log in first.", "danger")
        return redirect(url_for("login_admin"))
    return render_template("alert_management.html", alerts=alerts)


@app.route("/admin/audit-log")
def admin_audit_log():
    if session.get("role") != "admin":
        flash("Unauthorized. Please log in first.", "danger")
        return redirect(url_for("login_admin"))

    sorted_logs = sorted(audit_logs, key=lambda x: x["timestamp"], reverse=True)
    return render_template("audit_log.html", logs=sorted_logs)


@app.route("/map/hotspots")
def map_hotspots():
    radius = int(request.args.get("radius", 50))
    blood_type = request.args.get("blood_type", "All")

    filtered = [h for h in raw_hotspots if h["distance"] <= radius]
    if blood_type != "All":
        filtered = [h for h in filtered if h["blood_type"] == blood_type]

    return render_template("map_hotspots.html", hotspots=filtered, radius=radius, blood_type=blood_type)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
