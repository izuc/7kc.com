# 7 Day Kitchen — Improvement List (Review v2)

A second-pass review (multi-agent, 11 dimensions, every finding adversarially verified
against the current code and de-duplicated against what's already shipped in
`RECOMMENDATIONS.md`). 89 recommendations survived verification; consolidated below into
themed, actionable batches. Worked top-to-bottom; checked off as shipped.

**Legend:** impact / effort — `H`/`M`/`L`. Items marked _(verify)_ needed a code check first
because the app is mature and some candidates turned out partly done.

---

## Batch A — Accessibility & semantics `H/L` ✅
- [x] Descriptive `aria-label` on recipe cards (title, time, serves, pantry-match %, expiring).
- [x] `role="list"` on the recipe grid (`<ul>`+`<li display:contents>`, pixel-identical).
- [x] `aria-pressed` on the remaining toggle groups (RecipesPage filter chips, PantryPage view toggles, Settings push/digest) + `role="group"` labels.
- [x] Labels on unlabelled inputs (new-list name, add-item, delete-account confirm, group name).
- [x] `.sr-only` utility added.
_(Skipped as already-done: global `focus-visible` styling, `role="alert"` on form errors, toast/sync `aria-live`.)_

## Batch B — Frontend performance `M/L` ✅
- [x] `React.memo` on `RecipeCard` (the 204-card grid) — shipped in Batch A.
- [x] `React.memo` on `MealPlate`/`MealPlateMini` (cooked-rail plates pass stable refs but re-rendered on every page-state change).
- [~] Static-read `staleTime`/`gcTime` — **already done** (dictionary/ingredients/retailers carry 1h staleTime+gcTime); no change needed.
- [skip] `ItemRow` memo — low ROI (lists are small; callsites pass fresh callbacks → would need a refactor for marginal gain).

## Batch C — PWA & offline `H/L` ✅ (update-prompt deferred)
- [x] Runtime-cache all recipe sub-paths (suggestions/cooked/favourites/{slug}/comments) + ingredients + group feed/suggestions, bounded (300 entries / 1 day). Ranked feed, history, favourites & group browse now work offline.
- [x] Outbox: keep the queue on transient (5xx/429/offline/401) failures and only drop a 4xx server-verdict; backed-off auto-retry + a "Retry now" button in the sync banner.
- [x] Manifest: app shortcuts (Today / Pantry / Lists) + categories.
- [ ] SW update-available prompt — deferred (registerType is already `autoUpdate`; an explicit refresh prompt is a UX call).

## Batch D — Backend correctness & security `M/L` ✅
- [x] Wrap `MoveBoughtToPantryAction` in a DBAL transaction — atomic move (verified live: `{moved:2}`, pantry populated).
- [x] Field-size validation on `CreateRecipeAction` (title ≤200, desc ≤4000, ≤100 ingredients, ≤60 steps) + cap suggestion title; verified 400/201.
- [x] Rate-limit `CreateSuggestionAction` (20/min/user) — digest-unsubscribe was **already** limited.
- [x] CORS: never emit a blank `Access-Control-Allow-Origin` (prod fails closed).
- [x] Memoize `ingredientIdsForAll()` per request (called twice per suggestions request) — the real "N+1".
- [skip] `(user_id,endpoint)` push uniqueness — **already** `endpoint`-UNIQUE, which is the *correct* design (a push endpoint is globally one browser).
- [skip] `week_start` ReDoS — regex is `^\d{4}-\d{2}-\d{2}$`, anchored & linear; no ReDoS.
- [skip] `shopping_list_items`/`rate_limits` indexes — list-items always queried by indexed `list_id`; `rate_limits.bucket` is the PK. Both already covered.
- [skip] `MealPlan.upsertSlot` race — **already** catches `UniqueConstraintViolationException`.

