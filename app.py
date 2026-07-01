# app.py — Flask application scaffolded by jira_to_code for ARCH-3119
"""
Corporate Website Development Flask application.
This application serves all pages (Home, About, Products, Services, Blog, Contact, Admin)
with dynamic blog posts, a mock contact lead-capture form, and a session-based secure admin dashboard.
"""

from datetime import datetime
from flask import Flask, abort, redirect, render_template, request, session, jsonify

# Initialize the Flask application
app = Flask(__name__)
# Set a secret key for session management, required for secure admin login
app.secret_key = "super_secret_session_key_for_corporate_website_development_project"

# In-memory database of blog posts (AC: The user must be able to view a list of blog posts and click to read a full post.)
# This list of dictionaries holds the data for our blog posts.
BLOG_POSTS = [
    {
        "id": 1,
        "title": "The Future of AI in Business",
        "date": "October 26, 2023",
        "author": "Jane Doe",
        "image": "https://via.placeholder.com/800x400.png/F6F9FC/525F7F?text=AI+in+Business",
        "excerpt": "Explore how artificial intelligence is reshaping industries and what it means for you.",
        "content": (
            "<p>Artificial intelligence (AI) is no longer a futuristic concept; it's a present-day reality that is "
            "fundamentally transforming the business landscape. From automating routine tasks to providing deep "
            "predictive insights, AI is empowering organizations to operate with unprecedented efficiency and "
            "intelligence.</p><h3>Enhanced Customer Experiences</h3><p>One of the most significant impacts "
            "of AI is in the realm of customer service. AI-powered chatbots provide 24/7 support, answering "
            "customer queries instantly. Personalization engines analyze user behavior to offer tailored "
            "recommendations, creating a more engaging and satisfying customer journey.</p><h3>Data-Driven "
            "Decision Making</h3><p>Businesses are collecting more data than ever before. AI and machine learning "
            "algorithms can sift through vast datasets to identify trends, predict future outcomes, and uncover "
            "opportunities that would be impossible for humans to spot. This enables leaders to make strategic "
            "decisions with greater confidence.</p>"
        )
    },
    {
        "id": 2,
        "title": "Cybersecurity Best Practices for 2024",
        "date": "November 12, 2023",
        "author": "John Smith",
        "image": "https://via.placeholder.com/800x400.png/F6F9FC/525F7F?text=Cybersecurity",
        "excerpt": "In an increasingly digital world, protecting your assets is more important than ever.",
        "content": (
            "<p>Cybersecurity is a critical consideration for businesses of all sizes. As threats become more "
            "sophisticated, organizations must adopt comprehensive measures to guard against data breaches, "
            "malware, and ransomware.</p><h3>Implement Strong Access Controls</h3><p>Ensure that only authorized "
            "users can access sensitive systems and information. This involves using multi-factor authentication "
            "(MFA) and enforcing strong, unique passwords across all user accounts.</p><h3>Regular Employee "
            "Training</h3><p>Human error is one of the leading causes of security incidents. Conducting regular "
            "security awareness training helps employees recognize phishing attempts, social engineering tactics, "
            "and other malicious activities.</p>"
        )
    },
    {
        "id": 3,
        "title": "Maximizing Your Cloud Investment",
        "date": "December 05, 2023",
        "author": "Alice Johnson",
        "image": "https://via.placeholder.com/800x400.png/F6F9FC/525F7F?text=Cloud+Investment",
        "excerpt": "Are you getting the most out of your cloud services? Here are some tips to optimize your spend.",
        "content": (
            "<p>Cloud computing offers unmatched scalability and flexibility. However, without proper governance "
            "and optimization, cloud costs can quickly spiral out of control.</p><h3>Right-Size Your "
            "Infrastructure</h3><p>Analyze your resource utilization to identify oversized or underutilized "
            "instances. Downsizing these resources to match actual workloads can lead to substantial cost "
            "savings.</p><h3>Implement Automated Scheduling</h3><p>Turn off non-production resources (such as "
            "development and test environments) during non-working hours. Automated scheduling ensures that "
            "you are only paying for resources when they are actively being used.</p>"
        )
    }
]

