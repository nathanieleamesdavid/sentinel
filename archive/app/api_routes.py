"""
Sentinel API Routes
FastAPI router with all REST endpoints for the dashboard.
"""
import json
import threading
import logging
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Body
from pydantic import BaseModel

from app.database import get_db
from app.crawlers import run_crawl

log = logging.getLogger("sentinel.api")

router = APIRouter(prefix="/api")


# ── Request/Response Models ──────────────────────────

class CommentCreate(BaseModel):
    author: str = "Team"
    text: str = ""


# ── Endpoints ────────────────────────────────────────

@router.get("/insights")
def get_insights(
    days_back: int = 90,
    limit: int = 100,
    domain: Optional[str] = None,
    path: Optional[int] = None,
):
    """Fetch filtered insights, ordered by most recent."""
    cutoff = (datetime.utcnow() - timedelta(days=days_back)).isoformat()
    conn = get_db()
    q = "SELECT * FROM insights WHERE ingested_at >= ? AND synthesis IS NOT NULL"
    args: list = [cutoff]
    if domain:
        q += " AND domain = ?"
        args.append(domain)
    if path is not None:
        q += " AND path = ?"
        args.append(path)
    q += " ORDER BY ingested_at DESC LIMIT ?"
    args.append(limit)
    rows = conn.execute(q, args).fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        d["tags"] = json.loads(d.get("tags") or "[]")
        result.append(d)
    return result


@router.get("/domains")
def get_domains():
    """Return all therapeutic domains with insight counts."""
    domains = [
        {"id": 1, "name": "cancer", "label": "Cancer"},
        {"id": 2, "name": "immune", "label": "Immune"},
        {"id": 3, "name": "epigenetic", "label": "Epigenetic"},
        {"id": 4, "name": "cognitive", "label": "Cognitive Decline"},
        {"id": 5, "name": "metabolic", "label": "Metabolic"},
        {"id": 6, "name": "musculo", "label": "Musculoskeletal"},
        {"id": 7, "name": "vascular", "label": "Vascular"},
        {"id": 8, "name": "sensory", "label": "Sensory"},
        {"id": 9, "name": "sleep", "label": "Sleep"},
    ]
    conn = get_db()
    for d in domains:
        row = conn.execute(
            "SELECT COUNT(*) as c FROM insights WHERE domain=?", [d["name"]]
        ).fetchone()
        d["count"] = row["c"] if row else 0
    conn.close()
    return domains


@router.get("/stats")
def get_stats():
    """Return high-level dashboard statistics."""
    conn = get_db()
    total = conn.execute("SELECT COUNT(*) FROM insights").fetchone()[0]
    path1 = conn.execute("SELECT COUNT(*) FROM insights WHERE path=1").fetchone()[0]
    path2 = conn.execute("SELECT COUNT(*) FROM insights WHERE path=2").fetchone()[0]
    unread = conn.execute("SELECT COUNT(*) FROM insights WHERE is_read=0").fetchone()[0]
    conn.close()
    return {"total": total, "path1": path1, "path2": path2, "unread": unread}


@router.patch("/insights/{insight_id}/read")
def mark_read(insight_id: int):
    """Mark an insight as read."""
    conn = get_db()
    conn.execute("UPDATE insights SET is_read=1 WHERE id=?", [insight_id])
    conn.commit()
    conn.close()
    return {"ok": True}


@router.get("/insights/{insight_id}/comments")
def get_comments(insight_id: int):
    """Get all comments for an insight."""
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM comments WHERE insight_id=? ORDER BY created_at", [insight_id]
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@router.post("/insights/{insight_id}/comments")
def add_comment(insight_id: int, body: CommentCreate):
    """Add a team comment to an insight."""
    conn = get_db()
    conn.execute(
        "INSERT INTO comments (insight_id, author, text) VALUES (?,?,?)",
        [insight_id, body.author, body.text],
    )
    conn.commit()
    rows = conn.execute(
        "SELECT * FROM comments WHERE insight_id=? ORDER BY created_at", [insight_id]
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@router.post("/crawl/trigger")
def trigger_crawl():
    """Manually trigger a crawl cycle."""
    t = threading.Thread(target=run_crawl, args=(False,), daemon=True)
    t.start()
    return {"status": "crawl started"}
