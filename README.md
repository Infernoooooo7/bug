# 🛡️ PhishForensics: Advanced Security Intelligence Sandbox

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/Build-Passing-success.svg)]()
[![Python 3.10+](https://img.shields.io/badge/Python-3.10+-blue.svg)]()
[![React 18](https://img.shields.io/badge/React-18-cyan.svg)]()

**PhishForensics** is a high-performance, full-stack cybersecurity platform designed for deep analysis of suspicious payloads, phishing attempts, and fraudulent identities. Built with a futuristic "Cyber-Sandbox" aesthetic, it combines heuristic engines, entropy analysis, and real-time threat intelligence to protect organizations from modern social engineering attacks.

---

## ✨ Key Features

### 🔍 Deep Forensic Sandbox
- **Multi-Layer Analysis**: Inspect raw email headers, body content, and suspicious URLs.
- **Heuristic Engine**: Detects visual homograph attacks, DGA (Domain Generation Algorithms), and hidden redirects.
- **Threat Heatmap**: Real-time visualization of attack vectors and threat concentrations.

### 📄 Forensic Reporting
- **PDF Generation**: One-click generation of professional forensic reports including risk scores, metadata, and detailed URL breakdowns.
- **Intelligence Archives**: Comprehensive historical database of all security events with deep-inspection capabilities.

### 👥 Admin & Intelligence Center
- **Security Dashboard**: Unified overview of global risk profiles, engine integrity, and active threat hits.
- **User Management**: Identity and access management for authorized security analysts.
- **Real-Time Reactivity**: Data-driven UI that updates instantly across all modules without page refreshes.

### 🌐 Chrome Extension
- **On-the-Fly Analysis**: Instant analysis of webpage content or manual input directly from the browser.
- **Cloud-Connected**: Seamlessly communicates with the deployed forensic backend for real-time protection.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Glassmorphism UI, Custom CSS-based Heatmaps, Framer Motion animations.
- **Backend**: FastAPI (Python), Pydantic, CORSMiddleware.
- **Database**: SQLite (In-Memory with Shared Cache for High Performance).
- **Security Logic**: TLD Reputation, Entropy Analysis, Homograph Detection, VirusTotal API Integration.
- **Reporting**: ReportLab (High-fidelity PDF generation).

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.10 or higher
- Node.js & npm

### 2. Backend Setup
```bash
# Clone the repository
git clone https://github.com/Infernoooooo7/teamCrackers.git
cd teamCrackers

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo "VT_API_KEY=your_virustotal_key_here" > .env

# Start the forensic server
python -m uvicorn main:app --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Extension Setup
1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the `phish_Extension` folder.

---

## 🌐 Deployment

The backend is optimized for cloud deployment on platforms like **Render**.
- **Database**: Uses shared-memory SQLite, making it compatible with ephemeral disk instances.
- **API Base**: [https://teamcrackers.onrender.com](https://teamcrackers.onrender.com)

---

<div align="center">
  <p>Built for the Hackathon winning demo by <strong>Team Crackers</strong>.</p>
</div>
