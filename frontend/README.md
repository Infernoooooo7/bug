# Frontend (PhishForensics Sandbox)

React + Vite frontend for visualizing phishing analysis results from the FastAPI backend.

## Features

- Paste raw email/message content
- Submit analysis request to backend `POST /analyze`
- Render threat score and risk level
- Show sender/return-path spoofing analysis
- Display risky and safe URL cards with explanations
- Export report to PDF using `html2pdf.js`

## API Dependency

Current hardcoded analyze endpoint in `src/App.jsx`:

- `http://127.0.0.1:8000/analyze`

Make sure backend is running before using the UI.

## Run Locally

```powershell
npm install
npm run dev
```

Vite default local URL is usually shown in terminal (commonly `http://localhost:5173`).

## Build

```powershell
npm run build
npm run preview
```

## Tech Stack

- React 19
- Vite
- html2pdf.js
- CSS-based custom dashboard UI
