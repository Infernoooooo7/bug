# PhishForensics Sandbox 🛡️

A comprehensive phishing forensic analysis platform built with **FastAPI** and **React**. This tool allows security researchers to analyze raw email headers and body content to detect sophisticated phishing indicators, including homograph attacks, suspicious redirects, and real-world threat intelligence via VirusTotal.

## 🚀 Key Features

- **Email Header Analysis**: Detects sender spoofing by comparing `From` and `Return-Path` headers.
- **Deep URL Inspection**:
    - **Redirect Expansion**: Automatically follows shortened URLs to their final destination.
    - **Homograph Detection**: Identifies Unicode character spoofing and visual domain mimicry.
    - **Entropy Analysis**: Detects high-randomness domains often used in DGA (Domain Generation Algorithms).
    - **Signal Scoring**: Multi-layered heuristic scoring based on TLD, hyphens, subdomains, and keywords.
- **Real-world Threat Intelligence**: Integrated with the **VirusTotal API** to check URLs against 70+ security vendors.
- **Forensic PDF Reports**: Generate professional security reports directly from the sandbox.
- **Scan History**: Persistent storage of past analyses using SQLite.

## 🛠️ Tech Stack

- **Backend**: Python, FastAPI, SQLite, Pydantic
- **Frontend**: React (Vite), Lucide Icons, jsPDF
- **Security Tools**: VirusTotal API, Entropy Analysis, TLD Extraction

## 🚦 Getting Started

### Prerequisites

- Python 3.9+
- Node.js & npm

### Backend Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Infernoooooo7/bug.git
   cd phising_backend
   ```

2. **Create a virtual environment**:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

3. **Install dependencies**:
   ```powershell
   pip install -r requirements.txt
   # Or manually:
   pip install fastapi pydantic requests tldextract python-dotenv "uvicorn[standard]"
   ```

4. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   VT_API_KEY=your_virustotal_api_key
   ```

5. **Run the server**:
   ```powershell
   python -m uvicorn main:app --reload
   ```

### Frontend Setup

1. **Navigate to the frontend directory**:
   ```powershell
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

## 📊 Risk Scoring Logic

The sandbox assigns a risk percentage (0-100%) based on weighted indicators:

| Indicator | Risk Weight |
| :--- | :--- |
| Visual Homograph | +50 |
| Suspicious Keywords | +45 |
| Unicode Homograph | +40 |
| IP Address as URL | +40 |
| **VirusTotal Flag** | **+40** |
| Sender Spoofed | +25 |
| High Entropy Domain | +15 |

## 🛡️ Security Note

This tool is for educational and forensic purposes. When testing live phishing links, always use a sandboxed environment. API keys are managed via environment variables to ensure repository security.

---
*Created for the Hackathon Submission by [Infernoooooo7](https://github.com/Infernoooooo7)*
