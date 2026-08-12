#!/bin/bash
# Run on the server (by GitHub Actions, or manually) to deploy the latest
# pushed code. `set -e` means the script stops immediately on the first
# failing command, instead of plowing ahead with a half-applied deploy.
set -e

cd ~/savannah_sms

echo "==> Pulling latest code"
git pull

echo "==> Building frontend"
docker run --rm -v "$(pwd)/frontend:/app" -w /app node:22-alpine sh -c "npm ci && npm run build"

echo "==> Rebuilding and restarting backend"
docker compose up -d --build

echo "==> Deploy complete"
