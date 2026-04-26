from entropy_analysis import is_high_entropy_domain
from db import (
    init_db,
    save_scan,
    get_recent_scans,
    get_cached_url,
    save_url_cache,
    delete_scan,
    update_scan,
    get_all_scans,
    get_stats,
    get_threat_intel,
    get_reports_list,
    get_scan_by_id
)
from threat_api import check_url_virustotal

from fastapi import FastAPI, Response
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from report_generator import generate_pdf_report
import json

import re
import requests
import tldextract
import difflib
import ipaddress

from url_risk_signals import (
    suspicious_tld,
    many_hyphens,
    is_long_url,
    has_many_subdomains
)

app = FastAPI()
init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class EmailInput(BaseModel):
    content: str


class LoginInput(BaseModel):
    username: str
    password: str


class UpdateLogInput(BaseModel):
    risk_level: str
    risk_percent: int

class ReportInput(BaseModel):
    risk_level: str = "low"
    email_risk_percent: int = 0
    email_analysis: dict = {}
    risky_urls: list = []
    safe_urls: list = []


# ========================
# Utility Functions
# ========================

def detect_urls(text):
    return re.findall(r'https?://[^\s]+', text)


def get_base_domain(url):
    ext = tldextract.extract(url)
    return f"{ext.domain}.{ext.suffix}".lower()


def extract_domain(email):
    if not email or "@" not in email:
        return None
    return email.split("@")[-1].lower()


def similarity(a, b):
    return difflib.SequenceMatcher(None, a, b).ratio()


def detect_unicode_homograph(url):
    return any(ord(c) > 127 for c in url)


def is_shortened(url):
    shorteners = ["bit.ly", "tinyurl.com", "t.co", "goo.gl"]
    return any(s in url.lower() for s in shorteners)


def check_suspicious_domain(url):
    domain = get_base_domain(url)
    full = url.lower()
    keywords = ["login", "secure", "bank", "update", "verify", "account", "support", "auth"]
    domain_hits = sum(1 for k in keywords if k in domain)
    path_hits = sum(1 for k in keywords if k in full)
    return (domain_hits + path_hits) >= 2


def expand_url(url):
    try:
        r = requests.get(url, timeout=5, allow_redirects=True)
        return r.url
    except:
        return url


def extract_email_headers(text):
    from_match = re.search(r'From:\s*(.*)', text)
    return_match = re.search(r'Return-Path:\s*(.*)', text)

    sender = from_match.group(1).strip() if from_match else None
    return_path = return_match.group(1).strip() if return_match else None

    return sender, return_path


def check_sender_spoof(sender, return_path):
    s = extract_domain(sender)
    r = extract_domain(return_path)

    if not s or not r:
        return False

    return s != r


def is_ip_url(url):
    try:
        host = url.split("//")[-1].split("/")[0]
        ipaddress.ip_address(host)
        return True
    except:
        return False


# ========================
# Routes
# ========================

@app.get("/")
def home():
    return {"status": "PhishForensics API running"}


@app.post("/login")
def login(data: LoginInput):
    if data.username == "admin" and data.password == "admin123":
        return {"success": True, "role": "admin", "message": "Login successful"}
    if data.username == "user" and data.password == "user123":
        return {"success": True, "role": "analyst", "message": "Login successful"}
    return {"success": False, "message": "Invalid credentials"}


@app.get("/history")
async def get_history():
    scans = get_recent_scans(limit=10)
    # scans is already a list of dicts from db.py
    return {"history": scans}

@app.get("/stats")
async def get_system_stats():
    return get_stats()

import csv
from io import StringIO

@app.get("/health")
async def health():
    return {"status": "online", "database": "connected", "version": "v2.4.0-pro"}

@app.get("/reports")
async def get_reports():
    # Dynamic list of 'available' reports based on DB state
    stats = get_stats()
    return [
        {"id": "audit_csv", "name": f"Global_Audit_Logs_{stats['total_scans']}.csv", "date": "2026-04-26", "size": "450 KB", "type": "CSV"},
        {"id": "intel_json", "name": "Threat_Intelligence_Summary.json", "date": "2026-04-25", "size": "120 KB", "type": "JSON"},
        {"id": "exec_pdf", "name": "Executive_Security_Summary.pdf", "date": "2026-04-26", "size": "1.2 MB", "type": "PDF"}
    ]

