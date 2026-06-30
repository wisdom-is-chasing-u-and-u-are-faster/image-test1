import pytest
from flask.testing import FlaskClient
from app import app


@pytest.fixture
def client() -> FlaskClient:
    """A test client for the app."""
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_index_route(client: FlaskClient) -> None:
    """Test the root index route redirects or displays home."""
    response = client.get("/")
    assert response.status_code == 200
    assert b"Home" in response.data or b"CorpWeb" in response.data


def test_home_route(client: FlaskClient) -> None:
    """Test the home route."""
    response = client.get("/home.html")
    assert response.status_code == 200
    assert b"Home" in response.data or b"CorpWeb" in response.data


def test_about_route(client: FlaskClient) -> None:
    """Test the about route."""
    response = client.get("/about.html")
    assert response.status_code == 200
    assert b"About" in response.data or b"CorpWeb" in response.data


def test_products_route(client: FlaskClient) -> None:
    """Test the products route."""
    response = client.get("/products.html")
    assert response.status_code == 200
    assert b"Products" in response.data or b"CorpWeb" in response.data


def test_services_route(client: FlaskClient) -> None:
    """Test the services route."""
    response = client.get("/services.html")
    assert response.status_code == 200
    assert b"Services" in response.data or b"CorpWeb" in response.data


def test_blog_route(client: FlaskClient) -> None:
    """Test the blog list route."""
    response = client.get("/blog.html")
    assert response.status_code == 200
    assert b"Blog" in response.data or b"CorpWeb" in response.data


def test_blog_post_route(client: FlaskClient) -> None:
    """Test the single blog post route."""
    response = client.get("/blog-post.html")
    assert response.status_code == 200
    assert b"Blog" in response.data or b"CorpWeb" in response.data


def test_contact_route(client: FlaskClient) -> None:
    """Test the contact route."""
    response = client.get("/contact.html")
    assert response.status_code == 200
    assert b"Contact" in response.data or b"CorpWeb" in response.data


def test_admin_login_route(client: FlaskClient) -> None:
    """Test the admin login route."""
    response = client.get("/admin-login.html")
    assert response.status_code == 200
    assert b"Admin Login" in response.data or b"Username" in response.data


def test_admin_dashboard_route(client: FlaskClient) -> None:
    """Test the admin dashboard route."""
    response = client.get("/admin-dashboard.html")
    assert response.status_code == 200
    assert b"Admin Dashboard" in response.data or b"Overview" in response.data
