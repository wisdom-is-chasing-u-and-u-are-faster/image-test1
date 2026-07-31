import os
from flask import Flask, render_template, request, redirect, url_for, session

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "bdcn-secret-key-69")

# In-memory storage for demonstration / testing
donors: list[dict] = []
demands = [
    {
        "id": 1,
        "hospital_name": "City General Hospital",
        "blood_type": "A+",
        "units_needed": 3,
        "urgency": "High",
        "status": "Approved"
    },
    {
        "id": 2,
        "hospital_name": "St. Jude Memorial",
        "blood_type": "O-",
        "units_needed": 5,
        "urgency": "Critical",
        "status": "Pending"
    }
]
admin_stats = {
    "total_donors": 120,
    "total_demands": 2,
    "approved_demands": 1,
    "pending_reviews": 1
}


@app.route("/")
def home():
    return redirect(url_for("donor_login"))


@app.route("/donor/register", methods=["GET", "POST"])
def donor_register():
    if request.method == "POST":
        full_name = request.form.get("full_name")
        email = request.form.get("email")
        blood_type = request.form.get("blood_type")
        donor = {
            "id": len(donors) + 1,
            "full_name": full_name,
            "email": email,
            "blood_type": blood_type
        }
        donors.append(donor)
        session["user_type"] = "donor"
        session["user_email"] = email
        session["user_name"] = full_name
        session["user_blood_type"] = blood_type
        return redirect(url_for("donor_profile"))
    return render_template("register_donor.html")


@app.route("/login/donor", methods=["GET", "POST"])
def donor_login():
    if request.method == "POST":
        email = request.form.get("email")
        session["user_type"] = "donor"
        session["user_email"] = email
        session["user_name"] = email.split("@")[0] if email else "Donor"
        session["user_blood_type"] = "O+"
        return redirect(url_for("donor_profile"))
    return render_template("login_donor.html")


@app.route("/donor/profile", methods=["GET", "POST"])
def donor_profile():
    if request.method == "POST":
        session["user_name"] = request.form.get("full_name", session.get("user_name"))
        session["user_blood_type"] = request.form.get("blood_type", session.get("user_blood_type"))
        return redirect(url_for("donor_profile"))
    return render_template("donor_profile.html")


@app.route("/login/hospital", methods=["GET", "POST"])
def hospital_login():
    if request.method == "POST":
        session["user_type"] = "hospital"
        session["hospital_name"] = request.form.get("hospital_name", "City Hospital")
        return redirect(url_for("hospital_dashboard"))
    return render_template("login_hospital.html")


@app.route("/hospital/create-demand", methods=["GET", "POST"])
def create_demand():
    if request.method == "POST":
        hospital_name = session.get("hospital_name", "City Hospital")
        blood_type = request.form.get("blood_type")
        units_needed = int(request.form.get("units_needed", 1))
        urgency = request.form.get("urgency", "Medium")
        demand = {
            "id": len(demands) + 1,
            "hospital_name": hospital_name,
            "blood_type": blood_type,
            "units_needed": units_needed,
            "urgency": urgency,
            "status": "Pending"
        }
        demands.append(demand)
        admin_stats["total_demands"] = len(demands)
        admin_stats["pending_reviews"] += 1
        return redirect(url_for("hospital_dashboard"))
    return render_template("create_demand.html")


@app.route("/hospital/dashboard")
def hospital_dashboard():
    return render_template("dashboard.html", demands=demands)


@app.route("/login/admin", methods=["GET", "POST"])
def admin_login():
    if request.method == "POST":
        session["user_type"] = "admin"
        return redirect(url_for("admin_dashboard"))
    return render_template("login_admin.html")


@app.route("/admin/dashboard")
def admin_dashboard():
    stats = {
        "total_donors": len(donors) + admin_stats["total_donors"],
        "total_demands": len(demands),
        "approved_demands": sum(1 for d in demands if d["status"] == "Approved"),
        "pending_reviews": sum(1 for d in demands if d["status"] == "Pending")
    }
    return render_template("admin-dashboard.html", stats=stats, demands=demands)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
