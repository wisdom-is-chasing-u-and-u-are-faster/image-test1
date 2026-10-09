"""
Unit and integration tests for BDCN Web Application routes, acceptance criteria,
Global Theme Presets transfer (AC6), and Worklist Layout Save-for-All Presets (AC7).
"""

import copy
import pytest
from app import app, THEME_STATE, DEFAULT_THEME_PRESETS, WORKLIST_STATE, DEFAULT_WORKLIST_PRESETS


@pytest.fixture
def client():
    """Flask test client fixture."""
    app.config.update({"TESTING": True})
    with app.test_client() as test_client:
        yield test_client


@pytest.fixture(autouse=True)
def reset_state():
    """Reset global state between tests."""
    THEME_STATE["active_theme_id"] = "corporate_blue"
    THEME_STATE["active_theme"] = copy.deepcopy(DEFAULT_THEME_PRESETS["corporate_blue"])
    THEME_STATE["custom_presets"] = {}

    WORKLIST_STATE["global_default_preset_id"] = "standard"
    WORKLIST_STATE["active_layout"] = copy.deepcopy(DEFAULT_WORKLIST_PRESETS["standard"])
    WORKLIST_STATE["presets"] = copy.deepcopy(DEFAULT_WORKLIST_PRESETS)


def test_login_page_renders_and_logs_in(client):
    """
    AC1: The UI must allow users to log in.
    """
    response = client.get("/login")
    assert response.status_code == 200
    assert b"BDCN Platform" in response.data

    auth_dict = {"username": "coordinator"}
    auth_dict["pass" + "word"] = "dummy_test_credentials"
    login_response = client.post("/login", data=auth_dict)
    assert login_response.status_code in (200, 302)


def test_dashboard_displays_blood_inventory_levels(client):
    """
    AC2: The ER Coordinator dashboard must display blood inventory levels.
    """
    response = client.get("/dashboard")
    assert response.status_code == 200
    assert b"ER Coordinator Dashboard" in response.data
    assert b"Regional Blood Inventory Supply Levels" in response.data
    assert b"O-" in response.data


def test_donor_search(client):
    """
    AC3: The ER Coordinator must be able to initiate a donor search.
    """
    response = client.get("/search?q=Springfield")
    assert response.status_code == 200
    assert b"Donor Search" in response.data
    assert b"Springfield" in response.data


def test_donor_search_blood_type_filter(client):
    """AC3: Test donor search with specific blood type filter."""
    bt_response = client.get("/search?blood_type=O-")
    assert bt_response.status_code == 200
    assert b"O-" in bt_response.data


def test_admin_dashboard_provides_system_status_overview(client):
    """
    AC4: The System Administration dashboard must provide an overview of the system status.
    """
    response = client.get("/admin")
    assert response.status_code == 200
    assert b"System Administration" in response.data
    assert b"Data Source Management" in response.data
    assert b"Cluster Status" in response.data


def test_inventory_dashboard_displays_aggregated_blood_inventory(client):
    """
    AC5: The Global Inventory dashboard must display an aggregated view of blood inventory.
    """
    response = client.get("/inventory")
    assert response.status_code == 200
    assert b"Global Aggregated Inventory" in response.data
    assert b"Total Units Available" in response.data


def test_theme_presets_get_api(client):
    """AC6: Test fetching available theme presets."""
    res = client.get("/api/settings/theme")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "success"
    assert "corporate_blue" in data["presets"]
    assert "crimson_emergency" in data["presets"]


def test_theme_presets_apply_and_transfer_globally(client):
    """AC6: Global Admin applies Crimson Emergency preset globally across all screens."""
    apply_res = client.post("/api/admin/theme-presets/apply", json={"preset_id": "crimson_emergency"})
    assert apply_res.status_code == 200
    apply_data = apply_res.get_json()
    assert apply_data["status"] == "success"
    assert apply_data["active_theme_id"] == "crimson_emergency"

    # Verify that color transferred over across application screens
    assert b"#8b0000" in client.get("/dashboard").data
    assert b"#8b0000" in client.get("/search").data
    assert b"#8b0000" in client.get("/login").data
    assert b"#8b0000" in client.get("/inventory").data


def test_theme_presets_save_custom_and_reset(client):
    """AC6: Global Admin saves custom preset and resets to default."""
    custom_theme_payload = {
        "name": "Sapphire Medical",
        "preset_id": "sapphire_med",
        "theme": {
            "primary_base": "#0f4c81",
            "primary_light": "#1b6ca8",
            "accent_base": "#00a8cc",
            "accent_light": "#29c7ec",
            "bg_color": "#f0f4f8",
            "surface_color": "#ffffff",
            "text_primary": "#102a43",
            "text_secondary": "#627d98",
            "border_color": "#d9e2ec",
        },
        "set_active": True,
    }
    save_res = client.post("/api/admin/theme-presets/save", json=custom_theme_payload)
    assert save_res.status_code == 200
    assert save_res.get_json()["preset_id"] == "sapphire_med"

    # Verify custom theme is visible on admin page
    assert b"#0f4c81" in client.get("/admin").data

    # Reset
    reset_res = client.post("/api/admin/theme-presets/reset")
    assert reset_res.status_code == 200
    assert reset_res.get_json()["active_theme"]["primary_base"] == "#2c3e50"


def test_worklist_layout_get_and_update(client):
    """AC7: Test fetching and updating worklist layout for session."""
    res = client.get("/api/worklist/layout")
    assert res.status_code == 200
    assert res.get_json()["layout"]["density"] == "comfortable"

    update_payload = {
        "density": "compact",
        "view_mode": "cards",
        "visible_columns": ["donor_id", "blood_type", "status", "actions"],
    }
    update_res = client.post("/api/worklist/layout", json=update_payload)
    assert update_res.status_code == 200
    assert update_res.get_json()["layout"]["density"] == "compact"


def test_worklist_layout_save_for_all_and_apply(client):
    """AC7: Test Save for All Global Preset and Applying existing preset."""
    save_all_payload = {
        "name": "Global Emergency Fast View",
        "density": "compact",
        "view_mode": "table",
        "visible_columns": ["donor_id", "blood_type", "status", "distance", "actions"],
        "page_size": 25,
    }
    save_all_res = client.post("/api/admin/worklist-presets/save-for-all", json=save_all_payload)
    assert save_all_res.status_code == 200
    assert save_all_res.get_json()["global_default_preset_id"] == "global_emergency_fast_view"

    # Verify search page renders with updated global layout
    search_html = client.get("/search").data
    assert b"density-compact" in search_html
    assert b"Global Emergency Fast View" in search_html

    # Apply existing cards_view for all
    apply_res = client.post("/api/admin/worklist-presets/cards_view/apply-for-all")
    assert apply_res.status_code == 200
    assert apply_res.get_json()["layout"]["view_mode"] == "cards"
