from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import re
import requests
import tldextract
import difflib
import ipaddress

from url_risk_signal import (
    suspicious_tld,
    many_hyphens,
    is_long_url,
    has_many_subdomains
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EmailInput(BaseModel):
    content: str

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
    keywords = ["login", "verify", "secure", "account", "bank"]
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

@app.get("/")
def home():
    return {"status": "Phishing Forensics API running"}

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

        visual_homograph = False
        similarity_score = 0

        if sender_domain:
            similarity_score = similarity(base, sender_domain)
            if base != sender_domain and similarity_score > 0.85:
                visual_homograph = True

        external = sender_domain not in base if sender_domain else False

        risk = 0

        if unicode_homograph:
            risk += 40

        if visual_homograph:
            risk += 50

        if shortened:
            risk += 15

        if suspicious:
            risk += 45

        if ip_flag:
            risk += 40

        if subdomain_flag:
            risk += 20

        if tld_flag:
            risk += 10

        if hyphen_flag:
            risk += 10

        if long_flag and risk > 0:
            risk += 10

        if risk > 0 and external:
            risk += 5

        risk = min(risk, 100)

        reasons = []

        if visual_homograph:
            reasons.append("domain closely mimics sender domain")

        if unicode_homograph:
            reasons.append("uses Unicode characters")

        if shortened:
            reasons.append("shortened URL hides destination")

        if suspicious:
            reasons.append("multiple phishing-related keywords detected")

        if ip_flag:
            reasons.append("uses raw IP address instead of domain")

        if subdomain_flag:
            reasons.append("excessive subdomains detected")

        if tld_flag:
            reasons.append("uses suspicious top-level domain")

        if hyphen_flag:
            reasons.append("domain contains many hyphens")

        if long_flag and risk > 0:
            reasons.append("unusually long URL")

        if external and risk > 20:
            reasons.append("points to external domain")

        explanation = (
            "This URL " + " and ".join(reasons) + "."
            if reasons else "No major phishing indicators detected."
        )

        obj = {
            "original_url": url,
            "expanded_url": expanded,
            "risk_percent": risk,
            "visual_homograph": visual_homograph,
            "similarity_score": round(similarity_score, 2),
            "unicode_homograph": unicode_homograph,
            "shortened_url": shortened,
            "external_link": external,
            "suspicious_domain": suspicious,
            "explanation": explanation
        }

        total_risk += risk

        if risk > 0:
            risky_urls.append(obj)
        else:
            safe_urls.append(obj)

    avg_risk = int(total_risk / len(urls)) if urls else 0

    email_risk = avg_risk
    if spoofed:
        email_risk += 25

    email_risk = min(email_risk, 100)

    risk_level = "low"
    if email_risk >= 70:
        risk_level = "high"
    elif email_risk >= 30:
        risk_level = "medium"

    risk_color = "green"
    if risk_level == "high":
        risk_color = "red"
    elif risk_level == "medium":
        risk_color = "yellow"

    return {
        "total_urls": len(urls),
        "risky_count": len(risky_urls),
        "safe_count": len(safe_urls),
        "email_risk_percent": email_risk,
        "risk_level": risk_level,
        "risk_color": risk_color,
        "email_analysis": {
            "sender": sender,
            "return_path": return_path,
            "spoofed": spoofed
        },
        "risky_urls": risky_urls,
        "safe_urls": safe_urls
    }