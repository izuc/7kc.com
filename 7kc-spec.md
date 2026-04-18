# 7 Day Kitchen — Specification v1.0

**Domain:** 7kc.com
**Tagline:** *Use what you've got. Eat what you love. Waste nothing.*
**Positioning:** A pantry-first kitchen management app. Shopping list → pantry → meal suggestions, all looped together. No AI. No subscriptions required. Optional group layer for households.

---

## 1. Product Overview

### 1.1 The Core Loop

The app is built around one insight: most meal planners fail because they ignore what's already in your kitchen. 7 Day Kitchen inverts the flow:

```
Shopping List  →  Pantry  →  Meal Suggestions  →  Shopping List
    (input)      (state)       (output)            (next week)
```

Users enter (or paste) a shopping list. As they shop, they tick items off. Ticked items land in their pantry with smart expiry estimates. The pantry drives meal suggestions ranked by "ingredients you already have" and "what's expiring soonest." Cooked meals remove their ingredients from the pantry. The loop repeats.

### 1.2 Two Modes: Solo and Group

The product has two distinct experiences, gated by whether a user has added anyone to their group:

- **Solo Mode (default on signup):** Private lists, private pantry, private meal choices. No social prompts, no "who's cooking" nudges, no empty activity feeds. Feels complete and useful on its own.
- **Group Mode (activated when a second member joins):** Real-time shared lists, shared pantry, meal suggestions with likes and comments, group activity feed.

Solo users should **never** see placeholder social UI. The group tab itself is hidden until a group exists.

### 1.3 Target Audience & Flip Narrative

- **Primary users:** Couples and small households, cost-of-living conscious, anti-food-waste. AU market first (dev context) but fully international-ready.
- **Flip value prop:** A complete, closed-loop kitchen management system with retention built into the data model (once the pantry is populated, switching apps is painful). Defensible UX, clear monetisation paths (affiliate grocery links, sponsored recipes, premium tier for advanced pantry features), multi-user network effects.

---

## 2. Design Principles

1. **Pantry presence, not quantity.** Items are "have it" or "don't have it" with an optional "running low" flag. No grams, no units, no partial-use tracking. This is a ruthless simplicity call — quantity tracking is the feature that kills every meal planner's UX.
2. **Zero-friction entry.** New users can use the shopping list feature with no signup. Account creation only required for sync, groups, and meal history.
3. **Paste anything, parse smartly.** Freeform text input is the primary shopping list entry method. The app does the work of tokenising, normalising, and matching to the ingredient dictionary.
4. **Mobile-first, thumb-friendly.** This is used in supermarket aisles and kitchens with wet hands. Big tap targets, no tiny menus, works in portrait.
5. **No AI.** Curation, filtering, fuzzy matching, and good data beat LLM suggestions for this use case. Market this as a feature.
6. **Offline-tolerant.** Shopping list ticking, pantry updates, and recipe browsing work offline. Sync on reconnect.

---

## 3. Feature Breakdown

### 3.1 Shopping List (Phase 1 — ships first, standalone)

**Core behaviours:**

- **Create a list.** Named (e.g. "Weekly shop", "BBQ Saturday"), multiple lists allowed per user.
- **Paste-to-parse input.** Large textarea accepts freeform text: "2 chicken breasts, milk, bananas\n- pasta\n- tomatoes (roma)". Parser splits on commas/newlines/bullets, strips quantities, fuzzy-matches to the ingredient dictionary, shows a preview where unmatched items become new custom entries.
- **Manual add.** Autocomplete typeahead backed by the ingredient dictionary.
- **Photo-to-list (Phase 1.5).** Tesseract.js in-browser OCR on a photo of a handwritten list. Zero server cost.
- **Tick-off UX.** Single tap toggles bought state. Bought items slide to bottom with strikethrough. "Mark all bought" button at the top for plan-and-execute-in-one-go users.
- **Auto-pantry population.** When an item is ticked bought, it's queued for the pantry. User gets one "Move bought items to pantry" button on list completion — explicit, not automatic, so they can exclude one-off items (e.g. a birthday cake).
- **Store sections.** Items grouped by aisle/section (Produce, Dairy, Meat, Pantry, Frozen, Other) for efficient shopping. Section derived from the ingredient dictionary, user-editable per item.

