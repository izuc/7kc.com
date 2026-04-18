# 7KC Flipping Notes

Hand-off guide for a prospective buyer. What's built, what it's worth, and how to monetise.

## What you're getting

A complete, closed-loop kitchen management PWA with retention built into the data model. Full spec in [`../7kc-spec.md`](../7kc-spec.md).

- **Frontend:** React 18 + TypeScript + Vite, installable PWA, offline-tolerant
- **Backend:** PHP 8.2 + Slim 4, Doctrine DBAL (MySQL or SQLite)
- **Domain data:** 100+ item ingredient dictionary with aliases, 52 curated recipes, AU-first copy
- **Core loop:** shopping list → pantry (with expiry) → ranked recipe suggestions → cook → pantry decrements → next week's list
- **Groups:** shared lists/pantry, suggestions, likes, comments, activity feed — all hidden in solo mode
- **SEO:** public `/r/:slug` recipe landing pages with Schema.org JSON-LD, `sitemap.xml` generator, view-count tracking per recipe
- **Install:** single `php install.php` command, interactive or flag-driven, supports MySQL + SQLite

## Defensible UX
1. **Pantry lock-in.** Once a user populates a pantry, the cost of re-entering it in a competitor's app is high. Retention compounds with every cooked meal.
2. **Paste-to-parse.** The client+server parser handles freeform AU shopping lists (`2 chicken thighs, snags for the bbq, weetbix`) better than any generic list app.
3. **Solo vs group gate.** Solo mode is uncluttered; group mode activates extra features only when useful. This is unusual — most competitors either force social or have none.
4. **No AI.** Everything deterministic. Market this as a reliability feature (the spec says so).

## Monetisation paths (architecture-ready)

Already scaffolded:

1. **Affiliate grocery links.** `retailers` table seeded with Woolworths, Coles, Amazon Fresh. Frontend `<AffiliateButtons>` injects affiliate_id into basket URLs. Enable a retailer and set `affiliate_id`:
   ```sql
   UPDATE retailers SET affiliate_id = 'your-partner-id', enabled = 1 WHERE id = 'woolworths';
   ```
2. **Sponsored recipes.** `recipes.sponsored_by` and `sponsored_url` columns already exist — surface in the RecipesPage card with a badge.
3. **Analytics.** Plausible wired via `VITE_PLAUSIBLE_DOMAIN`. Already firing `affiliate_click`, `ocr_open`, `ocr_success` events.
4. **View counts.** `recipes.view_count` increments on every public recipe fetch — use for "trending" home sections or sponsor pricing.

Ready to add:

5. **Premium tier.** Add a `users.plan` column (`free` | `pro`). Gate behind: unlimited custom recipes, multi-group, barcode scanning, pantry analytics (food waste reports — compute from `cooked_meals.removed_pantry_json` vs `pantry_items` that expired without being cooked).
6. **Kitchenware affiliate.** Add `recipe_tools` table linking recipes to Amazon Associates product IDs. Render on recipe detail.
7. **White label.** The codebase is already tenant-neutral. Strip the `shared/` copy and re-seed for HelloFresh, Marley Spoon, etc.

## Traffic & SEO playbook

The recipe database is the lever. Each `/r/:slug` page:
- Inline Schema.org Recipe markup (rich results eligible)
- Clean URLs, fast LCP (recipe card is hero)
- Public access without login
- `sitemap.xml` at the API root auto-includes every seeded recipe

Growth moves:
- Submit `sitemap.xml` to Google Search Console
- Run a scripted pre-render pass (e.g. Puppeteer to static HTML) and serve prerendered pages to bots via Cloudflare Workers — doubles rich-result eligibility
- Add `og:image` generation (PHP GD on the backend rendering a styled recipe thumbnail)
- Target 500+ indexed recipe pages within 90 days. At ~5-10 organic visits/month/page, that's 2500-5000/mo baseline — meaningful for affiliate conversion

## Key metrics to track

| Metric | How to pull | Why it matters |
|---|---|---|
| DAU | Plausible unique visitors | Healthy retention signal |
| Pantry populate rate | `COUNT(DISTINCT owner_user_id) FROM pantry_items` / total users | Core value moment |
| Cook events / week | `COUNT(*) FROM cooked_meals WHERE cooked_at > UNIX_TIMESTAMP() - 604800` | Loop completion |
| Group conversion | `COUNT(*) FROM users WHERE group_id IS NOT NULL` / total users | Network-effect adoption |
| Affiliate CTR | Plausible `affiliate_click` / pageviews on lists | Revenue signal |

Add a one-page admin dashboard reading these queries — a buyer will love it.

## Codebase hand-off

- **Tests:** not included (scope call in spec). Recommend adding `phpunit` for repositories + `vitest` for frontend helpers before flip. Add a smoke-test GitHub Action.
- **Secrets:** `JWT_SECRET` is generated at install time. Rotate quarterly; revocation is a tokens blacklist (not implemented — low risk for v1).
- **Technical debt:** WebSocket real-time layer in the spec is scaffolded via API but not implemented. Groups currently rely on TanStack Query refetch. For v2, add Pusher or a 50-line Ratchet server.
- **Legal:** the 52 seeded recipes are original. Hero images not included — add before launch.

## Pre-flip checklist

- [ ] Fill in all recipe hero images (Unsplash licensed or AI-generated)
- [ ] Register affiliate accounts (Woolworths Rewards partners, Commission Factory, Amazon Associates AU)
- [ ] Set `VITE_PLAUSIBLE_DOMAIN` and install Plausible self-host or paid tier
- [ ] Submit sitemap to Google Search Console and Bing Webmaster
- [ ] Record a 2-minute end-to-end demo video of solo + group flow
- [ ] One-pager showing growth (new users/week), retention (pantry populate %), monetisation (affiliate revenue run-rate)
- [ ] Clean `composer.lock` + `package-lock.json` committed
- [ ] `docs/DEPLOY.md`, `docs/ADMIN.md` reviewed and up-to-date
