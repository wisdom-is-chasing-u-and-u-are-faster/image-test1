import os
from flask import Flask, render_template

app = Flask(__name__)


@app.route("/")
def index() -> str:
    """Render the home page."""
    return render_template("home.html")


@app.route("/home.html")
def home() -> str:
    """Render the home page."""
    return render_template("home.html")


@app.route("/about.html")
def about() -> str:
    """Render the about page."""
    return render_template("about.html")


@app.route("/products.html")
def products() -> str:
    """Render the products page."""
    return render_template("products.html")


@app.route("/services.html")
def services() -> str:
    """Render the services page."""
    return render_template("services.html")


@app.route("/blog.html")
def blog() -> str:
    """Render the blog listing page."""
    return render_template("blog.html")


@app.route("/blog-post.html")
def blog_post() -> str:
    """Render a single blog post page."""
    return render_template("blog-post.html")


@app.route("/contact.html")
def contact() -> str:
    """Render the contact us page."""
    return render_template("contact.html")


@app.route("/admin-login.html")
def admin_login() -> str:
    """Render the admin login page."""
    return render_template("admin-login.html")


@app.route("/admin-dashboard.html")
def admin_dashboard() -> str:
    """Render the admin dashboard."""
    return render_template("admin-dashboard.html")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)
