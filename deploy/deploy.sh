#!/usr/bin/env bash
# Run this on the VPS (from /opt/mehfuz) to deploy the latest pushed code.
# Safe to re-run any time — migrations and seeding are both idempotent.

set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "Missing .env — copy .env.production.example to .env and fill it in first."
  exit 1
fi

echo "==> Pulling latest code"
git pull

echo "==> Building image"
docker compose build

echo "==> Starting/restarting the app"
docker compose up -d

echo "==> Recent logs (Ctrl+C to stop watching — the app keeps running)"
docker compose logs -f --tail=50 app
