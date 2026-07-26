# One-command local stack for the notes app.
# Usage: make up | make down | make seed | make reset

.PHONY: up up-d down seed logs reset ps

# Foreground — Ctrl+C stops everything (requires Docker Desktop running)
up:
	./scripts/dev.sh

# Detached Compose
up-d:
	docker compose up --build -d

# Stops containers only — Postgres data is kept (never use `down -v` unless you
# intend to wipe the database).
down:
	docker compose down

ps:
	docker compose ps

logs:
	docker compose logs -f

seed:
	docker compose exec api python manage.py seed_demo

# Wipe stale web node_modules volume (fixes "Can't resolve 'react-markdown'" etc.)
# then bring the full stack back up in the foreground.
# Does NOT touch the Postgres volume.
reset:
	docker compose down
	-docker volume rm notes-taking_web_node_modules
	./scripts/dev.sh
