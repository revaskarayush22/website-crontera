# Crontera: AI solutions — Agency Website

Stack: HTML + CSS + JavaScript (frontend) and Python/Flask (lead form backend).

## Run locally
```bash
pip install -r requirements.txt
python app.py
```
Open http://127.0.0.1:5000

Leads are saved to `leads.csv`. To also send each lead to n8n / Slack / Zapier:
```bash
export LEAD_WEBHOOK_URL="https://your-n8n-url/webhook/lead"
```

## Customize (search and replace)
- `hello@youragency.com` and the WhatsApp number in the Contact section
- Testimonials -> replace with real client quotes
- Package prices -> replace "Custom quote" if you want fixed prices
- Colors -> edit the `:root` variables at the top of styles.css

## Deploy
- Full site with form: Render, Railway, or PythonAnywhere (run `app.py` with gunicorn)
- Static only (no form backend): Netlify / GitHub Pages, and point the form to an n8n webhook in script.js
