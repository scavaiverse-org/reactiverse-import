#!/bin/bash
set -e

echo "[startup] Pulling latest code from GitHub..."
git pull origin main --rebase || echo "[startup] git pull skipped (sandbox restriction), continuing..."

# Only reinstall if package.json changed since last install
if [ package.json -nt node_modules/.package-lock.json ] 2>/dev/null || [ ! -d node_modules ]; then
  echo "[startup] package.json changed — running npm install..."
  npm install --silent
else
  echo "[startup] Dependencies up to date, skipping npm install."
fi

echo "[startup] Starting dev server..."
npm run dev
