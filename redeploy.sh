#!/usr/bin/env bash
# redeploy.sh — production redeploy helper for the FYP Supervision System.
#
# Runs ON THE DROPLET (the rented DigitalOcean server), not your laptop.
# Wraps the long `docker compose -f ... -f ... -f ...` command so you don't
# have to type all three overlay files every time.
#
# Usage (from ~/fyp-supervision-system on the Droplet):
#   ./redeploy.sh            pull, rebuild ONLY the services whose source changed, restart  (code change)
#   ./redeploy.sh all        pull, rebuild ALL services, restart                            (dep/base-image bump)
#   ./redeploy.sh restart    restart with current code, no rebuild                          (.env / secret change)
#   ./redeploy.sh status     show whether all 9 services are Up
#   ./redeploy.sh logs       tail caddy + backend logs (Ctrl+C to stop)
#
# Why "only changed services": a full `--build` rebuilds all five app images
# (including the heavy backend Maven build) at once. On this 4 GB droplet that
# memory spike has OOM-killed a running container mid-deploy. Building just the
# services whose source actually changed in the pull is faster and safer. Use
# `all` when you really need everything rebuilt (e.g. a base-image or shared
# dependency bump that the per-service diff can't see).
#
# Your data (MySQL, uploads, AI models) lives in Docker volumes and is NOT
# touched by any of these — rebuilds and restarts keep all existing data.

set -euo pipefail

# All three overlays, defined once.
COMPOSE="docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.observability.yml"

# Map a newline-separated changed-file list ($1) to the app services that need
# a rebuild. Each service owns one top-level directory. Written with explicit
# `if` blocks so a non-matching grep doesn't trip `set -e`.
changed_services() {
  local files="$1" svc=""
  if printf '%s\n' "$files" | grep -q '^frontend/';             then svc="$svc frontend"; fi
  if printf '%s\n' "$files" | grep -q '^backend/';              then svc="$svc backend"; fi
  if printf '%s\n' "$files" | grep -q '^ai-recommendation/';    then svc="$svc ai-recommendation"; fi
  if printf '%s\n' "$files" | grep -q '^ai-proposal-analyzer/'; then svc="$svc ai-proposal-analyzer"; fi
  if printf '%s\n' "$files" | grep -q '^ai-chatbot/';           then svc="$svc ai-chatbot"; fi
  # trim leading space
  echo "${svc# }"
}

cmd="${1:-deploy}"

case "$cmd" in
  deploy|"")
    echo ">> Pulling latest code from GitHub..."
    before="$(git rev-parse HEAD)"
    git pull
    after="$(git rev-parse HEAD)"

    if [ "$before" = "$after" ]; then
      echo ">> No new commits. Ensuring everything is running..."
      $COMPOSE up -d
      echo ">> Done. Current status:"
      $COMPOSE ps
      exit 0
    fi

    changed="$(git diff --name-only "$before" "$after")"
    services="$(changed_services "$changed")"

    if [ -n "$services" ]; then
      echo ">> Source changed in:$(printf ' %s' $services)"
      echo ">> Rebuilding only those image(s) (this can take a few minutes)..."
      # shellcheck disable=SC2086  # intentional word-splitting: pass each service as a separate arg
      $COMPOSE build $services
      echo ">> Recreating containers (unchanged services keep their existing image)..."
      $COMPOSE up -d
    else
      echo ">> No app source changed (config/docs only). Recreating to apply any compose changes..."
      $COMPOSE up -d
    fi

    echo ">> Done. Current status:"
    $COMPOSE ps
    ;;

  all|rebuild)
    echo ">> Pulling latest code from GitHub..."
    git pull
    echo ">> Rebuilding ALL services and restarting (this can take several minutes)..."
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
    echo "Usage: ./redeploy.sh [deploy|all|restart|status|logs]"
    exit 1
    ;;
esac
