# Notes App

A notes-taking app built for the Turbo AI hiring challenge: cream paper UI,
category-tinted cards, markdown notes, and a small Django + Next.js monorepo
that a reviewer can boot with one Compose command.

**Source of truth for locked product decisions:** [`BUILD.md`](./BUILD.md).

---

## Stack

| Layer | Choice |
|---|---|
| API | Django + DRF + SimpleJWT (`apps/api`) |
| Web | Next.js App Router + TypeScript (`apps/web`) |
| DB | Postgres 16 via Docker Compose |
| Auth transport | httpOnly cookies; Next.js Route Handlers as a BFF (browser never talks to Django directly) |
| Editor | Live markdown body (stored as raw markdown) |

---

## Quick start (reviewers)

From `notes-taking/`, one command boots **db + api + web** (Docker Desktop must be running):

```bash
make up
# same as: ./scripts/dev.sh
```

| Command | What it does |
|---|---|
| `make up` | Build and run everything in the foreground (Ctrl+C to stop) |
| `make up-d` | Same, detached |
| `make down` | Stop containers |
| `make seed` | Load demo user + sample notes |
| `make reset` | Wipe stale web `node_modules` volume and restart (use if the browser shows missing modules) |
| `make logs` | Tail Compose logs |

The web container re-runs `npm install` on every start, so new deps like `react-markdown` are picked up automatically.

| Service | URL |
|---|---|
| Web | http://localhost:3000 |
| API health | http://localhost:8001/api/v1/health/ |

Compose maps API **8001→8000** so it won’t clash with another local Django on 8000.

If something is already bound to port **3000** or **8001** (an old local `npm run dev` / `runserver`), stop it first or run `make down` and free those ports.

### Demo account

With the stack running:

```bash
make seed
# equivalent: docker compose exec api python manage.py seed_demo
```

Then sign in at http://localhost:3000/login with:

- **Email:** `demo@notes.local`
- **Password:** `demo-pass-1234`

Re-running `seed_demo` resets that user’s categories and notes to a known
demo set (idempotent).

---

## Local development (optional)

Postgres still via Compose; API and web on the host:

```bash
docker compose up db -d

# API
cd apps/api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp ../../.env.example ../../.env   # adjust if needed
export DJANGO_SETTINGS_MODULE=config.settings.dev
export POSTGRES_HOST=localhost POSTGRES_DB=notes POSTGRES_USER=notes POSTGRES_PASSWORD=notes
python manage.py migrate
python manage.py seed_demo
python manage.py runserver 0.0.0.0:8000

# Web (separate terminal) — point BFF at the API
cd apps/web
npm install
API_URL=http://localhost:8000 npm run dev
```

If the API is only exposed via Compose on **8001**, set `API_URL=http://localhost:8001` for the web process instead.

---

## Tests

```bash
# API — 46+ tests (pytest)
cd apps/api && pip install -r requirements.txt && pytest

# Web — Vitest
cd apps/web && npm install && npm test
```

CI runs both suites on every push/PR (`.github/workflows/ci.yml`).

---

## What the app does

1. **Signup / login** — email + password; signup seeds three random named
   categories from a fixed palette.
2. **Notes grid** — three-column cards tinted by category colour; sidebar
   filters by category; empty state with the boba illustration.
3. **New note** — `/notes/new` creates **nothing** until the first keystroke,
   then `POST`s and `replace`s to `/notes/{id}`.
4. **Editor** — inline title + live markdown body (type `*` or `-` then space
   for a bullet), ~500ms debounced autosave, optimistic “Last Edited”,
   category picker (including inline create), delete with confirmation.

---

## Key decisions (and why)

These are the locked choices from `BUILD.md`, with the reasoning we kept:

| Decision | Why |
|---|---|
| **Postgres in Compose (required)** | Reviewers must see a running app; SQLite would hide deploy reality. |
| **SimpleJWT → httpOnly cookies via Next BFF** | Tokens never sit in `localStorage`; same-origin cookies keep the browser off Django CORS. |
| **Markdown textarea + preview (not TipTap)** | Matches the challenge’s “raw markdown content” model and stays small/testable. |
| **Create on first keystroke** | Abandoning `/notes/new` leaves no empty DB rows; filter category is inherited from `?category=`. |
| **Colour lives on `Category` only** | Cards/sheets tint from the note’s category (or `--cat-none`); API returns hex; frontend never remaps names → colours. |
| **Category delete → `SET_NULL`** | Notes survive; they become uncategorised. |
| **Plain folders, no pnpm workspaces** | One JS package (`apps/web`); less tooling noise for a challenge repo. |
| **Split Django settings** (`base` / `dev` / `prod` / `test`) | Tests stay fast and isolated; Compose stays predictable. |

---

## Process

Built in the order from `BUILD.md` §9 — tests shipped with every step:

0. Monorepo, Compose, CI, split settings  
1. Custom `User` (email as username)  
2. `Category` + `Note` models, user-scoped managers, `preview_text`  
3. Auth API + signup category seeding  
4. Categories/Notes CRUD, pagination, cross-user 404s  
5. Next BFF proxy, cookies, typed client, TanStack Query  
6. Auth screens to design fidelity  
7. Notes grid, sidebar, empty states  
8. Note editor (autosave, markdown, category, delete)  
9. This README, `seed_demo`, demo video  

Design assets live one level up in [`../design/`](../design/). Token values
are mirrored in Python (`CATEGORY_PALETTE`) and CSS (`styles/tokens.css`).

---

## AI usage

Cursor agents were used throughout as a pair-programmer, not as an unsupervised
code generator:

- **`BUILD.md` stayed authoritative.** When chat context rolled over, new
  sessions were pointed at that file so locked decisions weren’t reopened.
- **Step-sized prompts.** Work followed the numbered build order; each step
  landed with tests before the next started.
- **Design fidelity.** Figma SVG exports and screenshots under `design/` were
  used for layout/copy; outlined SVG text was *not* used to invent typography.
- **Human review.** Auth cookie flow, user-scoped querysets, create-on-keystroke,
  and empty-state polish were verified manually in the browser.
- **What AI did well:** scaffolding DRF/Next wiring, test stubs, CSS modules
  matching tokens, and the editor debounce helpers.
- **What stayed human-owned:** product locks in `BUILD.md`, commit cadence,
  and the demo video recording.

---

## Demo video

Record a short walkthrough (≈2–3 minutes) and place it at
[`docs/demo.mp4`](./docs/demo.mp4) (or link it from this section if hosted
elsewhere). Suggested script:

1. `docker compose up --build` → open the web app  
2. `seed_demo` → log in as the demo user  
3. Browse the grid / filter a category / show empty-ish moments if useful  
4. Open a note → edit title/body → show autosave + markdown preview  
5. Change category / create a category → delete a note with confirm  
6. New Note → type once → URL becomes `/notes/{id}`  

If `docs/demo.mp4` is missing from the clone, ask the author for the recording
link; the seed script alone is enough to reproduce the same UI state.

---

## Project layout

```
notes-taking/
├── apps/
│   ├── api/                 # Django
│   │   ├── config/settings/ # base, dev, prod, test
│   │   ├── users/
│   │   ├── categories/
│   │   ├── notes/           # includes management/commands/seed_demo.py
│   │   └── tests/
│   └── web/                 # Next.js
│       ├── app/             # (auth), (app)/notes, api/ BFF
│       ├── components/
│       ├── lib/
│       └── styles/tokens.css
├── .github/workflows/ci.yml
├── docker-compose.yml
├── BUILD.md
├── docs/                    # demo video lives here
└── README.md
```
