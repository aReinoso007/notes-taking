# Notes App

Monorepo for the Turbo AI notes-taking challenge.

## Source of truth

See [`BUILD.md`](./BUILD.md) for locked decisions, data model, API contract,
design tokens, and build order.

## Stack

- **API** — Django + DRF + SimpleJWT (`apps/api`)
- **Web** — Next.js App Router + TypeScript (`apps/web`)
- **DB** — Postgres via Docker Compose

## Quick start

```bash
docker compose up --build
```

- Web: http://localhost:3000
- API health: http://localhost:8001/api/v1/health/ (Compose maps host **8001→8000** to avoid clashing with other local Django apps on 8000)

## Tests

```bash
# API
cd apps/api && pip install -r requirements.txt && pytest

# Web
cd apps/web && npm install && npm test
```

## Status

Step 0 scaffold in progress. Full process / AI usage notes land in Step 9.
