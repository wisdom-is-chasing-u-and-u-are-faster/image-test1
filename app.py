"""
E-Commerce Website Application.
Flask server providing routes for the E-Commerce Homepage based on visual reference specifications.
"""
import os
from typing import Any, Dict, List
from flask import Flask, jsonify, render_template, Response

app = Flask(__name__, template_folder="templates")

# Sample product catalog conforming to REQ-F-002
FEATURED_PRODUCTS: List[Dict[str, Any]] = [
    {
        "id": 1,
        "name": "Cantilever chair",
        "price": "$42.00",
        "image": "https://via.placeholder.com/200x200.png?text=Product+1",
    },
    {
        "id": 2,
        "name": "Comfort chair",
        "price": "$65.00",
        "image": "https://via.placeholder.com/200x200.png?text=Product+2",
    },
    {
        "id": 3,
        "name": "Minimalist chair",
        "price": "$37.00",
        "image": "https://via.placeholder.com/200x200.png?text=Product+3",
    },
    {
        "id": 4,
        "name": "Modern lamp",
        "price": "$25.00",
        "image": "https://via.placeholder.com/200x200.png?text=Product+4",
    },
]


@app.route("/")
@app.route("/home")
@app.route("/home.html")
def home() -> str:
    """
    Renders the E-commerce homepage conforming to REQ-F-001, REQ-F-002, and REQ-F-003.
    """
    return render_template("home.html")


@app.route("/index.html")
def index() -> str:
    """
    Renders the index preview page.
    """
    return render_template("index.html")


@app.route("/health")
def health() -> Response:
    """
    Health check endpoint.
    """
    return jsonify({"status": "healthy", "service": "ecommerce-homepage"})


@app.route("/api/products")
def get_products() -> Response:
    """
    Returns list of featured products.
    """
    return jsonify({"products": FEATURED_PRODUCTS})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(port=port)
