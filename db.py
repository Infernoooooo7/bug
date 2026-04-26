import sqlite3
from datetime import datetime

DB_NAME = "file:memdb1?mode=memory&cache=shared"
_keep_alive = None


def init_db():
    # Shared in-memory DB connection to keep the database alive across threads
    # We use the URI format so that sqlite3.connect() hits the same shared memory space
    global _keep_alive
    _keep_alive = sqlite3.connect(DB_NAME, uri=True, check_same_thread=False)
    conn = _keep_alive
    cursor = conn.cursor()

    # Scan history table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            sender TEXT,
            return_path TEXT,
            risk_level TEXT,
            risk_percent INTEGER,
            payload TEXT,
            full_analysis TEXT
        )
    """)
    
    # Safe alter table for existing DBs
    try:
        cursor.execute("ALTER TABLE history ADD COLUMN payload TEXT")
    except sqlite3.OperationalError:
        pass
    try:
        cursor.execute("ALTER TABLE history ADD COLUMN full_analysis TEXT")
    except sqlite3.OperationalError:
        pass

    # 🔥 Cache table for VirusTotal
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS url_cache (
            url TEXT PRIMARY KEY,
            vt_flag INTEGER,
            checked_at TEXT
        )
    """)

    conn.commit()
    print("Database initialized (In-Memory Shared). Master connection active.")


def save_scan(sender, return_path, risk_level, risk_percent, payload="", full_analysis="{}"):
    conn = sqlite3.connect(DB_NAME, uri=True)
    cursor = conn.cursor()

    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute("""
        INSERT INTO history (timestamp, sender, return_path, risk_level, risk_percent, payload, full_analysis)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (current_time, sender, return_path, risk_level, risk_percent, payload, full_analysis))

    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    print(f"DEBUG: Saved scan {new_id} to DB.")
    return new_id


def get_recent_scans(limit=10):
    conn = sqlite3.connect(DB_NAME, uri=True)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM history ORDER BY id DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    print(f"DEBUG: Fetched {len(rows)} scans from DB.")
    return [dict(row) for row in rows]


def get_all_scans():
    conn = sqlite3.connect(DB_NAME, uri=True)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM history ORDER BY id DESC")
    rows = cursor.fetchall()

    conn.close()
    return [dict(row) for row in rows]


import json
def get_stats():
    conn = sqlite3.connect(DB_NAME, uri=True)
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM history")
    total_scans = cursor.fetchone()[0]

    cursor.execute("SELECT risk_level, COUNT(*) FROM history GROUP BY risk_level")
    distribution = {"high": 0, "medium": 0, "low": 0}
    for row in cursor.fetchall():
        if row[0] in distribution:
            distribution[row[0]] = row[1]

    cursor.execute("SELECT full_analysis FROM history WHERE full_analysis IS NOT NULL")
    analyses = cursor.fetchall()

    conn.close()

    # Calculate Top Threats
    threat_counts = {
        "Phishing Link": 0,
        "Suspicious Domain": 0,
        "IP Address URL": 0,
        "Shortened URL": 0,
        "Homograph Attack": 0
    }

    threat_hits = 0

    for (analysis_str,) in analyses:
        if not analysis_str: continue
        try:
            data = json.loads(analysis_str)
            risky_urls = data.get("risky_urls", [])
            for url_data in risky_urls:
                explanation = url_data.get("explanation", "").lower()
                threat_hits += 1
                if "ip address" in explanation:
                    threat_counts["IP Address URL"] += 1
                elif "shortened" in explanation:
                    threat_counts["Shortened URL"] += 1
                elif "homograph" in explanation:
                    threat_counts["Homograph Attack"] += 1
                elif "suspicious" in explanation or "entropy" in explanation:
                    threat_counts["Suspicious Domain"] += 1
                else:
                    threat_counts["Phishing Link"] += 1
        except:
            pass

    # Sort threats
    top_threats = [{"name": k, "count": v} for k, v in threat_counts.items() if v > 0]
    top_threats.sort(key=lambda x: x["count"], reverse=True)

    return {
        "total_scans": total_scans,
        "high_risk": distribution["high"],
        "medium_risk": distribution["medium"],
        "low_risk": distribution["low"],
        "users": 28,  # Mock consistent data
        "threat_hits": threat_hits,
        "top_threats": top_threats[:5]
    }


def delete_scan(log_id):
    conn = sqlite3.connect(DB_NAME, uri=True)
    cursor = conn.cursor()

    cursor.execute("DELETE FROM history WHERE id = ?", (log_id,))

    conn.commit()
    conn.close()


def update_scan(log_id, risk_level, risk_percent):
    conn = sqlite3.connect(DB_NAME, uri=True)
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE history 
        SET risk_level = ?, risk_percent = ?
        WHERE id = ?
    """, (risk_level, risk_percent, log_id))

    conn.commit()
    conn.close()


# ========================
# 🔥 CACHE FUNCTIONS
# ========================

def get_cached_url(url):
    conn = sqlite3.connect(DB_NAME, uri=True)
    cursor = conn.cursor()

    cursor.execute("SELECT vt_flag FROM url_cache WHERE url = ?", (url,))
    row = cursor.fetchone()

    conn.close()

    if row:
        return bool(row[0])
    return None


def save_url_cache(url, vt_flag):
    conn = sqlite3.connect(DB_NAME, uri=True)
    cursor = conn.cursor()

    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute("""
        INSERT OR REPLACE INTO url_cache (url, vt_flag, checked_at)
        VALUES (?, ?, ?)
    """, (url, int(vt_flag), current_time))

    conn.commit()
    conn.close()

def get_threat_intel():
    stats = get_stats()
    return stats["top_threats"]

def get_reports_list():
    return [
        {"id": 1, "name": "Global_Threat_Audit_Apr26.pdf", "date": "2026-04-26", "size": "1.2 MB", "type": "Forensic"},
        {"id": 2, "name": "System_Performance_Summary.csv", "date": "2026-04-25", "size": "450 KB", "type": "Intelligence"}
    ]

def get_scan_by_id(scan_id):
    conn = sqlite3.connect(DB_NAME, uri=True)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM history WHERE id = ?", (scan_id,))
    row = cursor.fetchone()

    conn.close()
    return dict(row) if row else None