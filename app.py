"""
BDCN Platform Web Application.

Provides UI routes for Blood Donor Connection Network (BDCN) Variant A UI pages:
- /login: User Authentication (AC1)
- /dashboard: ER Coordinator Dashboard displaying blood inventory levels (AC2)
- /search: ER Coordinator Donor Search interface & Worklist (AC3, AC7)
- /admin: System Administration status dashboard, Global Theme Presets & Worklist Layouts (AC4, AC6, AC7)
- /inventory: Global aggregated blood inventory display & Worklist (AC5, AC7)

Features:
- Global Theme & Color Presets transfer by Global Admin (AC6)
- Worklist Layout settings & Save-for-All Presets (AC7)
"""

from typing import Any, Dict, List, Tuple, Union
import copy
import os
from flask import Flask, jsonify, redirect, render_template, request, url_for

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "bdcn-dev-session-key-unauthenticated")

# ==============================================================================
# Domain & Data Models
# ==============================================================================

INVENTORY_DATA: List[Dict[str, Any]] = [
    {"type": "A+", "units": 150, "status": "Optimal", "hubs": "Metro General, Mercy Hospital", "criticality": "normal"},
    {"type": "A-", "units": 45, "status": "Low", "hubs": "City Central, Mercy Hospital", "criticality": "warning"},
    {"type": "B+", "units": 120, "status": "Optimal", "hubs": "All Regional Hubs", "criticality": "normal"},
    {"type": "B-", "units": 30, "status": "Critical", "hubs": "Metro General", "criticality": "danger"},
    {"type": "AB+", "units": 60, "status": "Optimal", "hubs": "County Central", "criticality": "normal"},
    {"type": "AB-", "units": 15, "status": "Low", "hubs": "St. Jude's Hospital", "criticality": "warning"},
    {"type": "O+", "units": 200, "status": "Optimal", "hubs": "All Regional Hubs", "criticality": "normal"},
    {"type": "O-", "units": 25, "status": "Critical", "hubs": "Metro General, St. Jude's", "criticality": "danger"},
]

DONORS_DATA: List[Dict[str, Any]] = [
    {
        "id": "DN-73829",
        "name": "Dr. Sarah Jenkins",
        "blood_type": "O-",
        "location": "Springfield, IL",
        "distance_km": 3.2,
        "status": "Available",
        "units": 2,
        "last_donation": "2024-01-15",
        "shard_id": "Shard 1",
    },
    {
        "id": "DN-46102",
        "name": "Marcus Vance",
        "blood_type": "A+",
        "location": "Shelbyville, IL",
        "distance_km": 5.8,
        "status": "On Cooldown",
        "units": 1,
        "last_donation": "2024-03-20",
        "shard_id": "Shard 2",
    },
    {
        "id": "DN-88210",
        "name": "Elena Rostova",
        "blood_type": "B-",
        "location": "Capital City, IL",
        "distance_km": 12.4,
        "status": "Available",
        "units": 3,
        "last_donation": "2023-11-04",
        "shard_id": "Shard 3",
    },
    {
        "id": "DN-99431",
        "name": "David Kim",
        "blood_type": "AB+",
        "location": "Springfield, IL",
        "distance_km": 4.1,
        "status": "Available",
        "units": 2,
        "last_donation": "2024-02-10",
        "shard_id": "Shard 1",
    },
    {
        "id": "DN-11204",
        "name": "Rachel Adams",
        "blood_type": "O+",
        "location": "Ogdenville, IL",
        "distance_km": 18.0,
        "status": "Available",
        "units": 1,
        "last_donation": "2024-01-28",
        "shard_id": "Shard 4",
    },
]

SYSTEM_STATUS: Dict[str, Any] = {
    "status": "Healthy",
    "active_nodes": 12,
    "p99_latency_ms": 42,
    "cached_items": 10450,
}

# ==============================================================================
# Theme & Color Presets Store (AC6)
# ==============================================================================

