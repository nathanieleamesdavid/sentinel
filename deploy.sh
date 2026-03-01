#!/bin/bash
# ═══════════════════════════════════════════════════
#  SENTINEL — One-Command Deployment Script
#  Run this on a fresh DigitalOcean Ubuntu droplet.
# ═══════════════════════════════════════════════════
set -e

echo ""
echo "════════════════════════════════════════════════"
echo "  SENTINEL - Medeed Intelligence — Deploying"
echo "════════════════════════════════════════════════"
echo ""

# ── 1. Install Docker if not present ──────────────
if ! command -v docker &> /dev/null; then
    echo "  Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    sudo systemctl enable docker
    sudo systemctl start docker
    echo "  Docker installed."
else
    echo "  Docker already installed."
fi

# ── 2. Install Docker Compose if not present ──────
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "  Installing Docker Compose..."
    sudo apt-get update -qq
    sudo apt-get install -y -qq docker-compose-plugin
    echo "  Docker Compose installed."
else
    echo "  Docker Compose already available."
fi

# ── 3. Create .env if it doesn't exist ────────────
if [ ! -f .env ]; then
    cp .env.example .env
    echo ""
    echo "  ⚠️  IMPORTANT: Edit .env with your Anthropic API key:"
    echo "     nano .env"
    echo ""
    echo "  Then re-run this script or run:"
    echo "     docker compose up -d"
    echo ""
    exit 1
fi

# ── 4. Create data directory ──────────────────────
mkdir -p data certbot/conf certbot/www

# ── 5. Build and start ────────────────────────────
echo "  Building and starting containers..."
docker compose up -d --build

echo ""
echo "════════════════════════════════════════════════"
echo "  SENTINEL is running!"
echo ""
echo "  Dashboard:  http://$(hostname -I | awk '{print $1}')"
echo "  Logs:       docker compose logs -f web"
echo "  Stop:       docker compose down"
echo "  Restart:    docker compose restart"
echo "════════════════════════════════════════════════"
echo ""
echo "  For HTTPS, run:"
echo "    docker compose run --rm certbot certonly \\"
echo "      --webroot -w /var/www/certbot \\"
echo "      -d your-domain.com"
echo "  Then uncomment the HTTPS block in nginx.conf"
echo "  and run: docker compose restart nginx"
echo ""
