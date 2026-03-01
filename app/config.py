"""
Sentinel Configuration
Loads all settings from environment variables with sensible defaults.
"""
import os

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
PORT = int(os.getenv("PORT", "8000"))
DB_PATH = os.getenv("DB_PATH", "/app/data/sentinel.db")
CRAWL_INTERVAL_HOURS = int(os.getenv("CRAWL_INTERVAL_HOURS", "6"))
CRAWL_LOOKBACK_DAYS = int(os.getenv("CRAWL_LOOKBACK_DAYS", "365"))
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
