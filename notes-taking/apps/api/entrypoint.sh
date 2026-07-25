#!/bin/sh
set -e

echo "Waiting for Postgres..."
until python - <<'PY'
import os, sys
import psycopg

try:
    conn = psycopg.connect(
        dbname=os.environ.get("POSTGRES_DB", "notes"),
        user=os.environ.get("POSTGRES_USER", "notes"),
        password=os.environ.get("POSTGRES_PASSWORD", "notes"),
        host=os.environ.get("POSTGRES_HOST", "db"),
        port=os.environ.get("POSTGRES_PORT", "5432"),
        connect_timeout=2,
    )
except Exception:
    sys.exit(1)
else:
    conn.close()
    sys.exit(0)
PY
do
  sleep 1
done

echo "Running migrations..."
python manage.py migrate --noinput

echo "Starting API..."
exec "$@"
