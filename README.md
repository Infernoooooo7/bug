# 🛡️ PhishForensics Sandbox
### *Advanced Phishing Intelligence & Forensic Analysis Engine*

---

## 📌 Problem Statement
Phishing remains the #1 entry point for cyberattacks, responsible for over 90% of data breaches. Modern attackers have evolved beyond simple typos, using **homograph attacks (look-alike characters)**, **URL shorteners**, and **dynamic redirects** to bypass traditional filters. Security teams and end-users need a sandboxed environment to deconstruct these threats without risking infection or data exposure.

## 💡 Solution Overview
**PhishForensics Sandbox** is a high-fidelity analysis platform designed to strip away the deception of phishing attempts. By combining heuristic analysis, cryptographic entropy checks, and real-time threat intelligence, the system provides a comprehensive "Security Blueprint" of any suspicious link or email content. It doesn't just say if a link is bad—it explains *why*, providing actionable forensic evidence.

## 🧠 Key Features
*   **🔍 Multi-Stage URL Analysis**: Deep-dive inspection of URLs, including expansion of shortened links (Bitly, TinyURL) to reveal final destinations.
*   **⚖️ Intelligent Risk Scoring**: A proprietary weighted scoring engine that evaluates heuristics, domain age, and structural anomalies.
*   **🎭 Deception Detection**: Specialized algorithms to catch **Homograph (Punycode) attacks**, suspicious TLDs, and IP-based URLs.
*   **🌐 Threat Intelligence Integration**: Real-time reputation lookups via the **VirusTotal API**.
*   **📉 Entropy-Based Logic**: Detects procedurally generated or obfuscated URLs using Shannon Entropy calculations.
*   **📄 Forensic PDF Reporting**: One-click generation of professional PDF reports for incident documentation.
*   **📊 Interactive Dashboard**: A sleek, React-based interface with real-time risk visualizations and scan history tracking.

## 🏗️ Architecture Overview
The project follows a modern, decoupled architecture:
1.  **Frontend (React)**: A highly responsive SPA that handles user input, communicates with the backend via REST APIs, and renders forensic data visualizations.
2.  **Backend (FastAPI)**: An asynchronous Python microservice that orchestrates the analysis engine, manages external API calls, and performs heavy computation.
3.  **Data Layer (SQLite)**: A lightweight, persistent database for logging scan history and trend analysis.
4.  **Forensic Layer**: Modular Python scripts for specific checks (Entropy, Heuristics, Threat Intel).

## ⚙️ Tech Stack
*   **Frontend**: React.js, Vite, CSS3 (Modern Glassmorphism)
*   **Backend**: Python 3.x, FastAPI, Uvicorn
*   **Database**: SQLite
*   **APIs**: VirusTotal v3
*   **Libraries**: Pydantic, Requests, ReportLab (PDF Generation), Math (Entropy)

## 🔍 How It Works
1.  **Ingestion**: The user pastes a suspicious URL or raw email content into the dashboard.
2.  **Normalization**: The engine cleans the input and follows all redirects to identify the "True Destination."
3.  **Heuristic Scan**: The URL is parsed for red flags:
    *   *Is it an IP address?*
    *   *Does it contain sensitive keywords (login, bank, verify)?*
    *   *Is the entropy suspiciously high?*
4.  **Intel Lookup**: The engine queries global threat databases for historical malicious activity.
5.  **Score Compilation**: All signals are aggregated into a 0-100 Risk Score.
6.  **Reporting**: Results are displayed visually and stored for future forensic reference.

## 🧪 Sample Use Case
**Scenario**: An employee receives an email from `support@microsоft.com`. 
*   **Attack**: The "o" in microsoft is actually a Cyrillic character (U+043E).
*   **PhishForensics Detection**: The engine identifies the Punycode mismatch (`xn--microsft-pbg.com`), calculates a high risk score for "Homograph Deception," and flags it as a CRITICAL threat before the user clicks.

## 📊 Output Explanation
*   **0-30 (Low Risk)**: Likely safe, but exercise standard caution.
*   **31-70 (Suspicious)**: Contains multiple red flags; do not enter credentials.
*   **71-100 (Critical)**: Confirmed malicious or highly deceptive; immediate block recommended.

## 🔐 Security Considerations
*   **Sandboxed Environment**: The analysis is performed server-side to protect the client's browser.
*   **API Key Management**: Sensitive credentials (VirusTotal) are managed via `.env` files and never exposed to the frontend.
*   **Safe Handling**: The system defangs links in reports to prevent accidental clicks.

## 🛠️ Installation & Setup

### Prerequisites
*   Python 3.8+
*   Node.js 16+
*   VirusTotal API Key

### 1. Backend Setup
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/PhishForensics-Sandbox.git
cd PhishForensics-Sandbox

# Create virtual environment
python -m venv venv
source venv/bin/scripts/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure Environment
echo "VT_API_KEY=your_actual_key_here" > .env
```

### 2. Frontend Setup
```bash
cd frontend
npm install
```

## ▶️ How to Run

### Start Backend
```bash
# From the root directory
uvicorn main:app --reload
```

### Start Frontend
```bash
# From the frontend directory
npm run dev
```

## 📁 Project Structure
```text
.
├── main.py                 # FastAPI Entry Point
├── db.py                   # SQLite Database Configuration
├── entropy_analysis.py     # URL Randomness Logic
├── url_risk_signals.py     # Heuristic Rule Engine
├── threat_api.py           # VirusTotal Integration
├── scan_history.db         # Local Database (ignored by git)
├── requirements.txt        # Backend Dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Main React Logic
│   │   ├── utils/          # PDF Generation & Helpers
│   │   └── index.css       # Premium UI Styling
│   └── package.json        # Frontend Dependencies
└── .env                    # Sensitive Configurations
```

## 🌟 Future Improvements
*   **AI-Powered Detection**: Implement a Random Forest model trained on PhishTank datasets.
*   **Screenshot Preview**: Capture a safe image of the destination site using a headless browser.
*   **Browser Extension**: Real-time analysis of links as users browse.
*   **Deep Email Parsing**: Uploading `.eml` files for full header analysis.

## 🤝 Contribution
Contributions are welcome! Please fork the repository, create a feature branch, and submit a PR. For major changes, please open an issue first to discuss what you would like to change.


---
