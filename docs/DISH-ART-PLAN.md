# Dish artwork v2 — plan

A ground-up redesign of the generated recipe/dish SVGs (`MealPlate`) and, in a later
phase, the ingredient icon set. Written 2026-07-02 after a four-direction design
exploration judged by a three-lens panel (art direction, product design, engineering)
over real rendered output. Sample sheets live in `docs/art-exploration/`.

## Why (what's wrong today)

Verified against the live app (screenshots + code audit of `frontend/src/lib/dishArtwork.tsx`,
`ingredientIcons.tsx`, `components/MealPlate.tsx`):

1. **Undifferentiated art.** 204 recipes share 24 `dish_form` templates, heavily skewed:
   31 recipes render as the same brown "baked slab" — margherita-pizza, focaccia,
   cookies, tiramisu, cheesecake, Yorkshire puddings all look identical. Ham & Cheese
   Jaffle and Cheese Toastie are pixel-identical cards. Pavlova renders as pancakes;
   crème brûlée, gyoza and nachos share one dip plate; summer rolls are a plain circle.
2. **Unappetizing rendering.** Mashed potato is a flat yellow disc; mac & cheese is a
   brown blob; the roast chook reads as a potato. Sauces are single flat blobs.
3. **Floating packaged goods.** "Garnishes" stamp whole ingredient icons (milk cartons,
   sauce packets) hovering over the food.
4. **No per-recipe variation.** Within a form, only the sauce colour changes — 17 pasta
   recipes are the same bowl.
5. **Icon gaps.** 222 dictionary ingredients, 197 icons; 27 fall back to a generic
   labelled tin.

Render contexts the art must serve: 40px (RecipePicker rows), 64–72px (group cards,
WeekPlanner), 96–140px (minis), 240–280px (recipe cards), 340px (detail hero).

## The exploration (how the direction was chosen)

Four agents each produced a complete visual direction (6 test dishes at 400×400 + 3
ingredient icons), iterating against their own headless-Chrome renders (3–6 rounds each).
Test dishes: spaghetti-bolognese, green-thai-curry, margherita-pizza, greek-salad,
classic-beef-burger, chocolate-brownies.

| Direction | Sheet | Idea | Panel totals (AD/PD/Eng of 50) |
|---|---|---|---|
| **A — Ink & Cream refined editorial flat** | `dirA-sheet.png` | Perfect the app's existing flat + warm-ink language: confident silhouettes, one #3f2410 outline, two-tone fills with one offset highlight, toppings stamped *into* the food | **42 / 41 / 40 — winner, all three lenses** |
| B — Soft depth overhead | `dirB-sheet.png` | Cel-shaded overhead plating, soft shadows, gloss gradients, napkin/board context | 38 / 39 / 38 |
| C — Rustic ink & wash | `dirC-sheet.png` | Hand-drawn wobble, watercolour washes, marginalia | 34 / 32 / 32 (dies at 96/40px; feTurbulence perf risk) |
| D — Poster plate full-bleed | `dirD-sheet.png` | Dramatic crops, flat colour blocks, no outlines | 36 / 33 / 35 (best thumbnails, worst cohesion/appetite) |

**Verdict: build Direction A**, plus three steals every judge independently picked:

1. **From B — wet-sauce gloss.** One lighter offset blob + small white specular dot on
   every sauce/liquid mass (kept as flat shapes; a subtle radial gradient is acceptable
   on sauces only). Fixes A's "dry sticker" sauces.
2. **From C — the pulled-slice wedge.** Pizza/pie/tart/cake render with one wedge
   translated out along its bisector ("someone's eating this"). Strongest recognition
   trick on any sheet; pure geometry.
3. **From D — the "one eaten" story beat.** Traybake grids (brownies, slices, bars)
   omit one cell and leave a crumb scatter.

Plus two engineering mandates: the bolognese-style "strands drawn over the sauce edge"
rule is enforced in the generator (kills the tomato-soup misread), and every archetype
ships a simplified sub-96px variant (fewer micro-elements, stroke bump) chosen by the
existing `size` prop.

The winning direction's 9 reference SVGs (plus all other directions') are preserved
verbatim in `docs/art-exploration/direction-svgs.json` — they seed the implementation.

## Architecture

New module `frontend/src/lib/dishArt/` (the old `dishArtwork.tsx` is deleted at the end;
`MealPlate`'s public API — `recipe`, `size`, `rounded`, `ingredientIds` — is unchanged, so
zero call-site edits):

- `tokens.ts` — INK `#3f2410`, cream plate ramp, card-wash recipe (palette[1] fill +
  halo disc + offset shadow disc — identical three layers on every card).
- `palette.ts` — derive a 4-tone ramp from `recipe.palette[0]` (shade/main/tint/highlight
  via HSL lighten/darken) so 54 distinct recipe colours produce consistent, food-safe ramps.
- `seed.ts` — mulberry32 seeded from the slug; helpers for golden-angle ring scatter with
  radius/rotation jitter. Deterministic: same slug → same art, forever.
