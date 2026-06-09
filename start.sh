#!/bin/bash
set -e

echo "[startup] Pulling latest code from GitHub..."
git pull origin main --rebase || echo "[startup] git pull failed or nothing to pull, continuing..."

echo "[startup] Installing dependencies..."
npm install --silent

echo "[startup] Starting dev server..."
npm run dev
