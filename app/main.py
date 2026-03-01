"""
Sentinel - Medeed Biotech Intelligence Dashboard
FastAPI application entry point.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from apscheduler.schedulers.background import BackgroundScheduler

from app.config import CRAWL_INTERVAL_HOURS, LOG_LEVEL
from app.database import init_db, get_db
from app.crawlers import run_crawl
from app.api_routes import router as api_router

# ── Logging ──────────────────────────────────────────
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s - %(name)s - %(message)s",
)
log = logging.getLogger("sentinel")

# ── Scheduler ────────────────────────────────────────
scheduler = BackgroundScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    # Startup
    log.info("=" * 50)
    log.info("  SENTINEL - Medeed Intelligence (Server)")
    log.info("=" * 50)

    init_db()

    # Determine if this is the first run (empty DB)
    conn = get_db()
    count = conn.execute("SELECT COUNT(*) FROM insights").fetchone()[0]
    conn.close()
    first_run = count == 0

    # Run initial crawl in background
    scheduler.add_job(run_crawl, args=[first_run], id="initial_crawl")

    # Schedule recurring crawls
    scheduler.add_job(
        run_crawl,
        "interval",
        hours=CRAWL_INTERVAL_HOURS,
        args=[False],
        id="recurring_crawl",
    )
    scheduler.start()
    log.info("Scheduler started (interval=%dh)", CRAWL_INTERVAL_HOURS)

    yield

    # Shutdown
    scheduler.shutdown(wait=False)
    log.info("Sentinel shut down.")


# ── FastAPI App ──────────────────────────────────────
app = FastAPI(
    title="Sentinel",
    description="Medeed Biotech Intelligence Dashboard",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS — allow all origins (no auth for now; tighten later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(api_router)

# Serve static files (frontend) — nginx handles this in production,
# but this fallback lets you run `uvicorn app.main:app` for local dev.
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def serve_frontend():
    """Serve the main dashboard page."""
    return FileResponse("static/index.html")


@app.get("/vitruvian.jpg")
def serve_vitruvian():
    """Serve the Vitruvian Man image for the body map."""
    return FileResponse("static/vitruvian.jpg", media_type="image/jpeg")
