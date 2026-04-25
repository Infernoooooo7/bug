import sqlite3
from datetime import datetime

DB_NAME = "scan_history.db"


def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    # Scan history table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            sender TEXT,
            return_path TEXT,
            risk_level TEXT,
            risk_percent INTEGER
        )
    """)

    # 🔥 Cache table for VirusTotal
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS url_cache (
            url TEXT PRIMARY KEY,
            vt_flag INTEGER,
            checked_at TEXT
        )
    """)

    conn.commit()
    conn.close()


def save_scan(sender, return_path, risk_level, risk_percent):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute("""
        INSERT INTO history (timestamp, sender, return_path, risk_level, risk_percent)
        VALUES (?, ?, ?, ?, ?)
    """, (current_time, sender, return_path, risk_level, risk_percent))

    conn.commit()
    conn.close()


def get_recent_scans(limit=10):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM history ORDER BY id DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()

    conn.close()
    return rows


# ========================
# 🔥 CACHE FUNCTIONS
# ========================

def get_cached_url(url):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute("SELECT vt_flag FROM url_cache WHERE url = ?", (url,))
    row = cursor.fetchone()

    conn.close()

    if row:
        return bool(row[0])
    return None


def save_url_cache(url, vt_flag):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute("""
        INSERT OR REPLACE INTO url_cache (url, vt_flag, checked_at)
        VALUES (?, ?, ?)
    """, (url, int(vt_flag), current_time))

    conn.commit()
    conn.close()