"""
Unit and integration tests for the E-Commerce Website.
Validates acceptance criteria for ARCH-358.
"""
from typing import Generator
import pytest
from flask.testing import FlaskClient
from app import app


@pytest.fixture
def client() -> Generator[FlaskClient, None, None]:
    """Test client fixture for Flask application."""
    app.testing = True
    with app.test_client() as test_client:
        yield test_client


def test_homepage_renders_correctly_and_matches_visual_design(client: FlaskClient) -> None:
    """
    AC 1: Verify that the homepage renders correctly and matches the visual design of the selected UI variant.
    Covers REQ-F-001, REQ-F-002, and REQ-N-001.
    """
    response = client.get("/")
    assert response.status_code == 200
    html = response.get_data(as_text=True)

    expected_snippets = [
        "Home Page | E-Commerce Website",
        "promo-banner",
        "New Arrivals For Spring",
        "product-section",
        "Featured Products",
        "product-grid",
        "product-card",
        "Cantilever chair",
        "Comfort chair",
        "Minimalist chair",
        "Modern lamp",
        "main-footer",
    ]
    for snippet in expected_snippets:
        assert snippet in html


def test_header_contains_navigation_links_search_bar_and_profile_wishlist_icons(client: FlaskClient) -> None:
    """
    AC 2: Verify that the header contains navigation links, a search bar, and profile/wishlist icons.
    Covers REQ-F-003.
    """
    response = client.get("/")
    assert response.status_code == 200
    html = response.get_data(as_text=True)

    header_snippets = [
        "main-header",
        "Hekto",
        "main-nav",
        ">Home<",
        ">Pages<",
        ">Products<",
        ">Blog<",
        ">Shop<",
        ">Contact<",
        "search-bar",
        'placeholder="Search products..."',
        'aria-label="Search"',
        "user-actions",
        'aria-label="Wishlist"',
        'aria-label="User Profile"',
        "fa-heart",
        "fa-user",
    ]
    for snippet in header_snippets:
        assert snippet in html


def test_color_palette_and_fonts_match_design_specification(client: FlaskClient) -> None:
    """
    AC 3: Verify that the color palette and fonts used in the final implementation match the design specification.
    Covers CONSTRAINT-001 and CONSTRAINT-002.
    """
    response = client.get("/")
    assert response.status_code == 200
    html = response.get_data(as_text=True)

    style_tokens = [
        "--primary-brand-pink: #fb2e86;",
        "--primary-brand-orange: #f56e0f;",
        "--action-blue: #03a9f4;",
        "--background-color: #ffffff;",
        "--secondary-background-color: #f5f5f5;",
        "--text-color: #282c3f;",
        "Poppins",
        "--font-family-sans: 'Poppins', sans-serif;",
    ]
    for token in style_tokens:
        assert token in html


def test_health_and_api_endpoints(client: FlaskClient) -> None:
    """
    Verify health check and products REST endpoints.
    """
    health_resp = client.get("/health")
    assert health_resp.status_code == 200
    assert health_resp.get_json() == {"status": "healthy", "service": "ecommerce-homepage"}

    products_resp = client.get("/api/products")
    assert products_resp.status_code == 200
    data = products_resp.get_json()
    assert "products" in data
    assert len(data["products"]) == 4
