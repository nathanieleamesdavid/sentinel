#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)"
DATA="$DIR/.data"
LOG="$DATA/logfile"

# Load .env.local if present (needed for drizzle-kit and defaults)
if [ -f "$DIR/.env.local" ]; then
  set -a
  source "$DIR/.env.local"
  set +a
fi

DB_NAME="${POSTGRES_DB:-sentinel}"
DB_PORT="${POSTGRES_PORT:-6432}"
DB_USER="${POSTGRES_USER:-$(whoami)}"

case "${1:-help}" in
  init)
    if [ -d "$DATA" ]; then
      echo "Already initialized at $DATA"
      exit 0
    fi
    echo "Initializing PostgreSQL data directory..."
    initdb -D "$DATA" --no-locale --encoding=UTF8
    # Use a project-local unix socket and custom port
    cat >> "$DATA/postgresql.conf" <<EOF
port = $DB_PORT
unix_socket_directories = '$DATA'
EOF
    echo "Initialized. Run: pnpm db:start"
    ;;

  start)
    if [ ! -d "$DATA" ]; then
      echo "No data directory. Run: pnpm db:init"
      exit 1
    fi
    if pg_ctl -D "$DATA" status &>/dev/null; then
      echo "Already running."
      exit 0
    fi
    echo "Starting PostgreSQL..."
    pg_ctl -D "$DATA" -l "$LOG" start
    # Wait for ready
    for i in $(seq 1 10); do
      if pg_isready -h localhost -p "$DB_PORT" &>/dev/null; then break; fi
      sleep 0.3
    done
    # Create database if it doesn't exist
    if ! psql -h localhost -p "$DB_PORT" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
      createdb -h localhost -p "$DB_PORT" "$DB_NAME"
      echo "Created database: $DB_NAME"
    fi
    echo "PostgreSQL running on port $DB_PORT"
    ;;

  stop)
    if [ ! -d "$DATA" ]; then
      echo "No data directory."
      exit 0
    fi
    if ! pg_ctl -D "$DATA" status &>/dev/null; then
      echo "Not running."
      exit 0
    fi
    echo "Stopping PostgreSQL..."
    pg_ctl -D "$DATA" stop
    ;;

  destroy)
    if pg_ctl -D "$DATA" status &>/dev/null 2>&1; then
      echo "Stopping PostgreSQL..."
      pg_ctl -D "$DATA" stop
    fi
    if [ -d "$DATA" ]; then
      rm -rf "$DATA"
      echo "Destroyed data directory."
    else
      echo "Nothing to destroy."
    fi
    ;;

  status)
    if [ ! -d "$DATA" ]; then
      echo "Not initialized."
    elif pg_ctl -D "$DATA" status &>/dev/null; then
      echo "Running on port $DB_PORT"
    else
      echo "Stopped."
    fi
    ;;

  setup)
    # Full setup: init + start + push schema
    "$0" init
    "$0" start
    echo "Pushing schema..."
    cd "$DIR"
    pnpm drizzle-kit push
    echo "Done. Run: pnpm dev"
    ;;

  rebuild)
    # Nuke everything and start fresh
    "$0" destroy
    "$0" setup
    ;;

  *)
    echo "Usage: db.sh {init|start|stop|destroy|status|setup|rebuild}"
    echo ""
    echo "  init     Create .data/ PostgreSQL directory"
    echo "  start    Start PostgreSQL (creates db if needed)"
    echo "  stop     Stop PostgreSQL"
    echo "  destroy  Stop and delete .data/ entirely"
    echo "  status   Check if PostgreSQL is running"
    echo "  setup    init + start + push drizzle schema"
    echo "  rebuild  destroy + setup (nuke and rebuild from scratch)"
    ;;
esac
