# Notes App — build brief (authoritative)

This is the **source of truth** for the turbo-notes monorepo in this folder.
Where this document and any earlier plan disagree, **this document wins**.
Do not reopen locked decisions during scaffolding.

---

## 1. Locked decisions

| Area | Decision |
|---|---|
| Backend | Django + DRF |
| Frontend | Next.js App Router + TypeScript |
| Database | **Postgres via Docker.** |
| Auth | **SimpleJWT, tokens in httpOnly cookies, Next.js Route Handlers as a thin BFF proxy.** |
| Editor | **Markdown in a textarea + rendered preview.** Content is raw markdown text. |
| Note ↔ Category | One category per note, nullable |
| Note creation | **Create on first keystroke**, not on button click |
| Delete | **Notes and categories both deletable.** |
| Category delete | Sets `note.category = NULL`. Never cascades to notes. |
| Grid | Uniform CSS grid with clamped previews, not masonry |
| Monorepo tooling | Plain folders. No pnpm workspaces — there is only one JS package. |
| Docker Compose | **Required.** A reviewer who cannot run the project scores what they cannot see at zero. |
| CI | GitHub Actions running both test suites on push. |

---

## 2. Design tokens

### Category palette — exactly four colours

```
#EF9C66  apricot
#FCDC94  butter
#C8CFA0  sage
#78ABA8  teal
```

These are **category colours**, not a brand accent palette. Colour is a property
of `Category`; a `Note` has no colour of its own and renders its category's.

### Surface, ink, heading

```
#FAF1E3  paper   — app background, dropdown panel, auth screens
#957139  ink     — every border, icon, rule, placeholder, button label, link
#88642A  heading — headings only, nothing else
```

There is exactly one line colour in this design. No greys anywhere.

### Ignore `#9747FF`

It appears as a dashed 1px frame in several SVG exports. That is Figma's
slice-annotation colour, **not a design token**. It must not reach the codebase.

### Geometry

```
--r-input:  6px    (svg rx 5.5)   text fields, dropdown trigger
--r-panel:  8px                    dropdown panel
--r-card:  10px    (svg rx 9.5)   note card
--r-pill:  999px   (svg rx 21)    buttons

--border-card: 3px  in the category colour
--border-hair: 1px  in --ink

--shadow-card: 1px 1px 2px rgb(0 0 0 / 0.25)
```

### Note card construction

The card is **not** a flat fill. It is a 50% tint of the category colour with a
**3px solid border of the same colour at full opacity**, over the cream background.

```css
.note-card {
  --c: <category colour>;
  background: color-mix(in srgb, var(--c) 50%, transparent);
  border: 3px solid var(--c);
  border-radius: 10px;
  box-shadow: 1px 1px 2px rgb(0 0 0 / 0.25);
}
```

### Uncategorised notes

```css
--cat-none: color-mix(in srgb, var(--ink) 22%, var(--paper));
```

---

## 3. Data model

```python
# apps/api/users/models.py
class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []
```

**Create the custom user model before the first migration.**

```python
# apps/api/categories/models.py
CATEGORY_PALETTE = ("#EF9C66", "#FCDC94", "#C8CFA0", "#78ABA8")
SEED_CATEGORY_NAMES = ("Random Thoughts", "School", "Personal", "Drama")

class Category(models.Model):
    user       = FK(User, on_delete=CASCADE, related_name="categories")
    name       = CharField(max_length=60)
    color      = CharField(max_length=7)   # hex from CATEGORY_PALETTE
    created_at = DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [UniqueConstraint(fields=["user", "name"],
                                        name="uniq_category_name_per_user")]
        ordering = ["created_at"]
```

```python
# apps/api/notes/models.py
class Note(models.Model):
    user         = FK(User, on_delete=CASCADE, related_name="notes")
    category     = FK(Category, on_delete=SET_NULL, null=True, blank=True,
                      related_name="notes")
    title        = CharField(max_length=255, blank=True)
    content      = TextField(blank=True)        # raw markdown
    preview_text = TextField(blank=True)        # markdown-stripped, ~400 chars
    created_at   = DateTimeField(auto_now_add=True)
    updated_at   = DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        indexes  = [Index(fields=["user", "-updated_at"])]
```

**`preview_text` is required.** Computed in `save()`, capped at ~400 chars.

**`on_delete=SET_NULL` on category is deliberate.**

### Colour assignment

Signup seeds **3 categories**: `random.sample(SEED_CATEGORY_NAMES, 3)` paired
with 3 distinct colours from `CATEGORY_PALETTE`. Later categories assign
**least-used colour first**. Seeding must be atomic with user creation.

---

## 4. API contract

Django serves under `/api/v1/`. Next.js Route Handlers proxy `/api/*` and own
the cookies. The browser never talks to Django directly.

### Auth — Next Route Handlers set/clear cookies

```
POST   /api/auth/signup    { email, password }  → 201 { user }
POST   /api/auth/login     { email, password }  → 200 { user }
POST   /api/auth/logout                          → 204
GET    /api/auth/me                              → 200 { user } | 401
```

Access token ~15 min, rotating refresh with blacklist. Proxy silent
refresh-and-retry on 401. Cookies: `httpOnly`, `SameSite=Lax`, `Secure` in prod.

### Categories

```
GET    /api/categories        → [{ id, name, color, note_count }]
POST   /api/categories        { name }        → 201  (colour auto-assigned)
PATCH  /api/categories/:id    { name }        → 200
DELETE /api/categories/:id                    → 204  (notes survive, FK nulled)
```

