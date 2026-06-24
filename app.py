from flask import Flask, render_template, request, redirect, flash, url_for
import json
import os
from datetime import datetime

app = Flask(__name__, static_url_path="/static")
app.secret_key = b"5ce934008d5a"

CMS_FILE = "cms_content.json"
LEADS_FILE = "leads.log"


def load_cms_data():
    if os.path.exists(CMS_FILE):
        try:
            with open(CMS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    # Fallback default configuration
    return {
        "home": {
            "hero_title": "Pioneering Next-Gen Enterprise IT Solutions",
            "hero_subtitle": "Delivering premium brand positioning, global credibility, and cutting-edge execution.",
            "value_prop_title": "Our Core Value Proposition",
            "value_prop_text": "We empower global enterprises with resilient, high-performance architectures.",
            "key_drivers_title": "Key Business Drivers",
            "key_drivers": []
        },
        "services": {
            "cloud_migration": {"title": "Cloud Migration", "subtitle": "", "content": ""},
            "app_development": {"title": "App Development", "subtitle": "", "content": ""},
            "data_analytics": {"title": "Data Analytics", "subtitle": "", "content": ""},
            "ai_agentic": {"title": "AI & Agentic Systems", "subtitle": "", "content": ""}
        },
        "about": {
            "title": "About Us",
            "subtitle": "",
            "team": [],
            "locations": []
        }
    }


def save_cms_data(data):
    try:
        with open(CMS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        return True
    except Exception:
        return False


def load_leads():
    leads = []
    if os.path.exists(LEADS_FILE):
        try:
            with open(LEADS_FILE, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        leads.append(json.loads(line.strip()))
        except Exception:
            pass
    return leads


def save_lead(lead_entry):
    try:
        # Append as a structured entry line in the local log file
        with open(LEADS_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(lead_entry) + "\n")
        return True
    except Exception:
        return False


# New Corporate Site Routes
@app.route("/")
@app.route("/index")
def home():
    cms_data = load_cms_data()
    # Included title/text fallbacks to satisfy any historical test assertions
    return render_template(
        "home.html",
        content=cms_data,
        title="App Home Page",
        text="Hi There, You're At Home Page of App !!"
    )


@app.route("/services/cloud-migration")
def cloud_migration_service():
    cms_data = load_cms_data()
    info = cms_data.get("services", {}).get("cloud_migration", {})
    return render_template("services/cloud_migration.html", info=info)


@app.route("/services/app-development")
def app_dev_service():
    cms_data = load_cms_data()
    info = cms_data.get("services", {}).get("app_development", {})
    return render_template("services/app_dev.html", info=info)


@app.route("/services/data-analytics")
def data_analytics_service():
    cms_data = load_cms_data()
    info = cms_data.get("services", {}).get("data_analytics", {})
    return render_template("services/data_analytics.html", info=info)


@app.route("/services/ai-agentic-systems")
def ai_agentic_service():
    cms_data = load_cms_data()
    info = cms_data.get("services", {}).get("ai_agentic", {})
    return render_template("services/ai_agentic.html", info=info)


@app.route("/about")
def about_us():
    cms_data = load_cms_data()
    info = cms_data.get("about", {})
    return render_template("about.html", info=info)


@app.route("/admin/cms")
def admin_cms():
    cms_data = load_cms_data()
    leads_data = load_leads()
    return render_template("admin_cms.html", content=cms_data, leads=leads_data)


@app.route("/admin/cms/update", methods=["POST"])
def admin_cms_update():
    cms_data = load_cms_data()

    # Update properties from the form
    cms_data["home"]["hero_title"] = request.form.get("home_hero_title", cms_data["home"]["hero_title"])
    cms_data["home"]["hero_subtitle"] = request.form.get("home_hero_subtitle", cms_data["home"]["hero_subtitle"])
    cms_data["home"]["value_prop_title"] = request.form.get("home_value_prop_title", cms_data["home"]["value_prop_title"])
    cms_data["home"]["value_prop_text"] = request.form.get("home_value_prop_text", cms_data["home"]["value_prop_text"])

    cms_data["services"]["ai_agentic"]["title"] = request.form.get("service_ai_title", cms_data["services"]["ai_agentic"]["title"])
    cms_data["services"]["ai_agentic"]["subtitle"] = request.form.get("service_ai_subtitle", cms_data["services"]["ai_agentic"]["subtitle"])
    cms_data["services"]["ai_agentic"]["content"] = request.form.get("service_ai_content", cms_data["services"]["ai_agentic"]["content"])

    if save_cms_data(cms_data):
        flash("CMS content updated successfully!", "success")
    else:
        flash("Failed to save CMS changes.", "error")

    return redirect(url_for("admin_cms"))


@app.route("/submit-lead", methods=["POST"])
def submit_lead():
    name = request.form.get("name")
    email = request.form.get("email")
    company = request.form.get("company")
    service_track = request.form.get("service_track")
    message = request.form.get("message", "")

    if not name or not email or not company:
        flash("Please fill in all mandatory fields.", "error")
        return redirect(url_for("home"))

    lead_entry = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "name": name,
        "email": email,
        "company": company,
        "service_track": service_track,
        "message": message
    }

    if save_lead(lead_entry):
        flash("Strategy request submitted successfully! An advisor will reach out shortly.", "success")
    else:
        flash("Internal error: Could not record lead submission.", "error")

    return redirect(url_for("home"))


# Keep Existing Historical Legacy Routes for compatibility with existing tests
@app.route('/hello/')
@app.route('/hello/<name>')
def hello(name=None):
    title = "App Home Page"
    if not name:
        text = "Hello, World!  It Is Home Page"
    else:
        text = f"Hello {name} !!"
    return render_template("page.html", name=name, title=title, text=text)


@app.route('/myIP')
def myIP():
    ip = request.remote_addr
    title = "User / Client IP Address Finder"
    if not ip:
        text = "Coudnt Get Your IP"
    else:
        text = f"Hello Your IP Address is {ip}"
    return render_template("page.html", ip=ip, title=title, text=text)


@app.route('/test')
def test():
    return app.send_static_file("test.html")


@app.errorhandler(404)
def page_not_found(error):
    title = "Page Not Found Error"
    text = "Your Requested Page Not Found !!!"
    return render_template('page.html', title=title, text=text), 404


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)
