# 7 Day Kitchen (7kc.com)

*Use what you've got. Eat what you love. Waste nothing.*

A pantry-first kitchen management PWA. Shopping list → pantry → meal suggestions, all looped together. Solo by default, with an optional group layer for shared households.

Built from [`7kc-spec.md`](./7kc-spec.md).

## Stack

- **Frontend:** React 18 + TypeScript + Vite, TanStack Query, Zustand, React Router, vite-plugin-pwa
- **Backend:** PHP 8.2 + Slim 4, Doctrine DBAL, Firebase JWT, Phinx migrations
- **Database:** MySQL 8+ or SQLite 3.35+ (swap via `DB_DRIVER`)
- **PWA:** installable, offline-tolerant, responsive mobile-first (also looks good on desktop)

## Layout

```
7kc/
├── frontend/    React + TS + Vite PWA
├── backend/     PHP Slim API (MySQL | SQLite)
├── shared/      ingredient dictionary + starter recipes (seeded into DB)
├── prototype/   original static HTML prototype (for reference only)
├── docs/        DEPLOY.md, API notes
└── 7kc-spec.md  product spec
```

## Quick start

The installer works two ways — **CLI** or **web UI**. Both run the same checks, driver picker, migrations and seed.

### Option A — CLI (one command)

```bash
php install.php
```

Prefer non-interactive?

```bash
# SQLite — zero setup
php install.php --driver=sqlite --yes

# MySQL (uses your local root/no-password by default)
php install.php --driver=mysql --yes

# Just verify your environment
php install.php --check

# Reset everything (drops DB, re-seeds)
php install.php --reset
```

### Option B — Web UI

Start install.php as a tiny web server, then open the installer in your browser:

```bash
php -S 127.0.0.1:8080 install.php
# open http://127.0.0.1:8080
```

The UI walks you through three steps: environment check (live), database driver + Test-connection button (MySQL host/user/pass or SQLite path), and Install — which writes `.env`, runs migrations, and seeds everything. You'll get a "You're all set" card with commands to start the servers. Already-installed systems show an "Allow reinstall" toggle as a guard.

The web installer is restricted to local network addresses by default. To allow remote install, set the env var `INSTALL_ALLOW_REMOTE=1` before running PHP — and delete `install.php` once you're done.

When it's done:

```bash
cd backend && composer serve     # http://localhost:8000
cd frontend && npm run dev        # http://localhost:5173 (new terminal)
```

Sign up, create a list, paste a recipe in, tick items off, move bought → pantry, cook a recipe and watch the pantry decrement.

## Install as a PWA

Open http://localhost:5173 in a supported browser. In Chrome/Edge you'll get an in-app install banner after a short browse; on iOS use Share → Add to Home Screen.

## SEO landing pages

Every seeded recipe has a public page at `/r/:slug` with Schema.org Recipe markup for Google rich results. The API exposes `sitemap.xml` at the root — submit it to Search Console.

## Docs

- [`docs/DEPLOY.md`](./docs/DEPLOY.md) — production deploy notes
- [`docs/ADMIN.md`](./docs/ADMIN.md) — day-two operations, SQL recipes, user management
- [`docs/FLIPPING.md`](./docs/FLIPPING.md) — monetisation paths, SEO playbook, hand-off checklist
- [`docs/API.md`](./docs/API.md) — endpoint reference
- [`7kc-spec.md`](./7kc-spec.md) — full product spec

## Phases shipped

- ✅ Phase 1: Shopping list with paste-to-parse, sections, tick-off UX
- ✅ Phase 2: Accounts + pantry with expiry tracking and move-to-pantry flow
- ✅ Phase 3: 52 seeded recipes, ranked suggestions, cook flow with pantry deduction
- ✅ Phase 4: Groups, shared lists/pantry, meal suggestions, likes, comments, feed
- ✅ Phase 5: OCR (Tesseract.js), PWA install prompt, Plausible analytics, affiliate buttons (Woolies/Coles seeded), `/r/:slug` SEO recipe pages with Schema.org JSON-LD, sitemap generator, sponsored-recipe + view-count columns, FLIPPING/ADMIN docs

## Principles

1. Pantry *presence*, not quantity
2. Zero-friction entry (sign up once, everything else flows)
3. Paste anything, parse smartly (no AI — just a dictionary and a decent fuzzy matcher)
4. Mobile-first, thumb-friendly
5. Offline-tolerant (service worker caches reads)
6. Solo-mode hides social UI entirely — Group tab only appears when you join a group
