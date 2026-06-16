# 7 Day Kitchen — Improvement Roadmap

A working checklist distilled from a multi-agent product/UX/tech review (every item was
ground-checked against the actual code, so nothing already-built is listed). Worked
top-to-bottom roughly in implementation order. Check items off as they ship.

**Legend:** impact / effort — `H` high · `M` medium · `L` low. `#n` = rank in the original review.

**The core insight:** the app is held back less by bugs than by *unfinished seams and dormant
data*. The pantry-first loop it markets has two missing edges (running-low never flows to the
next list; cooks are recorded but never surfaced), new users hit a 0%-match recipe wall, growth
plumbing sits on the wrong screens, and a buyer's due-diligence will flag the missing
tests/rate-limiting/account-deletion.

---

## Phase 0 — Latent bug fixes (fast, concrete)

- [x] **Duplicate pantry rows on re-buy** — `MoveBoughtToPantryAction` blindly inserts; re-buying a running-low staple creates a duplicate beside the flagged one. Make it **upsert by `ingredient_id`** (update `expires_at`, clear `running_low`). *(Folds into #1.)*
- [ ] **Parser false positives** — greedy substring/single-token fallback returns confident wrong matches (`tomato sauce`→soy sauce, `frozen pizza`→frozen peas, `green onions`→brown onions). *(Fixed properly in #3.)*
- [ ] **Wrong diet tags** — hand-set and contradictory (a `vegetarian` recipe contains bacon; `vegan` recipes contain dairy). *(Fixed in #14.)*
- [x] **`backend/composer.lock` is git-ignored** (untracked, 122 KB) → install/version drift; violates FLIPPING.md's own checklist. Un-ignore and commit it.

## Phase 1 — Quick wins (highest impact-per-hour)

- [x] **#1 · Close the running-low → next-list restock loop** `H/L` — the loop the product *markets* ("queued for next week's list automatically") but never completes.
  - [x] `PantryRepository::runningLow(userId, groupId)` + `POST /lists/{id}/restock` reusing `AddListItemsAction` batch + section resolution.
  - [x] ListsPage: "Restock (N)" button by "Paste list" + a "Running low (N) — add" chip-row when a list is open; dedup against existing items.
  - [x] The upsert bug fix from Phase 0.
- [x] **#7 · Undo on destructive actions + guided empty-pantry state** `H/L`
  - [x] Action-bearing toast with **deferred-commit undo** (drop from the react-query cache, hold the API delete until the toast expires, restore on Undo — not reinsert) for list-item delete, pantry delete, "Toss it". Extend `store/ui.ts` toast model + `Toasts.tsx`.
  - [x] Banner on RecipesPage when pantry empty or top match < 0.5, reframing the 0% grid as "browse the library" with Go-to-pantry / Start-a-list CTAs.
- [x] **#8 · Monetize + share the recipe pages** `H/L`
  - [x] Render `AffiliateButtons` on `PublicRecipePage` + `RecipeDetailPage` (add slug to the `trackEvent` payload).
  - [x] Native `navigator.share` button (clipboard fallback) on both, using the public `/r/` URL.
  - [x] `/register?from=<slug>` with recipe-aware copy + post-signup redirect to that recipe.
- [x] **#5b · Shareable group invite link** `L/M` — turn the raw clipboard token into `${origin}/join/<token>` + a `/join/:token` landing (one small public token-resolve endpoint returning only group name + inviter) + share sheet.
- [ ] **Trivial wins**
  - [x] Commit `composer.lock` (Phase 0).
  - [x] Surface dormant **Sponsored** recipe inventory (`sponsored_by`/`sponsored_url` shipped but never SELECTed) — plumb through + badge.
  - [x] **Haptics** (`navigator.vibrate`) on tick-off / mark-all / move-to-pantry / cook "Next step", behind a capability + reduced-motion + settings guard.
  - [x] **iOS install card** ("Tap Share → Add to Home Screen") instead of `InstallPrompt` silently returning null; add a `share` glyph to `Icon.tsx`.

## Phase 2 — Core loop & retention payoff

- [ ] **#2 · Seed a starter pantry on signup** `H/M` — empty pantry ⇒ all recipes rank 0% and the hero pick never fires. Dismissable first-run "stock common staples / I'll add my own" that inserts 8–12 high-coverage staples (verify ids vs `shared/ingredients.json`) in `RegisterAction` via the injected `PantryRepository`.
- [ ] **#9 · Food-waste & savings dashboard** `H/M` — brand is "Waste nothing" but no waste outcome is shown.
  - [ ] Log tosses (add `removed_at`/`removed_reason` or a removals log; "Toss it" currently hard-deletes with no trace).
  - [ ] `GET /api/v1/stats` aggregating `cooked_meals.removed_pantry_json` (rescued) vs tossed/expired; "Waste & savings" card on PantryPage.
  - [ ] *(Defer/premium:)* the "~$Y saved" figure (needs price data; only ever an estimate per the "presence not quantity" principle).
- [ ] **#11 · "Your kitchen" cook history** `H/M` — `cooked_meals` is captured but only used to demote.
  - [ ] `GET /recipes/cooked` (group by recipe) → "Recently cooked" rail + "Cook it again" + "cooked Nx" badge + streak chip.
  - [ ] `recipe_favourites` table + heart on detail/cards (mirror `suggestion_likes`); replace the dead-end cook done-screen with Save / Cook-again.
- [ ] **#16 · "Your kitchen today" home dashboard** `H/M` — new default authed screen (`/today`) composing existing queries (expiring items, top matches, active list, group feed when in a group). Best sequenced after #9 + #11. *(Spec lists "Home" first.)*

## Phase 3 — Trust & launch-readiness (due-diligence blockers)

- [ ] **#3 · Parser confidence threshold** `H/M` — scored match (levenshtein/`similar_text` on normalised tokens), require the discriminating word as a whole word, return tiers: confident / "maybe?" (amber confirm) / **none**. Add a PHPUnit fixture asserting the 10 known-bad inputs return none/maybe.
- [ ] **#4 · Rate-limit open endpoints** `H/M` — DB-backed fixed-window limiter: login/register 10/min/IP + 5/min/email, `/parse` 30/min/IP, and dedupe the unauth `view_count` UPDATE to 1 per IP+slug/hour. 429 + Retry-After in middleware; add a 429 arm to `ErrorHandler`.
- [ ] **#5 · Smoke tests + CI** `H/M` — ~12–15 PHPUnit integration tests on in-memory SQLite (auth, move-to-pantry, suggestion ranking, cook-decrement, the server parser, one ownership assertion per resource to lock the BOLA fixes) + Vitest for `format.ts` + GitHub Actions (`composer audit`, phpunit, `tsc --noEmit`, `vite build`).
- [ ] **#6 · Account deletion + export** `H/M` — `DELETE /api/v1/auth/me` running ADMIN.md's documented cascade (10 tables, ordered) in a transaction + reassign group ownership on owner deletion; typed-confirmation modal in Settings. Export (`GET /auth/me/export`) is the lower-priority second step.
- [ ] **#15 · Error monitoring + analytics instrumentation** `M/M`
  - [ ] Sentry (backend 5xx incl. thrown HttpExceptions; `@sentry/react` around `ErrorBoundary` + `onunhandledrejection`), DSN-gated; structured JSON logs + `X-Request-Id`.
  - [ ] Fire `trackEvent` at loop moments (`cook_completed`, `pantry_item_added`, `list_moved_to_pantry`, `suggestion_created`, `expiring_seen`) — only 3 wired today; read-only retention metrics endpoint.

## Phase 4 — Growth & SEO flywheel

- [ ] **#12 · Prerender `/r/:slug`** `H/H` — postbuild script walks `sitemap.xml`, fetches `/public/recipes/{slug}`, writes `dist/r/<slug>/index.html` with per-page title/description/canonical + the JSON-LD `PublicRecipeAction` already builds. (Served by the static host, not Slim.)
- [ ] **#18 · Per-recipe OG images + richer schema + collection pages** `M/M` — render `dishArtwork.tsx` to per-recipe OG PNGs (Node `renderToString` + resvg/sharp); add `author`/`recipeCuisine`/`suitableForDiet` once diet (#14) exists; public `/collection/:tag` + `/ingredient/:id` pages (scope to ~12–15 top tags; cross-link the orphaned catalogue).
- [ ] **#19 · Client-side parser + harden aliases** `M/M` — port the hardened match logic to `frontend/src/lib/parser.ts` from a build-time JSON bundle (instant + offline, as spec'd); expand aliases (scallion→spring onion, cilantro→coriander, courgette→zucchini, ketchup/tomato sauce…); log unmatched inputs to grow the dictionary (197 → 1,500+ target).

## Phase 5 — Strategic bets (the big value)

- [ ] **#10 · Notification infrastructure** `H/H` — build once, reuse everywhere.
  - [ ] Slice 1 (cheap, first): group unread badge (`last_seen_feed_at` + `GET /groups/unread` → existing NavItem badge).
  - [ ] Slice 2: web push (custom SW via VitePWA `injectManifest`, `push_subscriptions` table + subscribe endpoint, `minishlink/web-push`, CLI cron scanning the 0–3-day expiry window).
  - [ ] Slice 3: weekly "use-it-up" digest email (SMTP, `users.digest_optin` + unsubscribe). Strictly transactional/opt-in.
- [ ] **#13 · Offline write queue + cache `/lists` & `/pantry`** `H/H` — optimistic local updates (absent today) + IndexedDB outbox flushed on reconnect (Workbox BackgroundSync is already a transitive dep) + NetworkFirst caching. ⚠️ `toggle-bought` is a server-side **flip** (not idempotent) — queue a desired target state or dedupe per item.
- [ ] **#14 · Dietary profile + derived, validated diet tags** `H/M` — `users.diet_json` + Settings card; enforce in `SuggestionsAction` *before* the sort; derive flags from ingredient sections; seed-time/CI validator that fails on tag↔ingredient contradictions.
- [ ] **#20 · Recipe import from URL (+ the missing manual-create UI)** `M/H` — `api.createRecipe` has **zero callers** today, so there's no custom-recipe UI at all. Add "New recipe" (Import-from-link + Enter-manually). Import = SSRF-guarded `POST /recipes/import {url}` extracting schema.org JSON-LD → Parser → draft-confirm in the PasteParseModal preview.
- [ ] **#21 · Content pipeline + scale catalogue toward 300–500** `H/H` — data-driven `dish_form` field (instead of the 156-line slug→artwork registry) + Node/CI validator (unknown ingredient_id / missing dish_form / palette) + author recipes consuming the 37 orphan ingredients; backfill `timer_seconds` + `is_optional`.

## Phase 6 — Mobile depth & deferred hardening

- [ ] **#17 · Mobile depth** `M/M` — Web Share Target (`/share` route → PasteParseModal); cook-flow **Wake Lock** (ship first, no data dep); surface step `detail` in the cook view; live-camera OCR with framing guide. *(Defer cook timers until `timer_seconds` is backfilled.)*
- [ ] **#22 · Lightweight week-planner + first-run coachmark tour** `M/H` — solo "This week" 7-slot strip (new `meal_plan` table) + "build list from this week"; a short skippable tour teaching the cross-tab loop (esp. the hidden "Move to pantry" button).
- [ ] **#23 · Token revocation + pagination + servings scaling** `M/M` — `users.token_version` + `tv` claim + "sign out everywhere"; cap `/recipes/suggestions` to top-N (after ranking) + bound `/pantry`/`/lists`/`/groups/suggestions`; display-only servings stepper on RecipeDetailPage (not quantity tracking).

---

*Generated 2026-06-16 from a 64-agent review. Prior audits already shipped: security (IDOR/BOLA,
JWT, CORS), accessibility, correctness (401/ErrorBoundary), and launch polish (PWA icons, OG/meta,
sitemap, code-splitting, N+1). Those are intentionally **not** in this list.*