## Batch E — UX wins `M/L–M` ✅ (move-bought confirm intentionally skipped)
- [x] Archive a list + an "Archived (N)" view with Restore — `archiveList` had **zero** UI callers (couldn't archive *or* see archived). Verified live (archive→active1/archived1, restore→active2/archived0). Added an `archive` icon.
- [x] Cook done-screen: dropped the forced 1.6s auto-redirect; added explicit next actions (Save to favourites / Cook again / View recipe / Find another) so it's no longer a flash-and-vanish dead-end.
- [x] Print a shopping list — Print button + extended the existing `@media print` block to strip list chrome and lay items out cleanly.
- [skip] Confirm/undo on "Move bought to pantry" — intentionally not added; it's the core happy-path loop and a confirm would add friction (now atomic via Batch D).

## Batch F — SEO, growth & analytics `M/L` ✅ (ingredient pages → bigger bets)
- [x] Fire `signup_started` (mount) + `signup_completed` (success) with source (recipe / group-invite / landing) — the most critical conversion event was dark.
- [x] `Organization` + `WebSite` (SearchAction) JSON-LD on the homepage; RecipesPage now seeds search from `?q=` so the SearchAction target actually filters.
- [x] Loop-moment events `expiring_seen` (TodayPage, once/mount when items expiring) + `recipe_saved` (favourite).
- [→] Public ingredient landing pages `/ingredient/:id` — moved to bigger bets (substantial: backend action+repo, page, prerender, sitemap, router).

## Bigger bets — need product steer (not auto-actioned)
- Recipe **cost estimation** + budget-aware suggestions (needs price data).
- **Allergen** warnings / hard dietary enforcement at suggestion time.
- Ingredient **substitution** suggestions.
- **Dark mode** theme.
- List **virtualization** (only matters past ~100s of items).
- Meal-prep **batch-cooking insights** on the week plan.
- Recipe **notes / annotations**; shopping-list **templates**.

---

## Deep bug hunt (round 2) — 23 confirmed bugs, 21 fixed ✅

A 12-subsystem adversarial bug hunt (agents reading full code paths, every finding
verified) found 23 real, triggerable bugs. Fixed in batches G/H/I (all verified live):

**Batch G — auth & cross-account security**
- [x] (high) Deleted-account JWTs stayed valid up to 7 days — AuthMiddleware now loads the user and 401s if the row is gone.
- [x] (high) Rate-limiter lost-update race → bypass; now an atomic `count=count+1`.
- [x] (high) Query cache never cleared on login/logout → account B saw A's data; `qc.clear()` on every transition.
- [x] (high) Global offline outbox replayed A's queued writes into B's account; ops now tagged + filtered by user.
- [x] (med) `clientIp` trusted a forged X-Forwarded-For; now REMOTE_ADDR unless a TRUSTED_PROXY.
- [x] (low) `favourites()` leaked a group recipe after the user left; added the visibility predicate.

**Batch H — backend correctness & data integrity**
- [x] Seeder never re-synced ingredient display/section/shelf_life (stale → wrong diet flags).
- [x] Move-bought could duplicate pantry rows on double-click; now an idempotent per-row claim.
- [x] "Rescued" waste stat inflated on phantom/duplicate ids; persist only truly-deleted ids.
- [x] Thrown 4xx/5xx responses lacked CORS headers; CORS now wraps the error middleware.
- [x] `createCustom` non-transactional + unbounded amount → orphaned partial recipe; transaction + length caps.
- [x] Account/group deletion left orphaned list-items + suggestion likes/comments; delete children by parent.
- [x] Manual pantry-add bypassed dedup; now routes through `addOrRefresh`.
- [x] Owner leaving a surviving group left a dangling owner; promote a remaining member.
- [x] phinx vs app disagreed on absolute `DB_SQLITE_PATH`; aligned the resolution.

**Batch I — frontend correctness**
- [x] `useSoftDelete` reverted concurrent sibling edits on Undo; targeted re-insert into the current cache.
- [x] Archived lists unreachable once no active list remained; surfaced in the empty state.
- [x] ErrorBoundary never reset → wedged across navigation; resets on route change.

**Deferred (cosmetic, need a migration / row-locking):**
- [ ] (low) Unread badge drops a feed event created in the same wall-clock second as mark-seen (needs a monotonic seq column).
- [ ] (low) Group 8-member cap is a join-time TOCTOU (needs `SELECT … FOR UPDATE` or a count constraint).

---
*Generated 2026-06-17 from a 107-agent review (11 review dimensions + per-rec adversarial verification),
then a 35-agent deep bug hunt (12 subsystems + per-bug verification).
Items already covered by `RECOMMENDATIONS.md` are intentionally excluded.*
