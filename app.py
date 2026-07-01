import os
import re
import uuid
from flask import Flask, request, jsonify

app = Flask(__name__)

# Configured API Key for Authentication
API_KEY = os.environ.get("API_KEY", "test-api-key-123")

# Mock database for Content Service
MOCK_CONTENT = {
    "home": {
        "title": "Welcome to Our Corporate Website",
        "tagline": "Innovating the future of microservices.",
        "content": "This is the home page of our enterprise application platform."
    },
    "about": {
        "title": "About Us",
        "tagline": "Built with scalability in mind.",
        "content": "Our mission is to deliver high-performance cloud-native microservices."
    }
}


@app.before_request
def check_api_key():
    # Retrieve X-API-Key header
    provided_key = request.headers.get("X-API-Key")
    if not provided_key or provided_key != API_KEY:
        return jsonify({"error": "Unauthorized"}), 401


@app.route("/api/v1/content/<page_slug>", methods=["GET"])
def get_content(page_slug):
    """
    Content Service Endpoint: Retrieves page content.
    Returns 200 OK on success, or 404 Not Found if the page_slug is invalid.
    """
    try:
        if page_slug in MOCK_CONTENT:
            return jsonify(MOCK_CONTENT[page_slug]), 200
        return jsonify({"error": "Page not found"}), 404
    except Exception:
        return jsonify({"error": "Internal Server Error"}), 500


@app.route("/api/v1/leads", methods=["POST"])
def post_leads():
    """
    Lead Capture Service Endpoint: Accepts lead details from contact forms.
    Validates required fields ('name', 'email') and email format.
    Returns 201 Created with a unique Lead UUID on success, or 400 Bad Request.
    """
    try:
        # Check if the content is JSON
        if not request.is_json:
            return jsonify({"error": "Request body must be JSON"}), 400

        data = request.get_json() or {}
        name = data.get("name")
        email = data.get("email")

        # Validation of required fields
        if not name or not email:
            return jsonify({"error": "Missing required fields: 'name' and 'email' are required"}), 400

        # Simple email validation
        email_regex = r"^[^@]+@[^@]+\.[^@]+$"
        if not re.match(email_regex, email):
            return jsonify({"error": "Invalid email format"}), 400

        # Generate unique UUID for the lead
        lead_id = str(uuid.uuid4())

        return jsonify({"lead_id": lead_id}), 201
    except Exception:
        return jsonify({"error": "Internal Server Error"}), 500


# Error handlers for JSON API compliance
@app.errorhandler(404)
def resource_not_found(e):
    return jsonify({"error": "Not Found"}), 404


@app.errorhandler(500)
def internal_server_error(e):
    return jsonify({"error": "Internal Server Error"}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
