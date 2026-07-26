# Demo walkthrough

A script you can read aloud while recording. Put the finished video at
[`demo.mp4`](./demo.mp4) (or link it from the root README).

Before you hit record: Docker Desktop on, `make up`, then `make seed`. Demo
login is `demo@notes.local` / `demo-pass-1234`. Aim for about three minutes.

---

This project is a notes app built for the Turbo AI hiring challenge. The idea
was simple on the surface — cream paper UI, category-tinted cards, markdown
notes — but the bar was that a reviewer should be able to clone the repo, run
one Compose command, and actually use the product. So from the start the stack
was locked: Django and DRF on the API, Next.js App Router on the web, Postgres
in Docker, and GitHub Actions running both test suites on every push.

The important architectural choice is how auth works. The browser never talks
to Django directly. Every request goes through Next.js route handlers that act
as a thin BFF. Django issues SimpleJWT access and refresh tokens; the BFF
stores them in httpOnly cookies and, on a 401, does a single silent
refresh-and-retry before failing. That keeps tokens out of JavaScript and out
of localStorage. On the API side, every note and category queryset is scoped
through a user filter at the manager level, so one user’s data doesn’t leak
into another’s — and there are tests that assert user A gets a 404 on user B’s
note.

Design-wise we treated the Figma exports as law. The app background is paper
cream, borders and labels use one ink brown, and headings use a slightly deeper
brown. Category colour is a property of the category, never of the note: cards
render a fifty-percent tint of that colour with a three-pixel solid border of
the same colour on top of the cream. Uncategorised notes get a neutral derived
from ink and paper. The purple that shows up in some SVG slices is Figma’s
annotation colour — it never made it into the codebase.

Typography for the writing surface is deliberate too. Note titles use Inria
Serif bold at twenty-four pixels; the body uses Inter at sixteen with a
twenty-seven pixel line height. Those same fonts show up on the cards in the
grid so the list and the editor feel like the same product.

Let me walk through what you actually see when you use it.

I start the stack with `make up`. That brings up Postgres, the API on port
8001, and the web app on 3000. After seeding, I sign in with the demo account —
or I can sign up fresh; signup only asks for email and password, and it seeds
three starter categories: Random Thoughts, School, and Personal.

Once you’re in, the notes grid is the home screen. The sidebar lists every
category with a count. Filtering is explicit: pick a category and the grid
narrows, but the counts stay visible. There’s search across title and body,
and it composes with the category filter. On a narrow viewport the sidebar
tucks into a folders drawer — same idea as Notes on an iPhone — so the notes
keep the screen and categories slide over when you need them. At the bottom of
the sidebar is a small account control with our cat favicon and your email;
that’s where you sign out. Sign-out and sign-in both clear the client cache so
the next person never briefly sees the previous user’s notes.

Creating a note is meant to feel lightweight. “New Note” goes to an empty
draft URL with nothing in the database yet. The first keystroke in the title
or body is what creates the row, then the address bar updates to that note’s
id without remounting the page and stealing focus. If you had a category
filter active, the new note inherits it; from “All Categories” it starts
uncategorised. From there autosave runs on a short debounce. The “Last Edited”
line updates as soon as you type; the PATCH catches up behind it.

The editor stores raw markdown but you edit it live — not in a separate
preview pane. Shortcuts turn a leading star, dash, or numbered prefix into a
list, and Tab and Shift+Tab nest or lift list items. Changing category,
creating a category, and deleting a note with a confirm are all available from
the note chrome. When you create a category you can pick any colour on an HSV
wheel, type a hex, or grab one of the suggested swatches. Colour still lives
only on the category.

Under the hood the API is the usual REST surface under `/api/v1/`: auth,
categories with annotated note counts, and notes with cursor pagination. List
endpoints return a derived `preview_text` so the grid can truncate without
parsing markdown in the browser. Category delete nulls the foreign key on
notes; it never cascades and deletes someone’s writing.

We built this in vertical slices with tests at each step — models and
managers first, then auth and seeding, then CRUD and isolation, then the BFF
and cookies, then the screens to design fidelity. Cursor was used as a
pair-programmer against a locked build doc, not as an unsupervised generator.
The product decisions, the cookie and scoping model, and the create-on-first-
keystroke behaviour stayed human-owned. The design folder we used for
reference stays local; the public repo is just the app.

That’s the app: one command to run it, cookies instead of tokens in the page,
user-scoped data by default, and a UI that follows the Figma tokens through
the awkward parts the designs never drew — errors, empty states, delete
confirm, search, and mobile folders.