# In-memory storage for contact submissions (AC: Contact Us page with a contact form)
# This list will store all the contact form submissions.
CONTACT_SUBMISSIONS: list[dict[str, str]] = []


# Helper decorator to restrict dashboard to authenticated session users
def login_required(func):
    """Decorator to require login for specific routes."""
    def wrapper(*args, **kwargs):
        # If the user is not logged in, redirect them to the login page.
        if not session.get("logged_in"):
            return redirect("/admin-login")
        # If the user is logged in, proceed to the decorated function.
        return func(*args, **kwargs)
    wrapper.__name__ = func.__name__
    return wrapper


# Route definitions mapping standard endpoints and duplicate HTML extensions
# The following routes render the main pages of the corporate website.

@app.route("/")
@app.route("/home")
@app.route("/home.html")
def home():
    """Renders the Home page view (REQ-F-001)."""
    return render_template("home.html")


@app.route("/about")
@app.route("/about.html")
def about():
    """Renders the About page view (REQ-F-002)."""
    return render_template("about.html")


@app.route("/products")
@app.route("/products.html")
def products():
    """Renders the Products page view (REQ-F-003)."""
    return render_template("products.html")


@app.route("/services")
@app.route("/services.html")
def services():
    """Renders the Services page view."""
    return render_template("services.html")


@app.route("/blog")
@app.route("/blog.html")
def blog():
    """Renders the Blog page list view (REQ-F-004), passing in the blog posts."""
    return render_template("blog.html", posts=BLOG_POSTS)


@app.route("/blog-post")
@app.route("/blog-post.html")
def blog_post():
    """Renders a single dynamic Blog Post details view (AC: click to read a full post)."""
    # Get the post ID from the query string, default to 1.
    post_id = request.args.get("id", 1, type=int)
    # Find the post with the matching ID.
    post = next((p for p in BLOG_POSTS if p["id"] == post_id), None)
    # If the post is not found, return a 404 error.
    if not post:
        abort(404)
    # Render the blog post template with the post data.
    return render_template("blog-post.html", post=post)


@app.route("/contact", methods=["GET", "POST"])
@app.route("/contact.html", methods=["GET", "POST"])
def contact():
    """Handles GET and POST for Contact Us page (REQ-F-005)."""
    # If the form is submitted (POST request).
    if request.method == "POST":
        name = request.form.get("name")
        email = request.form.get("email")
        message = request.form.get("message")

        # Basic validation to ensure fields are not empty.
        if not name or not email or not message:
            return jsonify({"status": "error", "message": "Missing form fields"}), 400

        # Store the submission in our in-memory list.
        submission = {
            "name": name,
            "email": email,
            "message": message,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        CONTACT_SUBMISSIONS.append(submission)
        # Return a success response.
        return jsonify({"status": "success", "message": "Form submitted successfully!"})

    # Render the contact page for GET requests.
    return render_template("contact.html")


@app.route("/admin-login", methods=["GET", "POST"])
@app.route("/admin-login.html", methods=["GET", "POST"])
def admin_login():
    """Handles Admin secure authentication area (AC: An admin user must be able to log in)."""
    # If the login form is submitted.
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        # Hardcoded credentials for demonstration purposes.
        if username == "admin" and password == "admin123":
            session["logged_in"] = True
            return redirect("/admin-dashboard")
        else:
            # Show an error if credentials are invalid.
            return render_template("admin-login.html", error="Invalid credentials. Please use admin / admin123.")

    # Render the login page for GET requests.
    return render_template("admin-login.html")


@app.route("/admin-dashboard")
@app.route("/admin-dashboard.html")
@login_required
def admin_dashboard():
    """Renders the secure Admin Area dashboard (REQ-F-006)."""
    # Pass the contact submissions to the dashboard template.
    return render_template("admin-dashboard.html", submissions=CONTACT_SUBMISSIONS)


@app.route("/logout")
@app.route("/logout.html")
def logout():
    """Logs out the admin and clears session."""
    session.pop("logged_in", None)
    return redirect("/home")


# Main entry point for the application
if __name__ == "__main__":
    # Run the Flask app in debug mode.
    app.run(host="0.0.0.0", port=5000, debug=True)
