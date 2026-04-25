# Phising Backend (Phishing Forensics API)

FastAPI backend plus React frontend for phishing forensics. The API analyzes raw email/message content and returns URL-level findings plus an overall email risk score.

## Current Status

The active detection engine in `main.py` now includes:

- URL extraction from raw text (`https?://[^\s]+`)
- Redirect expansion (`timeout=5`, `allow_redirects=True`)
- Base domain parsing with `tldextract`
- Sender and return-path parsing (`From`, `Return-Path`)
- Sender spoof detection (`From` domain mismatch with `Return-Path` domain)
- Unicode homograph detection
- Visual homograph detection against sender domain (`similarity_score > 0.85`)
- URL shortener detection (`bit.ly`, `tinyurl.com`, `t.co`, `goo.gl`)
- Suspicious keyword density check (`login`, `verify`, `secure`, `account`, `bank`) across domain + full URL
- Raw IP URL detection
- Excessive subdomain detection (> 3 dots in host)
- Suspicious TLD detection (`xyz`, `top`, `work`)
- Excessive hyphen detection (>= 3 in base domain)
- Long URL signal (length > 75, only if another signal is already active)
- External-link signal relative to sender domain
- Per-URL risk scoring with cap at 100
- Email-level risk scoring with spoof penalty and level mapping
- CORS middleware enabled for frontend usage

## Risk Scoring (Current Weights)

Per URL:

- +50 visual homograph
- +40 unicode homograph
- +15 shortened URL
- +45 suspicious keyword density
- +40 raw IP URL
- +20 excessive subdomains
- +10 suspicious TLD
- +10 excessive hyphens
- +10 long URL (only when risk is already > 0)
- +5 external domain (only when risk is already > 0)
- final cap: 100

Email-level risk:

- `avg_risk = int(total_url_risk / total_urls)`
- `+25` if sender spoofed
- final cap: 100
- level mapping:
   - `0-29`: low (green)
   - `30-69`: medium (yellow)
   - `70-100`: high (red)

## API

### GET /

Health endpoint.

Example:

```json
{
   "status": "Phishing Forensics API running"
}
```

### POST /analyze

Request body:

```json
{
   "content": "From: support@company.com\nReturn-Path: alerts@company.com\nCheck this now: https://bit.ly/demo"
}
```

Response includes:

- `email_risk_percent`, `risk_level`, `risk_color`
- `email_analysis` (`sender`, `return_path`, `spoofed`)
- `risky_urls` and `safe_urls`
- per-URL explanations and individual signal booleans

## Project Layout

```text
phising_backend/
|- main.py
|- detection_core_logic.txt
|- README.md
|- DEV_README.md
|- frontend/
|  |- src/
|  |- README.md
|  |- temp_move/
|     |- main.py
|     |- detection_core_logic.txt
|     |- README.md
|     |- pyrightconfig.json
```

`frontend/temp_move` is used as a mirror snapshot for backend artifacts.

## Setup (Windows PowerShell)

Backend:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install fastapi pydantic requests tldextract "uvicorn[standard]"
python -m uvicorn main:app --reload
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

Useful URLs:

- API: `http://127.0.0.1:8000`
- API docs: `http://127.0.0.1:8000/docs`

## Quick API Test

```powershell
Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8000/analyze" -ContentType "application/json" -Body '{"content":"From: support@secure-mail.com\nReturn-Path: alerts@secure-mail.com\nClick: https://bit.ly/abc123 and https://example.org"}'
```

## Known Limitations

- Heuristic/rule-based detection (no ML model yet)
- Static signal lists and thresholds
- Network dependency for URL expansion
- No SPF/DKIM/DMARC verification
- No threat-intelligence feed integration