DEFAULT_THEME_PRESETS: Dict[str, Dict[str, Any]] = {
    "corporate_blue": {
        "id": "corporate_blue",
        "name": "Corporate Blue (Default)",
        "primary_base": "#2c3e50",
        "primary_light": "#34495e",
        "accent_base": "#3498db",
        "accent_light": "#5dade2",
        "bg_color": "#f8f9fa",
        "surface_color": "#ffffff",
        "text_primary": "#212529",
        "text_secondary": "#6c757d",
        "border_color": "#dee2e6",
    },
    "crimson_emergency": {
        "id": "crimson_emergency",
        "name": "Crimson Emergency / Blood Drive",
        "primary_base": "#8b0000",
        "primary_light": "#a93226",
        "accent_base": "#e74c3c",
        "accent_light": "#f1948a",
        "bg_color": "#fdfefe",
        "surface_color": "#ffffff",
        "text_primary": "#1b2631",
        "text_secondary": "#5d6d7e",
        "border_color": "#ebedef",
    },
    "emerald_care": {
        "id": "emerald_care",
        "name": "Emerald Clinical Care",
        "primary_base": "#145a32",
        "primary_light": "#1e8449",
        "accent_base": "#27ae60",
        "accent_light": "#52be80",
        "bg_color": "#f4fcf7",
        "surface_color": "#ffffff",
        "text_primary": "#14221a",
        "text_secondary": "#4a6b57",
        "border_color": "#d4efdf",
    },
    "slate_dark": {
        "id": "slate_dark",
        "name": "Slate Dark Mode",
        "primary_base": "#1a252f",
        "primary_light": "#2c3e50",
        "accent_base": "#2980b9",
        "accent_light": "#3498db",
        "bg_color": "#121921",
        "surface_color": "#1e2936",
        "text_primary": "#ecf0f1",
        "text_secondary": "#bdc3c7",
        "border_color": "#34495e",
    },
    "high_contrast": {
        "id": "high_contrast",
        "name": "High Contrast Accessibility",
        "primary_base": "#000000",
        "primary_light": "#1f1f1f",
        "accent_base": "#0056b3",
        "accent_light": "#007bff",
        "bg_color": "#ffffff",
        "surface_color": "#ffffff",
        "text_primary": "#000000",
        "text_secondary": "#222222",
        "border_color": "#000000",
    },
}

THEME_STATE: Dict[str, Any] = {
    "active_theme_id": "corporate_blue",
    "active_theme": copy.deepcopy(DEFAULT_THEME_PRESETS["corporate_blue"]),
    "custom_presets": {},
}

# ==============================================================================
# Worklist Layout Presets Store (AC7)
# ==============================================================================

DEFAULT_WORKLIST_PRESETS: Dict[str, Dict[str, Any]] = {
    "standard": {
        "id": "standard",
        "name": "Standard Comprehensive (Default)",
        "density": "comfortable",
        "view_mode": "table",
        "visible_columns": ["donor_id", "name", "blood_type", "location", "status", "distance", "units", "last_donation", "actions"],
        "page_size": 10,
    },
    "emergency_triage": {
        "id": "emergency_triage",
        "name": "Emergency Fast-Triage (Compact)",
        "density": "compact",
        "view_mode": "table",
        "visible_columns": ["donor_id", "blood_type", "status", "distance", "actions"],
        "page_size": 25,
    },
    "cards_view": {
        "id": "cards_view",
        "name": "Visual Donor Cards",
        "density": "spacious",
        "view_mode": "cards",
        "visible_columns": ["donor_id", "name", "blood_type", "location", "status", "distance", "actions"],
        "page_size": 12,
    },
    "audit_nodes": {
        "id": "audit_nodes",
        "name": "Audit & Cluster Partition View",
        "density": "compact",
        "view_mode": "table",
        "visible_columns": ["donor_id", "name", "blood_type", "location", "status", "shard_id", "last_donation", "actions"],
        "page_size": 20,
    },
}

WORKLIST_STATE: Dict[str, Any] = {
    "global_default_preset_id": "standard",
    "active_layout": copy.deepcopy(DEFAULT_WORKLIST_PRESETS["standard"]),
    "presets": copy.deepcopy(DEFAULT_WORKLIST_PRESETS),
}


# ==============================================================================
# Jinja Context Processor: Global Theme & Worklist State Injection
# ==============================================================================

@app.context_processor
def inject_global_settings() -> Dict[str, Any]:
    """
    Inject active theme and global worklist layout into all Jinja2 templates.

    AC6: Global Admin can configure, save, and transfer entire color & theme presets across all application views.
    AC7: Worklist layout settings can be customized and saved for all users as a global preset.
    """
    all_theme_presets = {**DEFAULT_THEME_PRESETS, **THEME_STATE["custom_presets"]}
    return {
        "active_theme": THEME_STATE["active_theme"],
        "active_theme_id": THEME_STATE["active_theme_id"],
        "theme_presets": all_theme_presets,
        "worklist_layout": WORKLIST_STATE["active_layout"],
        "worklist_presets": WORKLIST_STATE["presets"],
        "worklist_preset_id": WORKLIST_STATE["global_default_preset_id"],
    }