- `primitives.tsx` — vessels (top-down plate, rim bowl, pan + handle, board, ramekin,
  baking dish, side plate for stacks) and finishes (sheen arc, specular dot, steam curls,
  drizzle, contact shadow, crumb scatter).
- `toppings.tsx` — the stamp library, keyed by **ingredient id** (basil leaf pair, chilli
  ring, parmesan ribbon, feta cube, olive disc, cucumber wheel, tomato wedge, red-onion
  arc, mince crumb, sesame, walnut half, lemon/lime rim wedge, egg, herb fleck, …
  ~40 stamps) with section-level fallbacks (any herb → flecks, any veg → dice). Toppings
  are chosen automatically from `recipe.ingredients` (colourful/fresh ranked first,
  packaged staples excluded) and stamped *inside* the food silhouette.
- `forms/*.tsx` — archetype templates composing the above, each taking
  `{ tones, seed, toppingIds, size }`.

## Archetype vocabulary: 24 → ~50 forms in ~18 template families

New forms (validated against real slugs; 89 recipes re-mapped in `shared/recipes.json`,
`DISH_FORMS` + `scripts/validate-recipes.mjs` updated):

- **Disc family** (pulled-slice wedge built in): `pizza-whole`, `pie-whole`, `tart-slice`,
  `clafoutis-pan`, `borek-coil`
- **Traybake family** ("one eaten" grid): `bake-dish` (lasagna, moussaka, cottage pie,
  crumble, mac & cheese…), `cookie-scatter`, `cake-slice`, `loaf-slice`, `scones-plate`
- **Ramekin/soft family**: `ramekin` (crème brûlée, mousse), `pavlova-cloud`, `poached-fruit`,
  `mash-mound` (mash, bangers & mash + sausages, polenta)
- **Handheld family** (differentiated stacks): `burger-stack`, `wrap-roll`, `baguette-roll`
  (bánh mì, snag sanga), `toast-open` (avo toast, bruschetta), `bagel-stack`, `lettuce-cups`
- **Asian/bowl family**: `noodle-pull` (chopsticks lifting noodles — pho, ramen, pad see ew),
  `dumpling-steamer`, `smoothie-bowl`, `oats-jar`, `paella-pan`, `pan-dish` (gambas,
  patatas bravas, char siu)
- **Plate family**: `crumbed-plate` (schnitty, parma, katsu — crumb texture + lemon),
  `wings-pile`, `nachos-pile`, `fritter-stack`, `fry-up-plate`
- Existing 8 high-traffic forms (pasta, curry, soup, salad, stir-fry, grain bowl, roast,
  egg-brunch) are **rebuilt** in the new language with seeded per-recipe variation.

Within-form differentiation comes from three axes so 17 pastas no longer look identical:
seeded scatter/rotation, ingredient-derived toppings (carbonara gets egg-yolk + pancetta
crumbs; puttanesca gets olives + chilli rings), and form parameters (noodle shape:
strands/tubes/sheets; sauce coverage; vessel choice).

## Ingredient icons (the "each ingredient looks better" half)

Same grammar as the dishes (one dominant silhouette ~70% of the 100-box, ink stroke
4–4.5, exactly one highlight shape, ≤2 accessory marks):

1. Draw the **27 missing** icons (anchovy, gnocchi, vinegars, dates, nutmeg, …).
2. Redraw the **~60 most visible** (pantry seeds, common recipe ingredients, landing page).
3. Consistency sweep over the remainder: align stroke widths, add the missing highlight
   shape, kill any text-letter labels where a drawing is feasible.

## Verification (the part that made this exploration work)

A permanent `scripts/render-art-sheet.mjs` (puppeteer-core + installed Chrome) renders
**every** recipe dish at 240px + 96px and every ingredient icon at 64px + 28px into
contact-sheet PNGs. Each build phase ends with an actual look at the sheets (the same
render-and-inspect loop the design agents used), plus:

- vitest guards: every recipe's `dish_form` resolves to a real template; every dictionary
  ingredient has an icon or an explicitly-allowed fallback; no `Math.random` in dishArt.
- Bundle check: dishArt stays tree-shakeable and the recipes grid stays smooth (no
  filters; gradients only on sauce gloss).

## Build order

1. **Foundation** — tokens, palette ramp, seed, primitives, toppings library. (No visible change.)
2. **Rebuild the 8 high-traffic forms** + wire automatic topping selection + seeded
   variation. Visual QA sheet. *Biggest single visible win.*
3. **New archetypes + remap** — the ~26 new forms, `recipes.json` dish_form remap,
   validator update. Visual QA sheet.
4. **Ingredient icons** — 27 missing, top-60 redraw, consistency sweep. Visual QA sheet.
5. **Polish + ship** — landing mosaic check, mobile check, delete legacy `dishArtwork.tsx`
   & `RECIPE_ARTWORK` slug map, final full-app screenshot pass.

Each phase is independently shippable; the app renders correctly at every intermediate
commit (new forms fall back to the legacy template until their phase lands).