**Data model:**

```
shopping_lists (id, group_id?, owner_user_id, name, created_at, archived_at)
shopping_list_items (
  id, list_id, ingredient_id?, custom_name?, section,
  note, is_bought, bought_by_user_id?, bought_at?,
  added_by_user_id, added_at, sort_order
)
```

### 3.2 Pantry (Phase 2)

**Core behaviours:**

- **Populated from ticked shopping list items.** One-tap bulk add from completed lists.
- **Manual add/remove.** Quick-add search, one-tap remove on "used it up".
- **Expiry estimation.** Each ingredient in the dictionary has a default shelf life (produce 5d, dairy 7d, packaged 30d+, frozen 90d, pantry staples 365d). On add, app sets an `expires_at` timestamp. User can edit.
- **Expiring soon indicator.** Items within 3 days of expiry get a visual warning. Expired items get a red flag with "still good?" / "toss it" buttons.
- **"Running low" flag.** User can mark an item as running low — it's still in the pantry for meal suggestions but gets auto-added as a suggestion on the next shopping list.
- **Sections.** Pantry mirrors store sections for easy scanning. Toggle view: by section, by expiry, alphabetical.

**Data model:**

```
pantry_items (
  id, group_id?, owner_user_id,
  ingredient_id?, custom_name?,
  added_at, expires_at?, running_low, notes
)
```

*Note: `group_id` is nullable. If null, it's a solo user's pantry. If set, all group members share it.*

### 3.3 Recipes & Meal Suggestions (Phase 3)

**Recipe database:** Seeded with ~300–500 curated recipes at launch. Each recipe has:

- Title, description, prep/cook time, servings, difficulty
- Ingredients (linked to ingredient dictionary, with amounts as free text)
- Steps (ordered, plain text with optional timer hints)
- Tags (vegetarian, vegan, gluten-free, dairy-free, quick, one-pot, batch-friendly, etc.)
- Hero image, optional step images
- Source attribution

**Suggestion ranking:** When the user opens "What can I make?", recipes are ranked by:

1. Percentage of ingredients already in pantry (primary)
2. Whether any pantry ingredients are expiring soon (boost)
3. User's active filters (time, dietary, tags)
4. Recency of last cook (deprioritise recently-made recipes)

Show the "you need to buy: X, Y" list prominently for partial matches — this is where the "add missing to shopping list" button lives, closing the loop.

**Cook flow:** "I'm cooking this" button → step-by-step view with timers → on completion, prompt "remove used ingredients from pantry?" with checkboxes (defaulted to yes for all).

**Custom recipes:** Users can add their own recipes. These are private by default, optionally shareable to their group.

### 3.4 Groups & Social Layer (Phase 4)

**Group creation:**

- Any user can create one group. (v1 limit: one group per user, simplifies permissions.)
- Group owner invites via shareable link or email. Link contains a one-time join token.
- Invitees accept, become members. Owner can demote/remove members.
- Group size: 2–8 members (covers partners + small housemate groups; prevents group-chat chaos).

**What's shared in a group:**

- Shopping lists (all members can add, edit, tick off — in real time)
- Pantry (single shared pantry for the household)
- Custom recipes (optionally)
- Meal suggestions with votes + comments (see below)

**Real-time sync:** WebSocket layer (Ratchet for PHP Slim, or Pusher/Ably if they want managed). Optimistic UI updates on the client, server broadcasts changes to other connected members. Fallback to polling every 15s if WebSocket unavailable.

**Meal suggestions (group-only):**

- Any member can "suggest" a recipe from the database or their custom recipes: "How about tacos on Thursday?"
- Suggestions appear on the group feed with a date (optional), thumbnail, and link to the recipe.
- Other members can 👍 like and comment. No dislikes (keep it friendly).
- Threaded replies not needed for v1 — flat comments.
- When someone cooks a suggested meal, it's marked "cooked" and archives to the history.

**Group feed:** Chronological stream of group activity:
- "Sarah added 4 items to Weekly Shop"
- "Mike suggested Chicken Tikka Masala for Friday"
- "Sarah cooked Chicken Tikka Masala — 3 ingredients removed from pantry"
- "Mike: 'that was so good let's do it again'"