@app.get("/download/{report_id}")
async def download_report(report_id: str):
    if report_id == "audit_csv":
        return await export_logs_csv()
    if report_id == "intel_json":
        return await export_logs_json()
    if report_id == "exec_pdf":
        return await export_pdf_summary()
    return Response(content="Report not found", status_code=404)

@app.get("/export")
@app.get("/export/csv")
async def export_logs_csv():
    scans = get_all_scans()
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Timestamp", "Sender", "Return Path", "Risk Level", "Risk Percent", "Payload", "Full Analysis"])
    for row in scans:
        writer.writerow([row.get(k, "") for k in ["id", "timestamp", "sender", "return_path", "risk_level", "risk_percent", "payload", "full_analysis"]])
    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=PhishForensics_Audit_Logs.csv"}
    )

@app.get("/export/json")
async def export_logs_json():
    scans = get_all_scans()
    content = json.dumps(scans, indent=2)
    return Response(
        content=content,
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=PhishForensics_Raw_Data.json"}
    )

@app.get("/export/pdf-summary")
async def export_pdf_summary():
    stats = get_stats()
    # Create a summary report payload
    summary_data = {
        "email_risk_percent": 0, # Not used for summary
        "risk_level": "N/A",
        "email_analysis": {"sender": "SYSTEM", "return_path": "SYSTEM", "spoofed": False},
        "summary": f"Total Scans: {stats['total_scans']} | High Risk: {stats['high_risk']} | Medium: {stats['medium_risk']}",
        "risky_urls": stats["top_threats"] # Reuse top threats for URL list in report
    }
    pdf_bytes = generate_pdf_report(summary_data)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=Executive_Security_Summary.pdf"}
    )

@app.get("/threat-intel")
async def threat_intel():
    return get_threat_intel()


@app.get("/report/{log_id}")
async def get_single_report(log_id: int):
    scan = get_scan_by_id(log_id)
    if not scan:
        return Response(content="Report not found", status_code=404)
    
    # Ensure scan is formatted for report_generator
    # report_generator expects a dict that looks like result_dict from /analyze
    try:
        report_data = json.loads(scan["full_analysis"])
    except:
        # Fallback if no full_analysis
        report_data = {
            "email_risk_percent": scan["risk_percent"],
            "risk_level": scan["risk_level"],
            "email_analysis": {"sender": scan["sender"], "return_path": scan["return_path"], "spoofed": False},
            "risky_urls": [],
            "safe_urls": []
        }
    
    pdf_bytes = generate_pdf_report(report_data)
    return Response(
        content=pdf_bytes, 
        media_type="application/pdf", 
        headers={"Content-Disposition": f"attachment; filename=Forensic_Report_{log_id}.pdf"}
    )

@app.get("/threat-heatmap")
async def threat_heatmap():
    stats = get_stats()
    # stats already contains counts for high/medium/low and top_threats
    # We'll re-format it for the heatmap specifically
    
    threats = {t["name"]: t["count"] for t in stats["top_threats"]}
    
    return {
        "high": stats["high_risk"],
        "medium": stats["medium_risk"],
        "low": stats["low_risk"],
        "ip_urls": threats.get("IP Address URL", 0),
        "shortened": threats.get("Shortened URL", 0),
        "domains": threats.get("Suspicious Domain", 0) + threats.get("Phishing Link", 0)
    }


@app.delete("/delete-log/{log_id}")
def delete_log(log_id: int):
    delete_scan(log_id)
    return {"success": True, "message": "Log deleted successfully"}


@app.put("/update-log/{log_id}")
def update_log(log_id: int, data: UpdateLogInput):
    update_scan(log_id, data.risk_level, data.risk_percent)
    return {"success": True, "message": "Log updated successfully"}


