"""
BDCN Platform Web Application.

Provides UI routes for Blood Donor Connection Network (BDCN) Variant A UI pages:
- /login: User Authentication
- /dashboard: ER Coordinator Dashboard displaying blood inventory levels
- /search: ER Coordinator Donor Search interface
- /admin: System Administration status dashboard
- /inventory: Global aggregated blood inventory display
"""

from typing import Any, Dict, List, Tuple, Union
from flask import Flask, redirect, render_template, request, url_for

app = Flask(__name__)
app.secret_key = "bdcn-secret-key-arch-139"

INVENTORY_DATA: List[Dict[str, Any]] = [
    {"type": "A+", "units": 150, "status": "Optimal"},
    {"type": "A-", "units": 45, "status": "Low"},
    {"type": "B+", "units": 120, "status": "Optimal"},
    {"type": "B-", "units": 30, "status": "Critical"},
    {"type": "AB+", "units": 60, "status": "Optimal"},
    {"type": "AB-", "units": 15, "status": "Low"},
    {"type": "O+", "units": 200, "status": "Optimal"},
    {"type": "O-", "units": 25, "status": "Critical"},
]

SYSTEM_STATUS: Dict[str, Any] = {
    "status": "Healthy",
    "active_nodes": 12,
    "p99_latency_ms": 42,
    "cached_items": 10450,
}


@app.route("/")
def index() -> Any:
    """Redirect root path to login."""
    return redirect(url_for("login"))


@app.route("/login", methods=["GET", "POST"])
def login() -> Union[str, Any, Tuple[str, int]]:
    """
    Handle user login.

    AC: The UI must allow users to log in.
    """
    if request.method == "POST":
        username = request.form.get("username", "")
        password = request.form.get("password", "")
        if username and password:
            return redirect(url_for("dashboard"))
        return render_template("login.html", error="Invalid credentials"), 400
    return render_template("login.html")


@app.route("/dashboard")
def dashboard() -> str:
    """
    Display ER Coordinator dashboard with blood inventory levels.

    AC: The ER Coordinator dashboard must display blood inventory levels.
    """
    return render_template("dashboard.html", inventory=INVENTORY_DATA)


@app.route("/search", methods=["GET", "POST"])
def search() -> str:
    """
    Initiate donor search interface.

    AC: The ER Coordinator must be able to initiate a donor search.
    """
    query = request.args.get("q", "") if request.method == "GET" else request.form.get("q", "")
    blood_type = request.args.get("blood_type", "")
    results: List[Dict[str, Any]] = []
    if query or blood_type:
        results = [
            {
                "id": "D-101",
                "name": "John Doe",
                "blood_type": blood_type or "O+",
                "distance_km": 3.2,
                "status": "Available",
            },
            {
                "id": "D-102",
                "name": "Jane Smith",
                "blood_type": blood_type or "A-",
                "distance_km": 5.8,
                "status": "Available",
            },
        ]
    return render_template("search.html", query=query, blood_type=blood_type, results=results)


@app.route("/admin")
def admin() -> str:
    """
    Display System Administration dashboard.

    AC: The System Administration dashboard must provide an overview of the system status.
    """
    return render_template("admin.html", system=SYSTEM_STATUS)


@app.route("/inventory")
def inventory() -> str:
    """
    Display Global Inventory dashboard.

    AC: The Global Inventory dashboard must display an aggregated view of blood inventory.
    """
    total_units = sum(int(item["units"]) for item in INVENTORY_DATA)
    return render_template("inventory.html", inventory=INVENTORY_DATA, total_units=total_units)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
