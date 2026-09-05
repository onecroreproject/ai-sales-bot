#!/bin/sh
set -e

echo "Running database schema migrations with Alembic..."
alembic upgrade head

echo "Starting Uvicorn production server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
