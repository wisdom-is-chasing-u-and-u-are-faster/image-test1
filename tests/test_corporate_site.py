import os
import json
from app import app, CMS_FILE, LEADS_FILE


def setup_function():
    # Remove existing files if present, to run tests in clean sandbox
    for f in [CMS_FILE, LEADS_FILE]:
        if os.path.exists(f):
            try:
                os.remove(f)
            except Exception:
                pass
    # Re-initialize content using init_cms script logic
    from init_cms import init_cms
    init_cms()


def teardown_function():
    # Cleanup after tests
    for f in [CMS_FILE, LEADS_FILE]:
        if os.path.exists(f):
            try:
                os.remove(f)
            except Exception:
                pass


def test_corporate_routes_load():
    """
    Verify that all standard corporate marketing routes load with 200 OK.
    """
    client = app.test_client()
    routes = [
        "/",
        "/services/cloud-migration",
        "/services/app-development",
        "/services/data-analytics",
        "/services/ai-agentic-systems",
        "/about",
        "/admin/cms"
    ]
    for r in routes:
        response = client.get(r)
        assert response.status_code == 200
        html = response.data.decode("utf-8")
        assert "IT Services" in html


def test_lead_capture_persistence():
    """
    Verify that submitting a lead captures and appends it into leads.log.
    """
    client = app.test_client()
    payload = {
        "name": "Bruce Wayne",
        "email": "bruce@waynecorp.com",
        "company": "Wayne Enterprises",
        "service_track": "ai_agentic",
        "message": "Need Gemini Enterprise orchestration for defense logistics."
    }
    response = client.post("/submit-lead", data=payload, follow_redirects=True)
    assert response.status_code == 200

    # Check LOG persistence
    assert os.path.exists(LEADS_FILE)
    leads = []
    with open(LEADS_FILE, "r") as f:
        for line in f:
            if line.strip():
                leads.append(json.loads(line.strip()))

    assert len(leads) == 1
    assert leads[0]["name"] == "Bruce Wayne"
    assert leads[0]["email"] == "bruce@waynecorp.com"
    assert leads[0]["company"] == "Wayne Enterprises"
    assert leads[0]["service_track"] == "ai_agentic"
    assert leads[0]["message"] == "Need Gemini Enterprise orchestration for defense logistics."


def test_admin_cms_update_content():
    """
    Verify that posting content updates to CMS updates cms_content.json.
    """
    client = app.test_client()
    payload = {
        "home_hero_title": "Fully Customized Hero Title",
        "home_hero_subtitle": "Updated Subtitle",
        "home_value_prop_title": "Updated Prop Title",
        "home_value_prop_text": "Updated Prop Text",
        "service_ai_title": "Cognitive Multi-Agents Factory",
        "service_ai_subtitle": "Specialized Factory",
        "service_ai_content": "Detailed custom contents"
    }
    response = client.post("/admin/cms/update", data=payload, follow_redirects=True)
    assert response.status_code == 200

    # Check JSON changes
    with open(CMS_FILE, "r") as f:
        cms_data = json.load(f)

    assert cms_data["home"]["hero_title"] == "Fully Customized Hero Title"
    assert cms_data["home"]["hero_subtitle"] == "Updated Subtitle"
    assert cms_data["services"]["ai_agentic"]["title"] == "Cognitive Multi-Agents Factory"
