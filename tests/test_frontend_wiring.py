"""Tests for Frontend static wiring, WCAG 2.1 AA accessibility, and bilingual dictionaries."""

import os

REPO_ROOT = os.path.dirname(os.path.dirname(__file__))
PUBLIC_DIR = os.path.join(REPO_ROOT, "public")


def test_static_files_structure_exists():
    """Verifies all required static files and directories exist."""
    assert os.path.exists(os.path.join(PUBLIC_DIR, "index.html"))
    assert os.path.exists(os.path.join(PUBLIC_DIR, "css", "style.css"))
    assert os.path.exists(os.path.join(PUBLIC_DIR, "js", "api.js"))
    assert os.path.exists(os.path.join(PUBLIC_DIR, "js", "app.js"))

    # Verify individual screen pages
    screens = [
        "welcome.html", "personal_info.html", "doc_capture.html",
        "liveness_check.html", "review.html", "submitting.html",
        "status.html", "compliance_portal.html"
    ]
    for s in screens:
        screen_path = os.path.join(PUBLIC_DIR, "pages", s)
        assert os.path.exists(screen_path), f"Missing screen page: {screen_path}"


def test_wcag_accessibility_tags():
    """Verifies WCAG 2.1 Level AA accessibility markers in index.html (REQ-N-016)."""
    with open(os.path.join(PUBLIC_DIR, "index.html"), "r", encoding="utf-8") as f:
        html = f.read()

    # Must contain skip link
    assert "skip-link" in html
    # Must have semantic landmarks
    assert "<header" in html
    assert "<main" in html
    assert "<footer" in html
    # Must contain aria labels
    assert "aria-label" in html or "aria-hidden" in html


def test_bilingual_translations():
    """Verifies that both English and Spanish translations exist (REQ-F-014)."""
    with open(os.path.join(PUBLIC_DIR, "index.html"), "r", encoding="utf-8") as f:
        html = f.read()

    assert "data-lang-en" in html
    assert "data-lang-es" in html
    assert "Digital Bank" in html
    assert "Banco Digital" in html


def test_api_client_endpoints_match_contract():
    """Verifies apiClient in public/js/api.js contains all required contract methods."""
    with open(os.path.join(PUBLIC_DIR, "js", "api.js"), "r", encoding="utf-8") as f:
        js = f.read()

    assert "initiateAccount" in js
    assert "getAccountStatus" in js
    assert "getComplianceApplications" in js
    assert "submitComplianceDecision" in js
