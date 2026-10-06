"""
Backend for the agency website (Flask).
- Serves the static site (index.html, styles.css, script.js)
- POST /api/contact  -> validates a lead, saves it to leads.csv,
  and optionally forwards it to a webhook (n8n, Slack, Zapier...).

Run:  pip install -r requirements.txt
      python app.py        ->  http://127.0.0.1:5000
"""
import csv
import os
import re
import threading
from datetime import datetime, timezone

import requests
from flask import Flask, jsonify, request, send_from_directory

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LEADS_FILE = os.path.join(BASE_DIR, "leads.csv")
# Optional: set this env var to forward each lead to an n8n/Slack/Zapier webhook
WEBHOOK_URL = os.environ.get("LEAD_WEBHOOK_URL", "")

app = Flask(__name__)
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
lock = threading.Lock()
recent = {}  # naive rate limit: ip -> list of timestamps


def rate_limited(ip, limit=5, window=600):
    now = datetime.now().timestamp()
    hits = [t for t in recent.get(ip, []) if now - t < window]
    hits.append(now)
    recent[ip] = hits
    return len(hits) > limit


@app.route("/")
def home():
    return send_from_directory(BASE_DIR, "index.html")


@app.route("/<path:filename>")
def assets(filename):
    if filename in ("styles.css", "script.js"):
        return send_from_directory(BASE_DIR, filename)
    return ("Not found", 404)


@app.post("/api/contact")
def contact():
    ip = request.headers.get("X-Forwarded-For", request.remote_addr or "unknown")
    if rate_limited(ip):
        return jsonify(error="Too many requests. Please try again later."), 429

    data = request.get_json(silent=True) or {}
    if data.get("website"):  # honeypot field: bots fill it, humans don't
        return jsonify(ok=True)

    name = str(data.get("name", "")).strip()[:100]
    email = str(data.get("email", "")).strip()[:150]
    company = str(data.get("company", "")).strip()[:120]
    service = str(data.get("service", "")).strip()[:80]
    message = str(data.get("message", "")).strip()[:2000]

    if not (name and email and service and message):
        return jsonify(error="Please fill in all required fields."), 400
    if not EMAIL_RE.match(email):
        return jsonify(error="Please enter a valid email address."), 400

    lead = {
        "timestamp": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "name": name, "email": email, "company": company,
        "service": service, "message": message,
    }

    # Guard against spreadsheet formula injection when opened in Excel/Sheets
    safe = {k: ("'" + v if v[:1] in "=+-@" else v) for k, v in lead.items()}
    with lock:
        new_file = not os.path.exists(LEADS_FILE)
        with open(LEADS_FILE, "a", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=list(lead.keys()))
            if new_file:
                w.writeheader()
            w.writerow(safe)

    if WEBHOOK_URL:
        try:
            requests.post(WEBHOOK_URL, json=lead, timeout=8)
        except requests.RequestException as exc:
            app.logger.warning("Webhook failed: %s", exc)

    return jsonify(ok=True)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
