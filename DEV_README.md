# DEV README (Internal)

This file is for development notes only.

## Scope

Frontend-backend integration was done with minimal changes and no UI redesign.

- Frontend folder: `frontend/`
- Backend base URL: `http://127.0.0.1:8000`
- Analyze endpoint: `POST /analyze`

## Integration Changes Applied

### 1) Frontend API wiring

File updated: `frontend/src/App.jsx`

- Added a fixed endpoint constant:
  - `const ANALYZE_ENDPOINT = 'http://127.0.0.1:8000/analyze';`
- Updated analyze handler to use `fetch` with:
  - method: `POST`
  - header: `Content-Type: application/json`
  - body: `{ content: emailText }`
- Parsed backend JSON response.
- Stored response fields in state:
  - `email_risk_percent`
  - `risk_level`
  - `risk_color`
  - `email_analysis`
  - `risky_urls`
  - `safe_urls`
- Added minimal error handling:
  - `console.error(...)` on request failure.

### 2) URL list rendering

File updated: `frontend/src/App.jsx`

- Kept existing layout/cards.
- Display now shows separate sections for:
  - risky URLs (`results.riskyUrls`)
  - safe URLs (`results.safeUrls`)
- Threat score and level use backend values already returned by `/analyze`.

### 3) Root npm script convenience

File added: `package.json` (project root)

- `npm start` runs backend via:
  - `python -m uvicorn main:app --reload`

## What Was Not Changed

- No CSS file changes for integration.
- No component refactor or file renaming.
- No new pages.
- No new frontend libraries introduced for API integration.

## Backend Contract Used

Request:

```json
{
  "content": "string"
}
```

Response fields consumed by frontend:

```json
{
  "email_risk_percent": 0,
  "risk_level": "low",
  "risk_color": "green",
  "risky_urls": [],
  "safe_urls": [],
  "email_analysis": {
    "sender": "",
    "return_path": "",
    "spoofed": false
  }
}
```

## Run Instructions (Dev)

### Backend

From project root:

```powershell
npm start
```

Alternative:

```powershell
python -m uvicorn main:app --reload
```

### Frontend

From `frontend/`:

```powershell
npm install
npm run dev
```

## Quick Manual Test

1. Start backend on `http://127.0.0.1:8000`.
2. Start frontend in `frontend/`.
3. Paste sample email text in the textarea.
4. Click Analyze.
5. Verify the UI shows:
   - email risk percent
   - risk level
   - risky URL list
   - safe URL list

## Known Note

- Current frontend build may fail if `html2pdf.js` is missing from frontend dependencies because `frontend/src/App.jsx` imports it.
- If needed, install inside `frontend/`:

```powershell
npm install html2pdf.js
```