@app.post("/generate-report")
def generate_report(data: ReportInput):
    pdf_bytes = generate_pdf_report(data.dict())
    return Response(
        content=pdf_bytes, 
        media_type="application/pdf", 
        headers={"Content-Disposition": "attachment; filename=Forensic_Report.pdf"}
    )


@app.post("/analyze")
def analyze_email(data: EmailInput):

    urls = detect_urls(data.content)

    sender, return_path = extract_email_headers(data.content)
    sender_domain = extract_domain(sender)

    spoofed = check_sender_spoof(sender, return_path)

    risky_urls = []
    safe_urls = []
    total_risk = 0

    for url in urls:
        expanded = expand_url(url)
        base = get_base_domain(expanded)

        unicode_homograph = detect_unicode_homograph(expanded)
        shortened = is_shortened(url)
        suspicious = check_suspicious_domain(expanded)

        ip_flag = is_ip_url(expanded)
        subdomain_flag = has_many_subdomains(expanded)
        long_flag = is_long_url(expanded)
        tld_flag = suspicious_tld(expanded)
        hyphen_flag = many_hyphens(expanded)

        entropy_flag, entropy_value = is_high_entropy_domain(base)

        visual_homograph = False
        similarity_score = 0

        if sender_domain:
            similarity_score = similarity(base, sender_domain)
            if base != sender_domain and similarity_score > 0.85:
                visual_homograph = True

        external = sender_domain not in base if sender_domain else False

        risk = 0

        if unicode_homograph: risk += 40
        if visual_homograph: risk += 50
        if shortened: risk += 15
        if suspicious: risk += 45
        if ip_flag: risk += 40
        if subdomain_flag: risk += 20
        if tld_flag: risk += 10
        if hyphen_flag: risk += 10
        if entropy_flag: risk += 15
        if long_flag and risk > 0: risk += 10
        if risk > 0 and external: risk += 5

        # ========================
        # 🔥 DETERMINISTIC VT LOGIC
        # ========================

        vt_flag = get_cached_url(expanded)

        if vt_flag is None:
            if risk > 20:
                vt_flag, _ = check_url_virustotal(expanded)
                save_url_cache(expanded, vt_flag)
            else:
                vt_flag = False

        if vt_flag:
            risk += 40

        risk = min(risk, 100)

        reasons = []

        if visual_homograph: reasons.append("domain mimics sender")
        if unicode_homograph: reasons.append("unicode characters used")
        if shortened: reasons.append("shortened URL")
        if suspicious: reasons.append("phishing keywords detected")
        if ip_flag: reasons.append("uses raw IP")
        if subdomain_flag: reasons.append("too many subdomains")
        if tld_flag: reasons.append("suspicious TLD")
        if hyphen_flag: reasons.append("many hyphens")
        if entropy_flag: reasons.append(f"high entropy ({round(entropy_value,2)})")
        if long_flag and risk > 0: reasons.append("long URL")
        if external and risk > 20: reasons.append("external domain")
        if vt_flag: reasons.append("flagged by VirusTotal")

        explanation = (
            "This URL " + " and ".join(reasons) + "."
            if reasons else "No major phishing indicators."
        )

        obj = {
            "original_url": url,
            "expanded_url": expanded,
            "risk_percent": risk,
            "entropy_score": round(entropy_value, 2),
            "explanation": explanation
        }

        total_risk += risk

        if risk > 0:
            risky_urls.append(obj)
        else:
            safe_urls.append(obj)

    avg_risk = int(total_risk / len(urls)) if urls else 0
    email_risk = avg_risk + (25 if spoofed else 0)
    email_risk = min(email_risk, 100)

    if email_risk >= 70:
        risk_level = "high"
    elif email_risk >= 30:
        risk_level = "medium"
    else:
        risk_level = "low"

    result_dict = {
        "email_risk_percent": email_risk,
        "risk_level": risk_level,
        "email_analysis": {
            "sender": sender,
            "return_path": return_path,
            "spoofed": spoofed
        },
        "risky_urls": risky_urls,
        "safe_urls": safe_urls
    }

    new_id = save_scan(sender, return_path, risk_level, email_risk, data.content, json.dumps(result_dict))
    result_dict["id"] = new_id
    return result_dict