Feed is muted by default — no notifications unless user opts in. Respect the "this isn't a social network" vibe.

**Solo-mode hiding:** When `group_id` is null for a user:
- Hide the "Group" tab entirely
- Hide all comment/like/suggest UI on recipes
- Hide the feed
- Show a single discoverable entry point in settings: "Invite someone to your kitchen" — soft, not pushy.

### 3.5 Accounts & Auth

- **Anonymous use (v1):** Shopping lists stored in LocalStorage. Usable immediately, no signup.
- **Account creation (optional but prompted at key moments):** Email + password, magic link option later. Account is required for: pantry, meal suggestions, groups, sync across devices.
- **Data migration:** On signup, LocalStorage data migrates to the account.
- **OAuth:** Google sign-in in Phase 2. Keeps AU market happy without forcing passwords.

---

## 4. Technical Architecture

### 4.1 Stack

**Frontend:**
- React 18 + TypeScript
- Vite
- Tailwind CSS
- TanStack Query (server state)
- Zustand (local UI state)
- React Router v6
- Tesseract.js (OCR, lazy-loaded)
- Workbox (service worker for offline)

**Backend:**
- PHP 8.2+ with Slim Framework 4
- PHP-DI for dependency injection
- Doctrine DBAL (abstracts MySQL/SQLite cleanly)
- Ratchet (WebSocket) for real-time — optional, only runs if groups feature is used
- Firebase JWT for auth tokens

**Database:**
- **MySQL 8.0+** (primary, recommended for multi-user group deployments)
- **SQLite 3.35+** (zero-config option for solo/small deployments)
- Same schema via Doctrine DBAL, toggle via config flag `DB_DRIVER=mysql|sqlite`
- Migrations via Phinx (supports both drivers natively)

**Hosting (recommended for buyer):**
- Frontend: Cloudflare Pages / Netlify (static)
- Backend: any PHP 8.2 host (DigitalOcean droplet, Hetzner, shared hosting)
- WebSocket: separate worker process (or Pusher if simpler)
- Image CDN: Cloudflare R2 or Bunny for recipe images

### 4.2 Project Structure

```
7kc/
├── frontend/
│   ├── src/
│   │   ├── components/      (ui primitives, ShoppingList, Pantry, Recipe, Group*)
│   │   ├── pages/           (Home, Lists, Pantry, Recipes, Cook, Group, Settings)
│   │   ├── hooks/           (useShoppingList, usePantry, useGroup, useRealtime)
│   │   ├── lib/             (api client, parser, ocr, ingredient matcher)
│   │   ├── store/           (zustand slices)
│   │   └── types/           (shared types)
│   └── vite.config.ts
├── backend/
│   ├── src/
│   │   ├── Action/          (Slim handlers, one per endpoint)
│   │   ├── Domain/          (entities, repositories, services)
│   │   ├── Infrastructure/  (DB, auth, websocket)
│   │   └── Support/         (parser, matcher, expiry estimator)
│   ├── config/
│   │   ├── settings.php
│   │   ├── routes.php
│   │   └── dependencies.php
│   ├── db/
│   │   ├── migrations/      (phinx)
│   │   └── seeds/           (ingredient dictionary, starter recipes)
│   ├── public/
│   │   └── index.php
│   └── composer.json
├── shared/
│   └── ingredient-dictionary.json   (source of truth, ~2000 items)
└── docs/
    ├── SPEC.md (this file)
    ├── API.md
    └── DEPLOY.md
```

### 4.3 The Ingredient Dictionary

The single most important data asset. A JSON file of ~1500–2500 ingredients with:

```json
{
  "id": "chicken_breast",
  "display": "Chicken breast",
  "aliases": ["chicken breasts", "chook breast", "chicken breast fillet", "chicken fillet"],
  "section": "meat",
  "default_shelf_life_days": 3,
  "frozen_shelf_life_days": 90,
  "is_countable": true,
  "common_units": ["breast", "fillet", "kg", "g"]
}
```

