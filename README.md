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
├── shared/      ingredient dictionary (222) + recipe catalogue (500, seeded into DB)
├── docs/        DEPLOY.md, ADMIN.md, API.md, DISH-ART-PLAN.md, art exploration
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

## Public pages & SEO

The whole catalogue is browsable without an account at `/browse` — search, tag filters, and every dish's generated artwork. Each recipe has a public page at `/r/:slug` with Schema.org Recipe markup for Google rich results, and tag collections live at `/collection/:tag`. The API exposes `sitemap.xml` at the root — submit it to Search Console.

## Generated dish artwork

No stock photos: every recipe card, hero and thumbnail is an SVG illustration generated at render time from the recipe's own data — its ingredients pick the toppings, its palette sets the tones, and a slug-seeded RNG gives each recipe a stable, unique composition. 54 dish archetypes (pizza with a pulled slice, noodle bowls with chopsticks, traybakes with one square missing…) live in `frontend/src/lib/dishArt/`; the 222 ingredient icons share the same "ink & cream" language. Design history and rules: [`docs/DISH-ART-PLAN.md`](./docs/DISH-ART-PLAN.md). Visual QA harness: `node frontend/scripts/render-art-sheet.mjs` renders every dish/icon to contact-sheet PNGs.

## Guided cooking

Every one of the 500 seeded recipes carries a full beginner layer: each step has a short title, a plain-English walkthrough, technique tips and real-hazard warnings (raw-chicken hygiene, hot-oil-and-water, don't-open-the-oven), plus the ingredients that step actually uses. Recipes also know their difficulty, the equipment you'll need, easy ingredient swaps, and make-ahead / storage / leftover guidance — all food-safety checked (chicken to 74°C, cooked rice keeps 1 day, seafood 1–2 days). Cook Mode (`/cook/:slug`) walks you through step by step with per-step countdown timers (chime + vibration), pantry-aware "in this step" ingredient chips, and a screen wake-lock so the phone stays on at the stove. The whole layer lives in `shared/recipes.json` and is enforced by `scripts/validate-recipes.mjs`; authoring rules are in [`docs/GUIDED-COOKING.md`](./docs/GUIDED-COOKING.md).

## Optional AI photo scanning

Off by default. If the server operator points `AI_SCAN_ENDPOINT` / `AI_SCAN_MODEL` (plus optional `AI_SCAN_API_KEY`, `AI_SCAN_TILES`) at any OpenAI-compatible vision endpoint (LM Studio, Ollama, OpenAI), users get two extras: "Scan a list" reads a photographed shopping list, and the pantry's "Scan photo" recognises groceries on fridge/pantry shelves (with confirm-before-add). The key stays server-side; recipe matching and ranking never use AI. See `backend/.env.example`.

## Docs

- [`docs/DEPLOY.md`](./docs/DEPLOY.md) — production deploy notes
- [`docs/ADMIN.md`](./docs/ADMIN.md) — day-two operations, SQL recipes, user management
- [`docs/FLIPPING.md`](./docs/FLIPPING.md) — monetisation paths, SEO playbook, hand-off checklist
- [`docs/API.md`](./docs/API.md) — endpoint reference
- [`7kc-spec.md`](./7kc-spec.md) — full product spec

## Phases shipped

- ✅ Phase 1: Shopping list with paste-to-parse, sections, tick-off UX
- ✅ Phase 2: Accounts + pantry with expiry tracking and move-to-pantry flow
- ✅ Phase 3: seeded recipe catalogue, ranked suggestions, cook flow with pantry deduction
- ✅ Phase 4: Groups, shared lists/pantry, meal suggestions, likes, comments, feed
- ✅ Phase 5: OCR (Tesseract.js), PWA install prompt, Plausible analytics, affiliate buttons (Woolies/Coles seeded), `/r/:slug` SEO recipe pages with Schema.org JSON-LD, sitemap generator, sponsored-recipe + view-count columns, FLIPPING/ADMIN docs
- ✅ Phase 6: catalogue grown to 204 chef-reviewed recipes; dish artwork v2 (generated, seeded, 54 archetypes) + 222 redrawn ingredient icons; public `/browse` catalogue and landing-page art showcase; mobile responsiveness pass; optional operator-configured AI photo scanning (shopping lists + pantry/fridge shelves)
- ✅ Phase 7: guided cooking — beginner walkthroughs on every step of all 204 recipes (titles, tips, safety warnings, per-step ingredients), difficulty/equipment/swaps/storage on every recipe, and a Cook Mode with per-step timers and pantry-aware ingredient chips
- ✅ Phase 8: catalogue grown to 240, then 280 — 76 new chef-verified dishes filling the gaps (Aussie retro classics, Chinese/Japanese/South-East Asian favourites, European bistro, Mexican, British comfort, baking and sweets), each with the full guided-cooking layer and its own generated artwork, plus two new art archetypes (sausage rolls, muffins)
- ✅ Phase 9: catalogue grown to 491 — 211 more dishes (weeknight pasta, curries, grain bowls, salads, bakes and desserts). Delivered as draft skeletons, then rewritten in full through the writer → chef-verifier pipeline into genuine per-dish guided-cooking recipes (unique steps, real technique/safety, no boilerplate) and re-paletted to warm, dish-appropriate artwork; 9 near-duplicates of existing dishes dropped
- ✅ Phase 10: rounded out to 500 with 9 hand-authored, chef-verified sweets — caramel slice, chocolate ripple cake, Basque burnt cheesecake, banoffee pie, chocolate fondant, Portuguese custard tarts, golden syrup dumplings, lemon meringue pie and vanilla slice (caramels/toffees made from scratch, no condensed milk or gelatine in the pantry)

## Principles

1. Pantry *presence*, not quantity
2. Zero-friction entry (sign up once, everything else flows)
3. Paste anything, parse smartly (a dictionary and a decent fuzzy matcher — the optional photo-scan is the only AI, and it's off by default)
4. Mobile-first, thumb-friendly
5. Offline-tolerant (service worker caches reads)
6. Solo-mode hides social UI entirely — Group tab only appears when you join a group
