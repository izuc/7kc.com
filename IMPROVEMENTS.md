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

## Batch E — UX wins `M/L–M`
- [ ] Archived-lists view with Restore (backend `archiveList` exists; no UI to see/restore).
- [ ] Cook done-screen next action (Save / Cook again) _(verify — may be partial)_.
- [ ] Print/share a shopping list.
- [ ] Confirm/undo on "Move bought to pantry" (destructive, irreversible today).

## Batch F — SEO, growth & analytics `M/L`
- [ ] Fire `signup_completed`/`signup_started` with source (recipe / group-invite / landing).
- [ ] `Organization` + `WebSite` (SearchAction) JSON-LD on the landing page.
- [ ] Loop-moment events not yet wired (`expiring_seen`, `recipe_saved`).
- [ ] Public ingredient landing pages `/ingredient/:id` (prerendered + sitemap) for long-tail SEO.

## Bigger bets — need product steer (not auto-actioned)
- Recipe **cost estimation** + budget-aware suggestions (needs price data).
- **Allergen** warnings / hard dietary enforcement at suggestion time.
- Ingredient **substitution** suggestions.
- **Dark mode** theme.
- List **virtualization** (only matters past ~100s of items).
- Meal-prep **batch-cooking insights** on the week plan.
- Recipe **notes / annotations**; shopping-list **templates**.

---
*Generated 2026-06-17 from a 107-agent review (11 review dimensions + per-rec adversarial verification).
Items already covered by `RECOMMENDATIONS.md` are intentionally excluded.*