Used by:
- Parser (matches freeform input)
- Autocomplete (typeahead)
- Pantry (expiry estimation, sectioning)
- Recipes (canonical ingredient references)
- Shopping list (sectioning for aisle grouping)

Seeded at deploy time, then extensible per-user (custom ingredients stored per-account).

### 4.4 The Parser

Plain TypeScript, runs client-side for instant feedback:

1. Split input on newlines, commas, and common bullets (`-`, `*`, `•`).
2. For each line, strip leading quantities (regex for `2`, `2x`, `500g`, `1 cup`, etc.).
3. Strip common noise words (`of`, `the`, `fresh`, `organic` — configurable).
4. Fuzzy match against the ingredient dictionary using Fuse.js (threshold ~0.4).
5. Show user a confirmation view: matched items in green, unmatched in amber with "add as custom" option.

Server-side validation on save — client parser is UX only.

### 4.5 Database Schema (key tables)

```sql
users (id, email, password_hash, display_name, created_at, group_id?)

groups (id, name, owner_user_id, invite_token, created_at)
group_members (group_id, user_id, role, joined_at)

ingredients (id, display, aliases_json, section, shelf_life_days, ...)
user_ingredients (id, user_id, display, section, ...)  -- custom overrides

shopping_lists (id, owner_user_id, group_id?, name, created_at, archived_at)
shopping_list_items (id, list_id, ingredient_id?, custom_name?, ...)

pantry_items (id, owner_user_id, group_id?, ingredient_id?, custom_name?, added_at, expires_at?, running_low)

recipes (id, title, description, prep_time, cook_time, servings, tags_json, source, image_url, is_custom, owner_user_id?, group_id?)
recipe_ingredients (recipe_id, ingredient_id, amount_text, is_optional)
recipe_steps (id, recipe_id, sort_order, content, timer_seconds?)

cooked_meals (id, user_id, group_id?, recipe_id, cooked_at, removed_pantry_items_json)

meal_suggestions (id, group_id, suggested_by_user_id, recipe_id, suggested_for_date?, created_at, cooked_meal_id?)
suggestion_likes (suggestion_id, user_id, created_at)
suggestion_comments (id, suggestion_id, user_id, content, created_at)
```

All `group_id?` columns: null = solo/private, set = shared with group.

### 4.6 API Shape

RESTful JSON. Slim routes grouped by resource. JWT bearer auth. Versioned under `/api/v1/`.

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
GET    /api/v1/auth/me

GET    /api/v1/ingredients?q=chick
POST   /api/v1/ingredients/parse   (body: {text})  → parsed items preview

GET    /api/v1/lists
POST   /api/v1/lists
GET    /api/v1/lists/:id
PATCH  /api/v1/lists/:id
DELETE /api/v1/lists/:id
POST   /api/v1/lists/:id/items
PATCH  /api/v1/lists/:id/items/:itemId
POST   /api/v1/lists/:id/items/:itemId/toggle-bought
POST   /api/v1/lists/:id/move-bought-to-pantry

GET    /api/v1/pantry
POST   /api/v1/pantry/items
PATCH  /api/v1/pantry/items/:id
DELETE /api/v1/pantry/items/:id
GET    /api/v1/pantry/expiring

GET    /api/v1/recipes?q=...&tags=...&has_ingredients=auto
GET    /api/v1/recipes/:id
GET    /api/v1/recipes/suggestions           (ranked by pantry match)
POST   /api/v1/recipes                       (custom)
POST   /api/v1/recipes/:id/cook

POST   /api/v1/groups                        (create)
GET    /api/v1/groups/mine
POST   /api/v1/groups/join                   (body: {token})
DELETE /api/v1/groups/members/:userId
GET    /api/v1/groups/feed

