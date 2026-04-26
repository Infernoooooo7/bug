import os
import requests
import base64
import time
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("VT_API_KEY")

def check_url_virustotal(url):
    try:
        headers = {
            "x-apikey": API_KEY
        }

        # Encode URL
        url_id = base64.urlsafe_b64encode(url.encode()).decode().strip("=")

        # Step 1: Try getting existing report
        report_url = f"https://www.virustotal.com/api/v3/urls/{url_id}"
        response = requests.get(report_url, headers=headers)

        if response.status_code == 200:
            data = response.json()

            stats = data["data"]["attributes"]["last_analysis_stats"]

            malicious = stats.get("malicious", 0)
            suspicious = stats.get("suspicious", 0)

            if malicious > 0 or suspicious > 0:
                return True, f"Flagged by VirusTotal ({malicious} malicious engines)"

            return False, None

        # Step 2: Submit URL if not found
        submit_url = "https://www.virustotal.com/api/v3/urls"
        submit_response = requests.post(
            submit_url,
            headers=headers,
            data={"url": url}
        )

        if submit_response.status_code == 200:
            time.sleep(2)  # wait for scan

        return False, None

    except Exception as e:
        print("VirusTotal error:", e)
        return False, None