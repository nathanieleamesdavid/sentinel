"""
Sentinel Database Layer
SQLite connection management, schema initialization, and data operations.
"""
import sqlite3
import hashlib
import json
import logging
import os
from app.config import DB_PATH

log = logging.getLogger("sentinel.db")


def get_db():
    """Get a new SQLite connection with row factory enabled."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=30)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create tables if they don't exist and run migrations."""
    conn = get_db()
    conn.executescript("""
    CREATE TABLE IF NOT EXISTS insights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        synthesis TEXT,
        path INTEGER,
        urgency TEXT DEFAULT 'medium',
        domain TEXT,
        source TEXT,
        source_type TEXT,
        source_url TEXT,
        company TEXT,
        stage TEXT,
        published_date TEXT,
        ingested_at TEXT DEFAULT (datetime('now')),
        relevance_score REAL DEFAULT 0,
        is_read INTEGER DEFAULT 0,
        tags TEXT DEFAULT '[]',
        raw_text TEXT,
        url_hash TEXT UNIQUE,
        country TEXT
    );
    CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        insight_id INTEGER,
        author TEXT DEFAULT 'Team',
        text TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (insight_id) REFERENCES insights(id)
    );
    CREATE TABLE IF NOT EXISTS crawl_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_at TEXT DEFAULT (datetime('now')),
        source TEXT,
        found INTEGER DEFAULT 0,
        new_items INTEGER DEFAULT 0
    );
    """)
    conn.commit()
    # Migration for existing DBs that lack the country column
    try:
        conn.execute("ALTER TABLE insights ADD COLUMN country TEXT")
        conn.commit()
    except Exception:
        pass
    conn.close()
    log.info("Database ready at %s", DB_PATH)


def url_hash(url: str) -> str:
    """Generate a hash for deduplication."""
    return hashlib.md5(url.encode()).hexdigest()


def insert_insight(data: dict) -> bool:
    """Insert a new insight, returning True if inserted (False if duplicate)."""
    conn = get_db()
    h = url_hash(data.get("source_url", data.get("title", "")))
    try:
        conn.execute("""
            INSERT INTO insights (title, synthesis, path, urgency, domain, source,
                source_type, source_url, company, stage, published_date,
                relevance_score, tags, raw_text, url_hash, country)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (
            data.get("title", "")[:500],
            data.get("synthesis"),
            data.get("path"),
            data.get("urgency", "medium"),
            data.get("domain"),
            data.get("source", ""),
            data.get("source_type", ""),
            data.get("source_url", ""),
            data.get("company"),
            data.get("stage"),
            data.get("published_date"),
            data.get("relevance_score", 0),
            json.dumps(data.get("tags", [])),
            data.get("raw_text", "")[:3000],
            h,
            data.get("country"),
        ))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()
