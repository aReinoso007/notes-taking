#!/usr/bin/env bash
# Start the full notes stack with one command.
# Prefers Docker Compose; falls back to local API + web if Compose is unavailable
# but Postgres is already reachable on localhost:5432.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

free_port() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    local pids
    pids="$(lsof -ti "tcp:${port}" 2>/dev/null || true)"
    if [[ -n "${pids}" ]]; then
      echo "Freeing port ${port}..."
      # shellcheck disable=SC2086
      kill -9 ${pids} 2>/dev/null || true
    fi
  fi
}

compose_up() {
  echo "Starting db + api + web via Docker Compose..."
  free_port 3000
  free_port 8001
  docker compose up --build
}

local_up() {
  echo "Docker Compose unavailable — starting API + web on the host."
  echo "Expecting Postgres at localhost:5432 (notes/notes/notes)."

  free_port 3000
  free_port 8000

  if [[ ! -d apps/api/.venv ]]; then
    python3 -m venv apps/api/.venv
    # shellcheck disable=SC1091
    source apps/api/.venv/bin/activate
    pip install -r apps/api/requirements.txt
  else
    # shellcheck disable=SC1091
    source apps/api/.venv/bin/activate
  fi

  (
    cd apps/web
    npm install
  )

  export DJANGO_SETTINGS_MODULE="${DJANGO_SETTINGS_MODULE:-config.settings.dev}"
  export POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
  export POSTGRES_DB="${POSTGRES_DB:-notes}"
  export POSTGRES_USER="${POSTGRES_USER:-notes}"
  export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-notes}"
  export POSTGRES_PORT="${POSTGRES_PORT:-5432}"
  export API_URL="${API_URL:-http://localhost:8000}"

  (
    cd apps/api
    python manage.py migrate --noinput
    python manage.py runserver 0.0.0.0:8000
  ) &
  API_PID=$!

  cleanup() {
    kill "${API_PID}" 2>/dev/null || true
  }
  trap cleanup EXIT INT TERM

  cd apps/web
  npm run dev -- --port 3000
}

if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  compose_up
else
  echo "Docker daemon is not running."
  echo "  → Open Docker Desktop, then re-run:  make up"
  echo "  → Or start Postgres yourself and re-run with:  ./scripts/dev.sh --local"
  if [[ "${1:-}" == "--local" ]]; then
    local_up
  else
    exit 1
  fi
fi
