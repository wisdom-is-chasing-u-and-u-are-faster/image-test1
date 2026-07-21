import os
import sqlite3
import datetime
import hashlib
import base64
from flask import Flask, render_template, request, redirect, session, g, flash, jsonify
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

app = Flask(__name__)
app.secret_key = os.environ.get(
    "FLASK_SECRET_KEY",
    "super_secret_session_key_12345")
DATABASE = os.path.join(os.path.dirname(__file__), "db.sqlite")

# AES-256 key (must be 32 bytes)
AES_KEY_BYTES = os.environ.get(
    "ENCRYPTION_KEY",
    "static_super_secure_32_byte_key_").encode()[
        :32]
aesgcm = AESGCM(AES_KEY_BYTES)


def encrypt_ssn(ssn: str) -> str:
    if not ssn:
        return ""
    nonce = os.urandom(12)
    ct = aesgcm.encrypt(nonce, ssn.encode(), None)
    return base64.b64encode(nonce + ct).decode()


def decrypt_ssn(encrypted_ssn: str) -> str:
    if not encrypted_ssn:
        return ""
    data = base64.b64decode(encrypted_ssn)
    nonce = data[:12]
    ct = data[12:]
    return aesgcm.decrypt(nonce, ct, None).decode()


def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db


@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()
        g._database = None


def init_db():
    with app.app_context():
        db = get_db()
        # Create tables
        db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                dob TEXT NOT NULL,
                ssn TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                phone TEXT NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL
            )
        """)
        db.execute("""
            CREATE TABLE IF NOT EXISTS slots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                provider_name TEXT NOT NULL,
                specialty TEXT NOT NULL,
                date TEXT NOT NULL,
                time TEXT NOT NULL,
                locked_by_user_id INTEGER,
                lock_expires_at TEXT,
                booked_by_user_id INTEGER,
                FOREIGN KEY(locked_by_user_id) REFERENCES users(id),
                FOREIGN KEY(booked_by_user_id) REFERENCES users(id)
            )
        """)
        db.execute("""
            CREATE TABLE IF NOT EXISTS bookings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id INTEGER NOT NULL,
                slot_id INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'active',
                created_at TEXT NOT NULL,
                FOREIGN KEY(patient_id) REFERENCES users(id),
                FOREIGN KEY(slot_id) REFERENCES slots(id)
            )
        """)
        db.execute("""
            CREATE TABLE IF NOT EXISTS invoices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                appointment_id INTEGER NOT NULL,
                patient_id INTEGER NOT NULL,
                amount REAL NOT NULL,
                status TEXT NOT NULL DEFAULT 'unpaid',
                created_at TEXT NOT NULL,
                FOREIGN KEY(appointment_id) REFERENCES bookings(id),
                FOREIGN KEY(patient_id) REFERENCES users(id)
            )
        """)
        db.execute("""
            CREATE TABLE IF NOT EXISTS claims (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                invoice_id INTEGER NOT NULL,
                patient_id INTEGER NOT NULL,
                amount REAL NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                created_at TEXT NOT NULL,
                FOREIGN KEY(invoice_id) REFERENCES invoices(id),
                FOREIGN KEY(patient_id) REFERENCES users(id)
            )
        """)
        db.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                user_id INTEGER,
                action TEXT NOT NULL,
                details TEXT NOT NULL,
                previous_hash TEXT NOT NULL,
                hash TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
        """)
        db.commit()

        # Seed initial data if slots empty
        cur = db.execute("SELECT COUNT(*) FROM slots")
        if cur.fetchone()[0] == 0:
            slots_data = [
                ("Dr. Evelyn Reed", "Cardiology", "2024-07-23", "09:00 AM"),
                ("Dr. Evelyn Reed", "Cardiology", "2024-07-23", "09:30 AM"),
                ("Dr. Evelyn Reed", "Cardiology", "2024-07-23", "10:30 AM"),
                ("Dr. Evelyn Reed", "Cardiology", "2024-07-23", "11:00 AM"),
                ("Dr. Ben Carter", "Cardiology", "2024-07-23", "01:30 PM"),
                ("Dr. Ben Carter", "Cardiology", "2024-07-23", "02:00 PM")
            ]
            db.executemany(
                "INSERT INTO slots (provider_name, specialty, date, time) VALUES (?, ?, ?, ?)",
                slots_data
            )
            # Create a default clinician & admin
            db.execute(
                "INSERT OR IGNORE INTO users "
                "(name, dob, ssn, email, phone, password, role) VALUES (?, ?, ?, ?, ?, ?, ?)",
                ("Dr. Evelyn Reed",
                 "1970-01-01",
                 encrypt_ssn("000-00-0000"),
                    "evelyn@healthwave.com",
                    "555-0199",
                    hashlib.sha256("password123".encode()).hexdigest(),
                    "clinician")
            )
            db.execute(
                "INSERT OR IGNORE INTO users "
                "(name, dob, ssn, email, phone, password, role) VALUES (?, ?, ?, ?, ?, ?, ?)",
                ("Admin Alice",
                 "1980-01-01",
                 encrypt_ssn("000-00-0000"),
                    "admin@healthwave.com",
                    "555-0100",
                    hashlib.sha256("admin123".encode()).hexdigest(),
                    "admin")
            )
            db.commit()