POST   /api/v1/groups/suggestions
GET    /api/v1/groups/suggestions
POST   /api/v1/groups/suggestions/:id/like
POST   /api/v1/groups/suggestions/:id/comment
```

### 4.7 Real-time Layer

- WebSocket server on port 8080 (configurable).
- On connect, client sends JWT + group_id, server joins them to a group channel.
- Events broadcast to channel: `list.item.added`, `list.item.toggled`, `pantry.item.added`, `pantry.item.removed`, `suggestion.created`, `suggestion.liked`, `suggestion.commented`.
- Client reconciles via optimistic update + server echo.
- If SQLite mode is selected, WebSocket layer is optional — app degrades gracefully to polling.

---

## 5. Build Phases

### Phase 1: Shopping List MVP (1–2 weeks)
- Solo mode only, LocalStorage persistence
- Create/rename/archive lists
- Paste-to-parse with ingredient dictionary
- Manual add with typeahead
- Tick-off UX, sections
- Mobile-first responsive layout
- Deployable as a usable product on its own

### Phase 2: Accounts + Pantry (1–2 weeks)
- Auth (email/password)
- LocalStorage → account migration
- Pantry view with expiry tracking
- "Move bought to pantry" flow
- Running-low flag → auto-suggestions on new list

### Phase 3: Recipes + Meal Suggestions (2–3 weeks)
- Recipe seed data (300+ starter recipes)
- Recipe browser with filters
- "What can I make?" ranked by pantry
- Cook flow with pantry deduction
- Custom recipes (solo)

### Phase 4: Groups + Social (2–3 weeks)
- Group creation, invites, management
- Shared lists/pantry with real-time sync
- Meal suggestions, likes, comments
- Group feed
- Solo-mode UI hiding

### Phase 5: Polish + Flip Prep (1 week)
- OCR photo-to-list
- Google OAuth
- PWA install prompts
- Affiliate link scaffolding (Woolworths/Coles in AU, Amazon Fresh abroad)
- Analytics (Plausible — privacy-respecting, flips well)
- SEO landing pages for top recipes (flip-critical)
- Documentation: DEPLOY.md, ADMIN.md, FLIPPING.md

---

## 6. Monetisation Paths (for flip narrative)

Not built into v1, but the architecture supports all of these cleanly. Document them in `FLIPPING.md` so the buyer sees the runway:

1. **Affiliate grocery links.** On shopping lists, "Order via Woolworths" button. Commission per basket.
2. **Sponsored recipes.** Brands pay for recipe placement. Already built into the recipes table via a `sponsored_by` column (add in Phase 5).
3. **Premium tier.** Unlimited custom recipes, multiple groups, advanced pantry analytics (food waste reports, spend tracking), barcode scanning. ~$4.99/mo.
4. **Kitchenware affiliate.** Recipe pages link to recommended tools.
5. **White label.** Sell the codebase to meal-kit companies (HelloFresh, Marley Spoon) as a customer retention tool.

---

## 7. SEO & Flip Value

The recipe database is the SEO goldmine. Each recipe should render as a statically generated landing page with:
- Schema.org Recipe markup (rich results)
- Clean URLs (`/recipes/chicken-tikka-masala`)
- Fast LCP (recipe image optimised, content inline)
- Related recipes, related pantry uses

Target 500+ indexed recipe pages by flip time. Even modest organic traffic (~5k–10k/mo) significantly boosts valuation.

---

## 8. Open Questions / Decisions Deferred

1. **Multi-language.** Start English only. Dictionary structure supports i18n later — aliases can be language-scoped.
2. **Barcode scanning.** Defer to premium tier; requires barcode → product database (OpenFoodFacts API is free but noisy).
3. **Recipe imports from URLs.** Extract via schema.org Recipe markup. Defer to Phase 5 or post-launch.
4. **Notifications.** Push notifications for group activity — defer entirely, not needed for flip.
5. **Export.** CSV export of shopping lists, recipes, cooked history — nice-to-have, build only if time allows.

---

## 9. Success Criteria (pre-flip)

- [ ] All 5 phases shipped
- [ ] 300+ seeded recipes, all with hero images
- [ ] 1500+ entry ingredient dictionary
- [ ] Lighthouse mobile score 90+ on all major pages
- [ ] Works offline for list ticking and recipe viewing
- [ ] Both MySQL and SQLite deployments tested and documented
- [ ] 500+ recipe landing pages indexed in Google
- [ ] Clean codebase, zero critical vulnerabilities, documented deploy process
- [ ] At least one successful end-to-end group flow (two real accounts, shared list, shared pantry, cooked meal) recorded as demo video

---

*End of spec. v1.0 — ready for Claude Code implementation.*
