#!/usr/bin/env bash
# redeploy.sh — production redeploy helper for the FYP Supervision System.
#
# Runs ON THE DROPLET (the rented DigitalOcean server), not your laptop.
# Wraps the long `docker compose -f ... -f ... -f ...` command so you don't
# have to type all three overlay files every time.
#
# Usage (from ~/fyp-supervision-system on the Droplet):
#   ./redeploy.sh            pull latest code from GitHub, rebuild, restart   (code change)
#   ./redeploy.sh restart    restart with current code, no rebuild           (.env / secret change)
#   ./redeploy.sh status     show whether all 9 services are Up
#   ./redeploy.sh logs       tail caddy + backend logs (Ctrl+C to stop)
#
# Your data (MySQL, uploads, AI models) lives in Docker volumes and is NOT
# touched by any of these — rebuilds and restarts keep all existing data.

set -euo pipefail

# All three overlays, defined once.
COMPOSE="docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.observability.yml"

cmd="${1:-deploy}"

case "$cmd" in
  deploy|"")
    echo ">> Pulling latest code from GitHub..."
    git pull
    echo ">> Rebuilding and restarting (this can take a few minutes)..."
    $COMPOSE up -d --build
    echo ">> Done. Current status:"
    $COMPOSE ps
    ;;

  restart)
    # No --build: just re-create containers so .env / secret changes take effect.
    echo ">> Restarting with current code (picking up env/secret changes)..."
    $COMPOSE up -d
    echo ">> Done. Current status:"
    $COMPOSE ps
    ;;

  status)
    $COMPOSE ps
    ;;

  logs)
    echo ">> Tailing caddy + backend logs (Ctrl+C to stop)..."
    $COMPOSE logs -f --tail=50 caddy backend
    ;;

  *)
    echo "Unknown command: $cmd"
    echo "Usage: ./redeploy.sh [deploy|restart|status|logs]"
    exit 1
    ;;
esac
