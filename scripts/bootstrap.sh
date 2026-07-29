#!/usr/bin/env bash
set -e

echo "=========================================================================="
echo "  AI Incident Response Platform - Enterprise Local Environment Bootstrap  "
echo "=========================================================================="

# 1. Check & Copy Environment Files
if [ ! -f .env ]; then
    echo "[+] Copying root .env.example to .env..."
    cp .env.example .env
fi

if [ ! -f backend/.env ]; then
    echo "[+] Copying backend/.env.example to backend/.env..."
    cp backend/.env.example backend/.env
fi

if [ ! -f frontend/.env ]; then
    echo "[+] Copying frontend/.env.example to frontend/.env..."
    cp frontend/.env.example frontend/.env
fi

# 2. Build and launch Docker Compose services
echo "[+] Spinning up container infrastructure via Docker Compose..."
docker compose down --remove-orphans
docker compose build --no-cache
docker compose up -d

echo "[+] Waiting for PostgreSQL database to be healthy..."
docker compose exec db pg_isready -U postgres_user -d incident_platform_db || sleep 5

# 3. Apply initial migrations
echo "[+] Running backend database migrations..."
docker compose exec backend python manage.py migrate

echo "=========================================================================="
echo "  Bootstrap Completed Successfully!"
echo "  Frontend URL:  http://localhost:5173"
echo "  Backend API:   http://localhost:8000/api/v1/health/"
echo "  Swagger Docs:  http://localhost:8000/api/schema/swagger-ui/"
echo "=========================================================================="