# ==============================================================================
# UI Routes
# ==============================================================================

@app.route("/")
def index() -> Any:
    """Redirect root path to login."""
    return redirect(url_for("login"))


@app.route("/login", methods=["GET", "POST"])
def login() -> Union[str, Any, Tuple[str, int]]:
    """
    Handle user login.

    AC1: The UI must allow users to log in.
    """
    if request.method == "POST":
        username = request.form.get("username", "")
        password = request.form.get("password", "")
        if username and password:
            return redirect(url_for("dashboard"))
        return render_template("login.html", error="Invalid credentials"), 400
    return render_template("login.html")


@app.route("/dashboard")
def dashboard() -> str:
    """
    Display ER Coordinator dashboard with blood inventory levels and active requests worklist.

    AC2: The ER Coordinator dashboard must display blood inventory levels.
    """
    return render_template(
        "dashboard.html",
        inventory=INVENTORY_DATA,
        donors=DONORS_DATA[:3],
        system=SYSTEM_STATUS,
    )


def _donor_matches(donor: Dict[str, Any], query: str, blood_type: str) -> bool:
    """Check if single donor matches query & blood type criteria."""
    if blood_type and blood_type != "Any" and donor.get("blood_type") != blood_type:
        return False
    if query:
        q_low = query.lower()
        search_blob = f"{donor.get('name', '')} {donor.get('location', '')} {donor.get('id', '')} {donor.get('blood_type', '')}".lower()
        if q_low not in search_blob:
            return False
    return True


@app.route("/search", methods=["GET", "POST"])
def search() -> str:
    """
    Initiate donor search interface & worklist view.

    AC3: The ER Coordinator must be able to initiate a donor search.
    AC7: Worklist layout settings can be customized and saved for all users as a global preset.
    """
    query = request.args.get("q", "") if request.method == "GET" else request.form.get("q", "")
    blood_type = request.args.get("blood_type", "")
    results = [d for d in DONORS_DATA if _donor_matches(d, query, blood_type)]

    return render_template(
        "search.html",
        query=query,
        blood_type=blood_type,
        results=results,
        all_donors=DONORS_DATA,
    )


@app.route("/admin")
def admin() -> str:
    """
    Display System Administration dashboard, Global Theme Presets & Worklist Layout Manager.

    AC4: The System Administration dashboard must provide an overview of the system status.
    AC6: Global Admin can configure, save, and transfer entire color & theme presets across all application views.
    AC7: Worklist layout settings can be customized and saved for all users as a global preset.
    """
    all_theme_presets = {**DEFAULT_THEME_PRESETS, **THEME_STATE["custom_presets"]}
    return render_template(
        "admin.html",
        system=SYSTEM_STATUS,
        theme_presets=all_theme_presets,
        active_theme=THEME_STATE["active_theme"],
        active_theme_id=THEME_STATE["active_theme_id"],
        worklist_presets=WORKLIST_STATE["presets"],
        worklist_layout=WORKLIST_STATE["active_layout"],
    )


@app.route("/inventory")
def inventory() -> str:
    """
    Display Global Inventory dashboard with aggregated supply metrics and worklist layout.

    AC5: The Global Inventory dashboard must display an aggregated view of blood inventory.
    """
    total_units = sum(int(item["units"]) for item in INVENTORY_DATA)
    critical_count = sum(1 for item in INVENTORY_DATA if item["status"] == "Critical")
    optimal_count = sum(1 for item in INVENTORY_DATA if item["status"] == "Optimal")
    return render_template(
        "inventory.html",
        inventory=INVENTORY_DATA,
        total_units=total_units,
        critical_count=critical_count,
        optimal_count=optimal_count,
    )


# ==============================================================================
# REST APIs: Global Theme Presets Transfer (AC6)
# ==============================================================================

