import sqlite3
from datetime import datetime

DB_NAME = "scan_history.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS scans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            sender TEXT,
            return_path TEXT,
            risk_level TEXT,
            risk_percent INTEGER
        )
    """)

    conn.commit()
    conn.close()

def save_scan(sender, return_path, risk_level, risk_percent):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO scans (timestamp, sender, return_path, risk_level, risk_percent)
        VALUES (?, ?, ?, ?, ?)
    """, (
        datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        sender,
        return_path,
        risk_level,
        risk_percent
    ))

    conn.commit()
    conn.close()

def get_recent_scans(limit=10):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM scans ORDER BY id DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()

    return rows