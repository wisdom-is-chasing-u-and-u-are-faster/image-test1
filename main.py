import os
import json
from datetime import datetime
from flask import Flask, render_template, request, jsonify, abort

app = Flask(__name__)


def load_content():
    """Loads static content from content.json as the CMS data."""
    content_path = os.path.join(os.path.dirname(__file__), "content.json")
    if not os.path.exists(content_path):
        return {}
    with open(content_path, "r", encoding="utf-8") as f:
        return json.load(f)


@app.route("/")
def home():
    """Renders the homepage containing Hero, CTA, Service Matrix, Key Drivers, and Contact Form."""
    content = load_content()
    return render_template(
        "home.html",
        site_name=content.get("site_name", "Vertex IT Services"),
        hero=content.get("hero", {}),
        value_proposition=content.get("value_proposition", {}),
        services=content.get("services", {}),
        key_drivers=content.get("key_drivers", {})
    )


@app.route("/services/<service_key>")
def service_page(service_key):
    """Renders details and dynamic architectural diagram for a specific service track."""
    content = load_content()
    services = content.get("services", {})
    if service_key not in services:
        abort(404, description=f"Service track '{service_key}' not found.")

    return render_template(
        "service.html",
        site_name=content.get("site_name", "Vertex IT Services"),
        service_key=service_key,
        service=services[service_key]
    )


@app.route("/about")
def about():
    """Renders leadership profiles and corporate locations with Google Maps."""
    content = load_content()
    google_maps_api_key = os.environ.get("GOOGLE_MAPS_API_KEY", "")
    return render_template(
        "about.html",
        site_name=content.get("site_name", "Vertex IT Services"),
        team=content.get("team", []),
        locations=content.get("locations", []),
        google_maps_api_key=google_maps_api_key
    )


@app.route("/submit-lead", methods=["POST"])
def submit_lead():
    """Captures lead details and logs them to leads.log in a structured format."""
    name = request.form.get("name", "").strip()
    email = request.form.get("email", "").strip()
    company = request.form.get("company", "").strip()
    service_track = request.form.get("service_track", "").strip()
    message = request.form.get("message", "").strip()

    if not name or not email:
        return jsonify(
            {"status": "ERROR", "message": "Name and email are required fields."}), 400

    lead_data = {
        "timestamp": datetime.utcnow().isoformat(),
        "name": name,
        "email": email,
        "company": company,
        "service_track": service_track,
        "message": message
    }

    # Synchronously write structured lead data to leads.log
    log_line = f"{datetime.utcnow().isoformat()} - {json.dumps(lead_data)}\n"
    with open("leads.log", "a", encoding="utf-8") as f:
        f.write(log_line)

    return jsonify(
        {"status": "SUCCESS", "message": "Lead captured successfully!"})


@app.errorhandler(404)
def page_not_found(e):
    content = load_content()
    return render_template(
        "base.html",
        site_name=content.get("site_name", "Vertex IT Services"),
        error_title="404 - Not Found",
        error_message=e.description or "The page you are looking for does not exist."
    ), 404


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
