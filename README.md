# Phising Backend (Phishing Forensics API)

This project is a FastAPI backend that analyzes email/message content for phishing indicators and returns URL-level findings plus an overall email risk score.

## Latest Implementation Status

The current logic in `main.py` includes:

- CORS middleware enabled for frontend access (`allow_origins=["*"]`, `allow_credentials=True`, all methods/headers)
- URL extraction from message text (`https?://[^\s]+`)
- URL expansion by following redirects (`timeout=5`, `allow_redirects=True`)
- Base-domain extraction for URL comparisons (`domain.suffix`)
- Unicode homograph detection
- Visual homograph detection versus sender domain (similarity threshold `> 0.8`)
- URL shortener detection
- External-link detection (sender domain not found in destination base domain)
- Suspicious keyword detection on expanded URL text (`login`, `verify`, `secure`, `account`, `bank`)
- Weighted per-URL risk scoring with conditional weak-signal boost (0 to 100)
- Email header parsing (`From:` and `Return-Path:`)
- Sender spoof detection (`From` domain vs `Return-Path` domain)
- Overall email risk percent calculation and level mapping

## Detection Logic (Current)

### URL-level checks

For each extracted URL:

1. Expand to the final destination URL.
2. Build destination base domain with `tldextract`.
3. Compute detection signals:
   - `visual_homograph`
   - `unicode_homograph`
   - `shortened_url`
   - `external_link`
   - `suspicious_domain`
4. Compute `similarity_score` against the sender domain when sender exists.
5. Build weighted risk score:
   - +50 for `visual_homograph`
   - +40 for `unicode_homograph`
   - +15 for `shortened_url`
   - if score already > 0: +5 for `external_link`
   - if score already > 0: +5 for `suspicious_domain`
   - cap at `100`
6. Generate explanation text from active signals.
7. Classify URL:
   - `risk_percent > 0` -> `risky_urls`
   - `risk_percent == 0` -> `safe_urls`

### Email-level checks

1. Parse sender headers from content:
   - `From:`
   - `Return-Path:`
2. Determine spoofing:
   - `spoofed = sender_domain != return_domain`
   - if either domain is missing, spoofed is `False`
3. Compute email risk:
   - `avg_risk = int(total_risk / len(urls))` (or `0` if no URLs)
   - `email_risk = avg_risk`
   - if `spoofed`: `email_risk += 25`
   - cap at `100`
4. Map `email_risk_percent` to risk level:
   - `0-29` -> `low` (`green`)
   - `30-69` -> `medium` (`yellow`)
   - `70-100` -> `high` (`red`)

## API Endpoints

### GET /

Returns service health status.

Example response:

```json
{
  "status": "Phishing Forensics API running"
}
```

### POST /analyze

Analyzes email/message content.

Request body:

```json
{
  "content": "From: support@secure-mail.com\nReturn-Path: alerts@secure-mail.com\nReview now: https://bit.ly/abc123"
}
```

Response shape:

```json
{
  "total_urls": 1,
  "risky_count": 1,
  "safe_count": 0,
   "email_risk_percent": 25,
   "risk_level": "low",
   "risk_color": "green",
  "email_analysis": {
    "sender": "support@secure-mail.com",
    "return_path": "alerts@secure-mail.com",
    "spoofed": false
  },
  "risky_urls": [
    {
      "original_url": "https://bit.ly/abc123",
      "expanded_url": "https://example-login-check.com",
      "risk_percent": 25,
      "visual_homograph": false,
      "similarity_score": 0.24,
      "unicode_homograph": false,
      "shortened_url": true,
      "external_link": true,
      "suspicious_domain": true,
      "explanation": "This URL shortened URL hides destination and points to external domain and contains phishing-related keywords."
    }
  ],
  "safe_urls": []
}
```

## Current Keyword and Shortener Lists

Suspicious keyword list:

- `login`
- `verify`
- `secure`
- `account`
- `bank`

Known URL shorteners:

- `bit.ly`
- `tinyurl.com`
- `t.co`
- `goo.gl`

## Project Structure

```text
phising_backend/
|- main.py
|- pyrightconfig.json
|- detection_core_logic.txt
|- README.md
```

## Python/Type-Checking Configuration

Current `pyrightconfig.json` values:

- `venvPath`: `.`
- `venv`: `venv`
- `pythonVersion`: `3.14`
- `pythonPlatform`: `Windows`

## Dependencies

Install these packages:

- `fastapi`
- `pydantic`
- `requests`
- `tldextract`
- `uvicorn[standard]`

## Run Locally (Windows PowerShell)

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install fastapi pydantic requests tldextract "uvicorn[standard]"
uvicorn main:app --reload
```

Default local server: `http://127.0.0.1:8000`

Interactive API docs: `http://127.0.0.1:8000/docs`

## Quick Test (PowerShell)

```powershell
Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8000/analyze" -ContentType "application/json" -Body '{"content":"From: support@secure-mail.com\nReturn-Path: alerts@secure-mail.com\nClick: https://bit.ly/abc123 and https://example.org"}'
```

## Current Limitations

- Heuristic-only detection (no ML model yet)
- Static keyword and shortener lists
- Similarity threshold is rule-based and may produce false positives/negatives
- External and keyword signals only add points when another signal has already raised risk
- Header parsing is simple regex-based extraction
- URL expansion depends on network reachability/timeouts
- No SPF/DKIM/DMARC validation
- No threat-intelligence reputation integration