@app.route("/api/settings/theme", methods=["GET"])
def get_theme_settings() -> Any:
    """
    Retrieve active theme preset and available presets.

    AC6: Global Admin can configure, save, and transfer entire color & theme presets across all application views.
    """
    all_presets = {**DEFAULT_THEME_PRESETS, **THEME_STATE["custom_presets"]}
    return jsonify({
        "status": "success",
        "active_theme_id": THEME_STATE["active_theme_id"],
        "active_theme": THEME_STATE["active_theme"],
        "presets": all_presets,
    })


@app.route("/api/admin/theme-presets/apply", methods=["POST"])
def apply_theme_preset_globally() -> Any:
    """
    Global Admin transfers and applies a theme preset globally across all application pages.

    AC6: Global Admin can configure, save, and transfer entire color & theme presets across all application views.
    """
    data = request.get_json(silent=True) or request.form
    preset_id = data.get("preset_id", "")
    custom_theme = data.get("custom_theme")

    all_presets = {**DEFAULT_THEME_PRESETS, **THEME_STATE["custom_presets"]}

    if preset_id and preset_id in all_presets:
        THEME_STATE["active_theme_id"] = preset_id
        THEME_STATE["active_theme"] = copy.deepcopy(all_presets[preset_id])
    elif custom_theme and isinstance(custom_theme, dict):
        THEME_STATE["active_theme_id"] = "custom"
        THEME_STATE["active_theme"].update(custom_theme)
    else:
        return jsonify({"status": "error", "message": f"Preset '{preset_id}' not found"}), 404

    return jsonify({
        "status": "success",
        "message": f"Global theme updated and transferred to '{THEME_STATE['active_theme_id']}'",
        "active_theme_id": THEME_STATE["active_theme_id"],
        "active_theme": THEME_STATE["active_theme"],
    })


@app.route("/api/admin/theme-presets/save", methods=["POST"])
def save_theme_preset() -> Any:
    """
    Global Admin saves a new custom theme preset.

    AC6: Global Admin can configure, save, and transfer entire color & theme presets across all application views.
    """
    data = request.get_json(silent=True) or request.form
    name = data.get("name", "Custom Preset")
    preset_id = data.get("preset_id") or name.lower().replace(" ", "_").replace("-", "_")
    theme_data = data.get("theme") or {}

    color_keys = ["primary_base", "primary_light", "accent_base", "accent_light", "bg_color", "surface_color", "text_primary", "text_secondary", "border_color"]
    preset_theme: Dict[str, Any] = {"id": preset_id, "name": name}
    for k in color_keys:
        preset_theme[k] = theme_data.get(k, data.get(k, THEME_STATE["active_theme"].get(k, "#2c3e50")))

    THEME_STATE["custom_presets"][preset_id] = preset_theme

    if data.get("set_active", True):
        THEME_STATE["active_theme_id"] = preset_id
        THEME_STATE["active_theme"] = copy.deepcopy(preset_theme)

    return jsonify({
        "status": "success",
        "message": f"Theme preset '{name}' saved and applied globally.",
        "preset_id": preset_id,
        "preset": preset_theme,
        "active_theme_id": THEME_STATE["active_theme_id"],
    })


@app.route("/api/admin/theme-presets/reset", methods=["POST"])
def reset_theme_presets() -> Any:
    """Reset global theme to standard Corporate Blue."""
    THEME_STATE["active_theme_id"] = "corporate_blue"
    THEME_STATE["active_theme"] = copy.deepcopy(DEFAULT_THEME_PRESETS["corporate_blue"])
    return jsonify({
        "status": "success",
        "message": "Theme reset to default Corporate Blue",
        "active_theme": THEME_STATE["active_theme"],
    })


# ==============================================================================
# REST APIs: Worklist Layout & Save-for-All Presets (AC7)
# ==============================================================================

def _apply_layout_patch(target: Dict[str, Any], patch: Dict[str, Any]) -> None:
    """Apply layout updates helper."""
    for key in ["density", "view_mode"]:
        if key in patch:
            target[key] = patch[key]
    if "visible_columns" in patch:
        cols = patch["visible_columns"]
        target["visible_columns"] = [c.strip() for c in cols.split(",") if c.strip()] if isinstance(cols, str) else cols
    if "page_size" in patch:
        try:
            target["page_size"] = int(patch["page_size"])
        except (ValueError, TypeError):
            pass


