import os
from flask import Flask, render_template

app = Flask(__name__)


@app.route("/")
def index() -> str:
    """Render the home page."""
    # This is the main entry point of the application
    return render_template("home.html")


@app.route("/home.html")
def home() -> str:
    """Render the home page."""
    # This route also renders the home page
    return render_template("home.html")


@app.route("/about.html")
def about() -> str:
    """Render the about page."""
    # This route renders the about page
    return render_template("about.html")


@app.route("/products.html")
def products() -> str:
    """Render the products page."""
    # This route renders the products page
    return render_template("products.html")


@app.route("/services.html")
def services() -> str:
    """Render the services page."""
    # This route renders the services page
    return render_template("services.html")


@app.route("/blog.html")
def blog() -> str:
    """Render the blog listing page."""
    # This route renders the blog listing page
    return render_template("blog.html")


@app.route("/blog-post.html")
def blog_post() -> str:
    """Render a single blog post page."""
    # This route renders a single blog post page
    return render_template("blog-post.html")


@app.route("/contact.html")
def contact() -> str:
    """Render the contact us page."""
    # This route renders the contact us page
    return render_template("contact.html")


@app.route("/admin-login.html")
def admin_login() -> str:
    """Render the admin login page."""
    # This route renders the admin login page
    return render_template("admin-login.html")


@app.route("/admin-dashboard.html")
def admin_dashboard() -> str:
    """Render the admin dashboard."""
    # This route renders the admin dashboard
    return render_template("admin-dashboard.html")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)
