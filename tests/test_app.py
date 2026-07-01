# tests/test_app.py — Flask tests scaffolded by jira_to_code for ARCH-3119
"""
Unit and integration tests for Corporate Website Development Flask application.
"""

import pytest
from app import app, CONTACT_SUBMISSIONS, BLOG_POSTS


@pytest.fixture
def client():
    """Test client fixture for Flask app."""
    app.config["TESTING"] = True
    app.config["WTF_CSRF_ENABLED"] = False
    with app.test_client() as client:
        yield client


@pytest.fixture(autouse=True)
def clean_db():
    """Fixture to clean in-memory contact submissions before each test."""
    CONTACT_SUBMISSIONS.clear()


def test_home_pages(client):
    """Verify Home page serves 200 OK across duplicate routes (REQ-F-001)."""
    for route in ["/", "/home", "/home.html"]:
        res = client.get(route)
        assert res.status_code == 200
        assert b"Home" in res.data or b"Corporate" in res.data


def test_about_pages(client):
    """Verify About page serves 200 OK across duplicate routes (REQ-F-002)."""
    for route in ["/about", "/about.html"]:
        res = client.get(route)
        assert res.status_code == 200
        assert b"About" in res.data


def test_products_and_services_pages(client):
    """Verify Products & Services pages serve 200 OK (REQ-F-003)."""
    for route in ["/products", "/products.html", "/services", "/services.html"]:
        res = client.get(route)
        assert res.status_code == 200


def test_blog_index_pages(client):
    """Verify Blog index serves 200 OK and lists titles (REQ-F-004)."""
    for route in ["/blog", "/blog.html"]:
        res = client.get(route)
        assert res.status_code == 200
        assert b"From Our Blog" in res.data
        for post in BLOG_POSTS:
            assert post["title"].encode() in res.data


def test_blog_post_details(client):
    """Verify Blog post details view works dynamically (AC: view a list of blog posts and click to read)."""
    for route in ["/blog-post", "/blog-post.html"]:
        res = client.get(f"{route}?id=1")
        assert res.status_code == 200
        assert b"The Future of AI in Business" in res.data
        assert b"Jane Doe" in res.data

        # Test non-existent post id
        res_404 = client.get(f"{route}?id=999")
        assert res_404.status_code == 404


def test_contact_form_get(client):
    """Verify Contact form page GET works (REQ-F-005)."""
    for route in ["/contact", "/contact.html"]:
        res = client.get(route)
        assert res.status_code == 200
        assert b"Contact Us" in res.data


def test_contact_form_post_success(client):
    """Verify Contact form POST submission works and stores submission in-memory."""
    assert len(CONTACT_SUBMISSIONS) == 0
    data = {
        "name": "Bruce Wayne",
        "email": "bruce@waynecorp.com",
        "message": "I would like to purchase some enterprise IT services."
    }
    res = client.post("/contact", data=data)
    assert res.status_code == 200
    json_data = res.get_json()
    assert json_data["status"] == "success"
    assert len(CONTACT_SUBMISSIONS) == 1
    assert CONTACT_SUBMISSIONS[0]["name"] == "Bruce Wayne"
    assert CONTACT_SUBMISSIONS[0]["email"] == "bruce@waynecorp.com"


def test_contact_form_post_missing_fields(client):
    """Verify Contact form POST fails when fields are missing."""
    data = {
        "name": "Bruce Wayne",
        "email": ""  # empty email
    }
    res = client.post("/contact", data=data)
    assert res.status_code == 400
    json_data = res.get_json()
    assert json_data["status"] == "error"
    assert "Missing form fields" in json_data["message"]
    assert len(CONTACT_SUBMISSIONS) == 0


def test_admin_dashboard_auth_redirect(client):
    """Verify admin dashboard redirects to login if unauthenticated (AC: secure area)."""
    for route in ["/admin-dashboard", "/admin-dashboard.html"]:
        res = client.get(route)
        assert res.status_code == 302
        assert "/admin-login" in res.headers["Location"]


def test_admin_login_success(client):
    """Verify admin login with correct credentials redirects to dashboard."""
    data = {
        "username": "admin",
        "password": "admin123"
    }
    res = client.post("/admin-login", data=data)
    assert res.status_code == 302
    assert "/admin-dashboard" in res.headers["Location"]


def test_admin_login_failure(client):
    """Verify admin login with wrong credentials stays on login page and shows error."""
    data = {
        "username": "admin",
        "password": "wrongpassword"
    }
    res = client.post("/admin-login", data=data)
    assert res.status_code == 200
    assert b"Invalid credentials" in res.data


def test_admin_dashboard_access_and_submissions(client):
    """Verify admin dashboard shows leads when logged in (REQ-F-006)."""
    # 1. Create a submission
    client.post("/contact", data={
        "name": "Diana Prince",
        "email": "diana@themyscira.gov",
        "message": "Interested in cloud optimization."
    })

    # 2. Login as admin
    with client.session_transaction() as sess:
        sess["logged_in"] = True

    # 3. Access dashboard
    res = client.get("/admin-dashboard")
    assert res.status_code == 200
    assert b"Diana Prince" in res.data
    assert b"diana@themyscira.gov" in res.data
    assert b"Interested in cloud optimization." in res.data


def test_logout(client):
    """Verify admin logout clears session and redirects."""
    with client.session_transaction() as sess:
        sess["logged_in"] = True

    res = client.get("/logout")
    assert res.status_code == 302
    assert "/home" in res.headers["Location"]

    # Verify dashboard is no longer accessible
    res_dash = client.get("/admin-dashboard")
    assert res_dash.status_code == 302
