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

## Batch B — Frontend performance `M/L`
- [ ] `React.memo` on `RecipeCard` and list `ItemRow`s (re-render on pagination/filter today).
- [ ] Longer `staleTime`/`gcTime` on static reads (ingredient dictionary, recipes, retailers).
- [ ] Memoize `MealPlate` ingredient-id array derivation.

## Batch C — PWA & offline `H/L` ✅ (update-prompt deferred)
- [x] Runtime-cache all recipe sub-paths (suggestions/cooked/favourites/{slug}/comments) + ingredients + group feed/suggestions, bounded (300 entries / 1 day). Ranked feed, history, favourites & group browse now work offline.
- [x] Outbox: keep the queue on transient (5xx/429/offline/401) failures and only drop a 4xx server-verdict; backed-off auto-retry + a "Retry now" button in the sync banner.
- [x] Manifest: app shortcuts (Today / Pantry / Lists) + categories.
- [ ] SW update-available prompt — deferred (registerType is already `autoUpdate`; an explicit refresh prompt is a UX call).

## Batch D — Backend correctness & security `M/L`
- [ ] Wrap `MoveBoughtToPantryAction` in a transaction (currently multi-step, no atomicity) _(verify)_.
- [ ] Field-size validation on user-authored recipe/list inputs (titles, notes) before insert.
- [ ] Rate-limit the remaining state-changing open-ish endpoints (suggestion create, digest unsubscribe) _(verify)_.
- [ ] Add indexes for hot queries (`shopping_list_items`, `rate_limits.bucket`) _(verify)_.
- [ ] `(user_id, endpoint)` uniqueness / race-safety on push subscriptions _(verify; endpoint-unique today)_.
- [ ] Harden `week_start` parsing (bounded, no ReDoS) _(verify)_.
- [ ] CORS: refuse to echo an empty/origin-mismatched `Access-Control-Allow-Origin` _(verify)_.

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