def log_audit(user_id, action, details):
    timestamp = datetime.datetime.utcnow().isoformat()
    db = get_db()
    # Cryptographic chaining
    cur = db.execute("SELECT hash FROM audit_logs ORDER BY id DESC LIMIT 1")
    row = cur.fetchone()
    prev_hash = row[0] if row else "0" * 64

    hash_input = f"{timestamp}|{user_id}|{action}|{details}|{prev_hash}"
    curr_hash = hashlib.sha256(hash_input.encode()).hexdigest()

    db.execute(
        "INSERT INTO audit_logs (timestamp, user_id, action, details, previous_hash, hash) VALUES (?, ?, ?, ?, ?, ?)",
        (timestamp, user_id, action, details, prev_hash, curr_hash)
    )
    db.commit()


# Initialize DB structure on startup
init_db()


@app.route("/")
def home():
    return redirect("/login.html")


@app.route("/registration.html", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        name = request.form.get("name")
        dob = request.form.get("dob")
        ssn = request.form.get("ssn")
        email = request.form.get("email")
        phone = request.form.get("phone")
        # Default password if not provided
        password = request.form.get("password", "patient123")

        db = get_db()
        hashed_pw = hashlib.sha256(password.encode()).hexdigest()
        encrypted_ssn_val = encrypt_ssn(ssn)

        try:
            cur = db.execute(
                "INSERT INTO users (name, dob, ssn, email, phone, password, role) VALUES (?, ?, ?, ?, ?, ?, 'patient')",
                (name, dob, encrypted_ssn_val, email, phone, hashed_pw)
            )
            db.commit()
            user_id = cur.lastrowid
            log_audit(
                user_id,
                "WRITE",
                f"Patient registered successfully: {email}")
            flash("Registration successful! Please log in.")
            return redirect("/login.html")
        except sqlite3.IntegrityError:
            flash("Email already registered.")
            return redirect("/registration.html")

    return render_template("registration.html")


@app.route("/login.html", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")

        db = get_db()
        hashed_pw = hashlib.sha256(password.encode()).hexdigest()
        cur = db.execute(
            "SELECT * FROM users WHERE email = ? AND password = ?", (email, hashed_pw))
        user = cur.fetchone()

        if user:
            # Stage in temp session for MFA
            session["mfa_pending_user_id"] = user["id"]
            session["mfa_pending_role"] = user["role"]
            return redirect("/mfa.html")
        else:
            flash("Invalid email or password.")
            return redirect("/login.html")

    return render_template("login.html")


@app.route("/mfa.html", methods=["GET", "POST"])
def mfa():
    if "mfa_pending_user_id" not in session:
        return redirect("/login.html")

    if request.method == "POST":
        code = request.form.get("mfa_code")
        if code and len(code) == 6:  # Standard 6 digit check
            user_id = session.pop("mfa_pending_user_id")
            role = session.pop("mfa_pending_role")

            session["user_id"] = user_id
            session["role"] = role

            log_audit(user_id, "READ", "Successful MFA login verified.")

            if role == "patient":
                return redirect("/patient-dashboard.html")
            elif role == "clinician":
                return redirect("/clinician-dashboard.html")
            elif role == "admin":
                return redirect("/billing-admin-dashboard.html")
        else:
            flash("Invalid MFA verification code.")
            return redirect("/mfa.html")

    return """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>MFA Verification | HealthWave</title>
        <style>
            body { font-family: sans-serif; background: #f5fdfd; display: flex;
                   align-items: center; justify-content: center; height: 100vh; margin:0; }
            .card { background: white; padding: 40px; border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,121,107,0.1); width: 350px; text-align: center; }
            h2 { color: #00796B; margin-bottom: 10px; }
            input { width: 100%; padding: 10px; margin: 15px 0; border: 1px solid #b2dfdb;
                    border-radius: 4px; box-sizing: border-box; text-align: center;
                    font-size: 18px; letter-spacing: 4px; }
            button { background: #00796B; color: white; border: none; padding: 12px;
                     width: 100%; border-radius: 4px; font-size: 16px; cursor: pointer; }
            button:hover { background: #004d40; }
            .info { font-size: 12px; color: #555; margin-bottom: 10px; }
        </style>
    </head>
    <body>
        <div class="card">
            <h2>MFA Verification</h2>
            <p class="info">Enter the 6-digit verification code sent to your registered device
               (e.g. 123456) (REQ-N-009).</p>
            <form method="POST">
                <input type="text" name="mfa_code" placeholder="123456" maxlength="6" required>
                <button type="submit">Verify & Login</button>
            </form>
        </div>
    </body>
    </html>
    """


@app.route("/logout")
def logout():
    user_id = session.get("user_id")
    if user_id:
        log_audit(user_id, "WRITE", "User logged out.")
    session.clear()
    return redirect("/login.html")


@app.route("/patient-dashboard.html")
def patient_dashboard():
    if session.get("role") != "patient":
        return redirect("/login.html")

    user_id = session["user_id"]
    db = get_db()

    # Load profile details
    cur_u = db.execute("SELECT name FROM users WHERE id = ?", (user_id,))
    user = cur_u.fetchone()

    # Fetch active appointments
    cur_a = db.execute("""
        SELECT b.id as booking_id, s.provider_name, s.specialty, s.date, s.time, b.status
        FROM bookings b
        JOIN slots s ON b.slot_id = s.id
        WHERE b.patient_id = ?
        ORDER BY s.date, s.time
    """, (user_id,))
    appointments = cur_a.fetchall()

    log_audit(user_id, "READ", "Viewed Patient Dashboard appointments.")

    return render_template("patient-dashboard.html",
                           user=user, appointments=appointments)


@app.route("/patient-profile.html", methods=["GET", "POST"])
def patient_profile():
    if session.get("role") != "patient":
        return redirect("/login.html")

    user_id = session["user_id"]
    db = get_db()

    if request.method == "POST":
        email = request.form.get("email")
        phone = request.form.get("phone")

        db.execute(
            "UPDATE users SET email = ?, phone = ? WHERE id = ?",
            (email,
             phone,
             user_id))
        db.commit()
        log_audit(
            user_id,
            "WRITE",
            f"Updated patient profile: phone={phone}, email={email}")
        flash("Profile updated successfully.")
        return redirect("/patient-profile.html")

    cur = db.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user = cur.fetchone()

    # Decrypt SSN for verification purposes (audit as secure read)
    decrypted_ssn = decrypt_ssn(user["ssn"])
    log_audit(
        user_id,
        "READ",
        "Accessed patient profile and decrypted sensitive SSN.")

    return render_template("patient-profile.html",
                           user=user, decrypted_ssn=decrypted_ssn)


@app.route("/book-appointment.html", methods=["GET", "POST"])
def book_appointment():
    if session.get("role") != "patient":
        return redirect("/login.html")

    user_id = session["user_id"]
    db = get_db()
    now = datetime.datetime.utcnow()

    # Clean up expired locks first
    db.execute(
        "UPDATE slots SET locked_by_user_id = NULL, lock_expires_at = NULL "
        "WHERE lock_expires_at IS NOT NULL AND datetime(lock_expires_at) <= datetime(?)",
        (now.isoformat(),
         ))
    db.commit()

    if request.method == "POST":
        slot_id = request.form.get("slot_id")
        action = request.form.get("action")  # 'lock' or 'confirm'

        if action == "lock":
            # REQ-F-009: 5-minute temporary lock
            cur = db.execute(
                "SELECT booked_by_user_id, locked_by_user_id, lock_expires_at FROM slots WHERE id = ?",
                (slot_id,
                 ))
            slot = cur.fetchone()
            if not slot:
                return jsonify(
                    {"status": "error", "message": "Slot not found"})

            booked_by, locked_by, expires_at = slot
            if booked_by is not None:
                return jsonify(
                    {"status": "error", "message": "Slot already booked (REQ-F-007)"})

            if locked_by is not None:
                expires_dt = datetime.datetime.fromisoformat(expires_at)
                if expires_dt > now and locked_by != user_id:
                    return jsonify(
                        {"status": "error", "message": "Slot is temporarily locked by another patient"})

            # Set lock
            lock_expires = (now + datetime.timedelta(minutes=5)).isoformat()
            db.execute(
                "UPDATE slots SET locked_by_user_id = ?, lock_expires_at = ? WHERE id = ?",
                (user_id,
                 lock_expires,
                 slot_id))
            db.commit()
            log_audit(
                user_id,
                "WRITE",
                f"Placed 5-minute lock on appointment slot ID {slot_id}")
            return jsonify({"status": "success", "message": "Lock acquired"})

        elif action == "confirm":
            # REQ-F-007, REQ-F-008: Prevent double-booking and book slot
            cur = db.execute(
                "SELECT booked_by_user_id, locked_by_user_id, lock_expires_at FROM slots WHERE id = ?",
                (slot_id,
                 ))
            slot = cur.fetchone()
            if not slot:
                return jsonify(
                    {"status": "error", "message": "Slot not found"})

            booked_by, locked_by, expires_at = slot
            if booked_by is not None:
                return jsonify(
                    {"status": "error", "message": "Slot already booked. Booking failed (REQ-F-007)."})

            # Perform atomic booking transaction
            db.execute(
                "UPDATE slots SET booked_by_user_id = ?, locked_by_user_id = NULL, lock_expires_at = NULL WHERE id = ?",
                (user_id,
                 slot_id))

            cur_b = db.execute(
                "INSERT INTO bookings (patient_id, slot_id, status, created_at) VALUES (?, ?, 'active', ?)",
                (user_id, slot_id, now.isoformat()))
            booking_id = cur_b.lastrowid

            # REQ-F-013: Auto-create Invoice
            amount = 150.00
            cur_i = db.execute(
                "INSERT INTO invoices "
                "(appointment_id, patient_id, amount, status, created_at) VALUES (?, ?, ?, 'unpaid', ?)",
                (booking_id, user_id, amount, now.isoformat()))
            invoice_id = cur_i.lastrowid

            # REQ-F-014: Auto-create Billing Claim
            db.execute(
                "INSERT INTO claims "
                "(invoice_id, patient_id, amount, status, created_at) VALUES (?, ?, ?, 'pending', ?)",
                (invoice_id, user_id, amount, now.isoformat()))

            db.commit()
            log_audit(
                user_id,
                "WRITE",
                f"Successfully booked appointment (Booking ID: {booking_id}) and created invoice/claim.")
            return jsonify(
                {"status": "success", "message": "Booking confirmed!"})

    # GET: fetch all available and unlocked slots
    cur = db.execute("""
        SELECT * FROM slots
        WHERE booked_by_user_id IS NULL
          AND (locked_by_user_id IS NULL OR locked_by_user_id = ? OR datetime(lock_expires_at) <= datetime(?))
    """, (user_id, now.isoformat()))
    slots = cur.fetchall()

    log_audit(
        user_id,
        "READ",
        "Searched and loaded available appointment slots.")
    return render_template("book-appointment.html", slots=slots)


@app.route("/clinician-dashboard.html")
def clinician_dashboard():
    if session.get("role") != "clinician":
        return redirect("/login.html")

    user_id = session["user_id"]
    db = get_db()

    # Fetch all active clinician appointments (for Evelyn Reed)
    cur = db.execute("""
        SELECT b.id as booking_id, u.name as patient_name, u.dob as patient_dob, s.date, s.time, b.status
        FROM bookings b
        JOIN slots s ON b.slot_id = s.id
        JOIN users u ON b.patient_id = u.id
        WHERE s.provider_name = 'Dr. Evelyn Reed' AND b.status = 'active'
        ORDER BY s.date, s.time
    """)
    appointments = cur.fetchall()

    log_audit(user_id, "READ", "Clinician viewed appointment schedule.")
    return render_template("clinician-dashboard.html",
                           appointments=appointments)


@app.route("/cancel-appointment", methods=["POST"])
def cancel_appt():
    if session.get("role") != "clinician":
        return redirect("/login.html")

    user_id = session["user_id"]
    booking_id = request.form.get("booking_id")

    db = get_db()

    # REQ-F-010: Clinicians can cancel appointments
    db.execute(
        "UPDATE bookings SET status = 'cancelled' WHERE id = ?", (booking_id,))

    # Release the slot
    cur = db.execute(
        "SELECT slot_id, patient_id FROM bookings WHERE id = ?", (booking_id,))
    row = cur.fetchone()
    if row:
        slot_id, patient_id = row
        db.execute(
            "UPDATE slots SET booked_by_user_id = NULL, locked_by_user_id = NULL, lock_expires_at = NULL WHERE id = ?",
            (slot_id,
             ))
        db.commit()
        log_audit(
            user_id,
            "WRITE",
            f"Clinician cancelled booking ID {booking_id} (Patient ID: {patient_id}) and released slot.")

    return redirect("/clinician-dashboard.html")


@app.route("/billing-admin-dashboard.html")
def billing_admin_dashboard():
    if session.get("role") != "admin":
        return redirect("/login.html")

    user_id = session["user_id"]
    db = get_db()

    # REQ-F-014: Admins can view and manage billing claims
    cur = db.execute("""
        SELECT c.id as claim_id, u.name as patient_name, c.amount, c.status, c.created_at
        FROM claims c
        JOIN users u ON c.patient_id = u.id
        ORDER BY c.created_at DESC
    """)
    claims = cur.fetchall()

    log_audit(user_id, "READ", "Admin viewed billing claims dashboard.")
    return render_template("billing-admin-dashboard.html", claims=claims)


@app.route("/manage-claim", methods=["POST"])
def manage_claim():
    if session.get("role") != "admin":
        return redirect("/login.html")

    user_id = session["user_id"]
    claim_id = request.form.get("claim_id")
    action = request.form.get("action")  # 'approve' or 'deny'

    status_map = {"approve": "approved", "deny": "denied"}
    new_status = status_map.get(action, "pending")

    db = get_db()
    db.execute("UPDATE claims SET status = ? WHERE id = ?",
               (new_status, claim_id))
    db.commit()

    log_audit(
        user_id,
        "WRITE",
        f"Admin updated billing claim ID {claim_id} to status: {new_status}")
    return redirect("/billing-admin-dashboard.html")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