@app.route("/api/worklist/layout", methods=["GET", "POST"])
def handle_worklist_layout() -> Any:
    """
    Get or update worklist layout configuration.

    AC7: Worklist layout settings can be customized and saved for all users as a global preset.
    """
    if request.method == "POST":
        data = request.get_json(silent=True) or request.form
        _apply_layout_patch(WORKLIST_STATE["active_layout"], data)
        return jsonify({
            "status": "success",
            "message": "Worklist layout updated",
            "layout": WORKLIST_STATE["active_layout"],
        })

    return jsonify({
        "status": "success",
        "active_preset_id": WORKLIST_STATE["global_default_preset_id"],
        "layout": WORKLIST_STATE["active_layout"],
        "presets": WORKLIST_STATE["presets"],
    })


@app.route("/api/admin/worklist-presets", methods=["GET", "POST"])
def handle_worklist_presets() -> Any:
    """List or create worklist presets."""
    if request.method == "POST":
        data = request.get_json(silent=True) or request.form
        name = data.get("name", "Custom Layout")
        preset_id = data.get("preset_id") or name.lower().replace(" ", "_").replace("-", "_")
        preset_layout = {
            "id": preset_id,
            "name": name,
            "density": data.get("density", WORKLIST_STATE["active_layout"]["density"]),
            "view_mode": data.get("view_mode", WORKLIST_STATE["active_layout"]["view_mode"]),
            "visible_columns": data.get("visible_columns", WORKLIST_STATE["active_layout"]["visible_columns"]),
            "page_size": int(data.get("page_size", WORKLIST_STATE["active_layout"]["page_size"])),
        }
        WORKLIST_STATE["presets"][preset_id] = preset_layout
        return jsonify({
            "status": "success",
            "message": f"Preset '{name}' created",
            "preset_id": preset_id,
            "preset": preset_layout,
        })

    return jsonify({
        "status": "success",
        "presets": WORKLIST_STATE["presets"],
        "active_preset_id": WORKLIST_STATE["global_default_preset_id"],
    })


@app.route("/api/admin/worklist-presets/save-for-all", methods=["POST"])
def save_worklist_layout_for_all() -> Any:
    """
    Save the current worklist layout setting as a global preset applied for all users.

    AC7: Worklist layout settings can be customized and saved for all users as a global preset.
    """
    data = request.get_json(silent=True) or request.form
    preset_name = data.get("name") or data.get("preset_name") or "Global Admin Default"
    preset_id = data.get("preset_id") or preset_name.lower().replace(" ", "_").replace("-", "_")

    visible_cols = data.get("visible_columns", WORKLIST_STATE["active_layout"]["visible_columns"])
    if isinstance(visible_cols, str):
        visible_cols = [c.strip() for c in visible_cols.split(",") if c.strip()]

    new_global_preset = {
        "id": preset_id,
        "name": preset_name,
        "density": data.get("density", WORKLIST_STATE["active_layout"]["density"]),
        "view_mode": data.get("view_mode", WORKLIST_STATE["active_layout"]["view_mode"]),
        "visible_columns": visible_cols,
        "page_size": int(data.get("page_size", WORKLIST_STATE["active_layout"]["page_size"])),
    }

    WORKLIST_STATE["presets"][preset_id] = new_global_preset
    WORKLIST_STATE["global_default_preset_id"] = preset_id
    WORKLIST_STATE["active_layout"] = copy.deepcopy(new_global_preset)

    return jsonify({
        "status": "success",
        "message": f"Worklist layout preset '{preset_name}' saved and applied globally for all users.",
        "global_default_preset_id": preset_id,
        "global_default_layout": new_global_preset,
    })


@app.route("/api/admin/worklist-presets/<preset_id>/apply-for-all", methods=["POST"])
def apply_worklist_preset_for_all(preset_id: str) -> Any:
    """Apply an existing worklist preset as global default for all users."""
    if preset_id not in WORKLIST_STATE["presets"]:
        return jsonify({"status": "error", "message": f"Worklist preset '{preset_id}' not found"}), 404

    preset = WORKLIST_STATE["presets"][preset_id]
    WORKLIST_STATE["global_default_preset_id"] = preset_id
    WORKLIST_STATE["active_layout"] = copy.deepcopy(preset)

    return jsonify({
        "status": "success",
        "message": f"Worklist preset '{preset['name']}' set as global default for all users.",
        "active_preset_id": preset_id,
        "layout": WORKLIST_STATE["active_layout"],
    })


if __name__ == "__main__":
    port_num = int(os.getenv("PORT", "5000"))
    app.run(host="127.0.0.1", port=port_num, debug=False)