`note_count` from a single annotated query. **Never N+1.**

### Notes

```
GET    /api/notes?category=:id&cursor=  → { results: [...], next }
POST   /api/notes    { title?, content?, category? }  → 201
GET    /api/notes/:id                                 → 200
PATCH  /api/notes/:id { title?, content?, category? } → 200
DELETE /api/notes/:id                                 → 204
```

Cursor pagination on `-updated_at`. List returns `preview_text`, not full `content`.

### Security baseline

Every queryset filtered by `request.user` at the manager or base-viewset level:
`Note.objects.for_user(request.user)`. Test that user A gets 404 on user B's note.

---

## 5. Behaviour the designs imply

**Note creation.** "New Note" → `/notes/new` with **no DB record**. First
keystroke → `POST /api/notes`, then `router.replace('/notes/{id}')`. Abandoning
before typing leaves nothing. Active category filter is inherited; "All
Categories" → null.

**Autosave.** ~500ms debounce, optimistic local state. "Last edited" updates
immediately on keystroke.

**Two timestamp formats.**

- Cards: relative — `today`, `yesterday`, else `July 16` (month + day, no year)
- Note page: full — `Last Edited: July 21, 2024 at 8:39pm`

**Category filtering is explicit.** Sidebar shows "All Categories" + each
category with note count.

**Password field has a reveal toggle** on both auth screens.

---

## 6. Auth screens

Single column, 383px wide, vertically centred.

```
illustration (95×114)
  ↕ 45
heading            #88642A, ~40px display face
  ↕ 35
email field        383×38, rx 6, 1px #957139
  ↕ 13
password field     383×38, same, + reveal toggle
  ↕ 43
CTA                383×42, rx 21 pill, 1px #957139, no fill
  ↕ 16
footer link        underlined, centred
```

| | Login | Signup |
|---|---|---|
| Heading | Yay, You're Back! | Yay, New Friend! |
| CTA | Login | Sign Up |
| Footer link | Oops! I've never been here before | We're already friends! |

One `<AuthLayout>`, one pill button component (width from context). Signup is
email + password only.

---

## 7. Gaps in the designs — decide, don't improvise

Error states: inline message below the offending field in `#88642A`, field
border switches to the same. No semantic red.

Also needed (undrawn): CTA pending state; empty state for a category with zero
notes; delete confirmation.

---

## 8. Repo structure

```
notes-taking/                   # monorepo root (this folder)
├── apps/
│   ├── api/                    # Django
│   │   ├── config/settings/    # base.py, dev.py, prod.py, test.py
│   │   ├── users/
│   │   ├── categories/
│   │   ├── notes/
│   │   └── tests/
│   └── web/                    # Next.js
│       ├── app/
│       │   ├── (auth)/login/ · signup/
│       │   ├── (app)/notes/ · notes/[id]/ · notes/new/
│       │   └── api/            # BFF route handlers
│       ├── components/
│       ├── lib/                # api client, formatters, tokens
│       └── styles/tokens.css
├── design/                     # lives one level up: ../design/
├── .github/workflows/ci.yml
├── docker-compose.yml
├── BUILD.md                    # this file
└── README.md
```

---

## 9. Build order — tests ship with every step

| # | Step | Done when |
|---|---|---|
| 0 | Monorepo, Docker Compose (Postgres + api + web), CI workflow, split settings | `docker compose up` boots all three; CI green on an empty test suite |
| 1 | Custom user model, first migration | Model tests pass; migration is the initial one |
| 2 | Category + Note models, user-scoped managers, `preview_text`, palette constants | Model + manager tests, including cross-user isolation |
| 3 | Signup/login/refresh/logout on DRF; seeding on signup | API tests: valid, invalid, duplicate email, seeding produces exactly 3 distinct categories |
| 4 | Categories + Notes API, permissions, pagination, annotated counts | API tests per endpoint; user A → 404 on user B's note; `assertNumQueries` on counts |
| 5 | Next scaffold, BFF proxy, cookie handling, typed client, TanStack Query | Route-handler tests for cookie set/clear and silent 401 refresh |
| 6 | Auth screens at full fidelity, `<AuthLayout>`, error states | Component tests: validation, submit, error rendering, reveal toggle |
| 7 | Notes grid, cards, sidebar with counts, category filter, empty states | Relative-date formatter boundaries, truncation, filter behaviour |
| 8 | Note page: inline edit, markdown + preview, autosave, category dropdown, delete | Debounced autosave, draft→persisted, optimistic timestamp |
| 9 | README, seed script for the demo, demo video | README covers process, decisions, and AI usage |

### Progress

- [x] Step 0 — monorepo, Compose, CI, split settings (custom User stub + initial migration included so AUTH_USER_MODEL boots; Step 1 adds model tests)
- [ ] Step 1
- [ ] Step 2
- [ ] Step 3
- [ ] Step 4
- [ ] Step 5
- [ ] Step 6
- [ ] Step 7
- [ ] Step 8
- [ ] Step 9

---

## 10. Standing guardrails

- Never emit `#9747FF`.
- Never fork the pill button component.
- Never give a `Note` its own colour.
- Never let a queryset skip the user filter.
- Placeholders are not labels — attach visually-hidden `<label>` elements.
- `CATEGORY_PALETTE` exists in Python **and** in CSS custom properties. Hex
  values must match exactly. API returns hex; frontend never maps names → colours.
- Type and spacing come from Figma MCP. SVG exports have outlined text — do not
  infer typography from them.
- If context runs out mid-build: compact, open a new chat, and point it at this
  file as the source of truth.
