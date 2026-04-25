import sqlite3
from datetime import datetime

DB_NAME = "scan_history.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            sender TEXT,
            risk_level TEXT,
            risk_percent INTEGER
        )
    """)
    conn.commit()
    conn.close()

def log_scan(sender, risk_level, risk_percent):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO history (timestamp, sender, risk_level, risk_percent)
        VALUES (?, ?, ?, ?)
    """, (
        datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        sender,
        risk_level,
        risk_percent
    ))
    conn.commit()
    conn.close()

def get_recent_history(limit=10):
    conn = sqlite3.connect(DB_NAME)
    # This allows us to access columns by name
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM history ORDER BY id DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    
    # Convert rows to list of dictionaries
    history = [dict(row) for row in rows]
    
    conn.close()
    return history