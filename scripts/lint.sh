#!/usr/bin/env bash
set -e

echo "[+] Running Backend Formatting & Linting (Ruff)..."
cd backend
ruff format --check .
ruff check .
cd ..

echo "[+] Running Frontend Formatting & Type Checks..."
cd frontend
npx prettier --check "src/**/*.{ts,tsx,css}"
npm run lint
npx tsc --noEmit
cd ..

echo "All linting and formatting checks passed cleanly!"
