# Guided cooking — authoring rules

Every seeded recipe in `shared/recipes.json` carries a guided-cooking layer on top of its
quick steps, so a complete beginner can cook any dish. `scripts/validate-recipes.mjs`
hard-fails CI when the layer is missing or malformed — this doc is the intent behind
those checks. Custom/user recipes are exempt (the fields are nullable end to end).

## Recipe-level fields

| Field | Required | Rules |
| --- | --- | --- |
| `difficulty` | ✅ | `easy` \| `medium` \| `hard`. easy = forgiving basics; medium = real knife work, multiple components or timing that matters; hard = pastry, emulsions, deep-frying, timing-critical stages. Be honest, not flattering. |
| `equipment` | ✅ | 1–8 items the cook actually needs, lowercase, sized where it matters ("large frying pan", "20 cm springform tin"). List the oven + tray/dish when baked. No cutlery, no brand names. |
| `storage` | ✅ | 1–2 sentences: fridge life (airtight), freezability, how to reheat. Food-safety accurate: cooked rice cools fast and keeps 1 day; seafood 1–2 days; dressed salads don't keep. |
| `make_ahead` | optional | Only when genuinely useful (sauce keeps, marinade improves, dough rests overnight). |
| `leftovers` | optional | One sentence of genuinely good reuse ideas. Don't force it. |
| `substitutions` | optional | 0–4 of `{ingredient_id, swap}`. The id must exist in this recipe's ingredients. Realistic Australian-pantry swaps; mind the recipe's diet tags (e.g. tamari to stay gluten-free). |

## Step-level fields

Each step is an object: `{title, content, detail, timer_seconds?, tips?, warnings?, ingredient_ids}`.

- **title** — required, 2–5 imperative words, specific ("Brown the mince", not "Cook").
- **content** — the always-visible quick line. **detail** — the beginner walkthrough
  (sensory cues, what it should look like, what to do if it goes wrong).
- **timer_seconds** — only when the step has one clear timed wait of 2+ minutes.
- **tips** — ≤2, each ≤200 chars, adding to (never repeating) the detail text.
- **warnings** — ≤2, real hazards only: raw meat/chicken hygiene, hot oil vs water,
  garlic burns fast, sugar-syrup burns, don't open the oven early. No nanny warnings.
- **ingredient_ids** — the recipe-ingredient ids used in this step (empty array is fine;
  ids must exist in the recipe). Powers Cook Mode's pantry-aware "in this step" chips.

## Voice & safety standards

Warm, plain Australian English. Metric + Celsius only; tinned/capsicum/coriander, never
broil/skillet/cilantro. No emoji. Chicken is cooked at **74°C** at the thickest point;
mince cooked through; fish flakes when done; rest red meat.

## Where it surfaces

- Recipe detail + public `/r/:slug`: method titles/tips/warnings behind the beginner-notes
  toggle (default on, printed always), "You'll need", "Easy swaps", "Good to know",
  and a *skill* stat. Step titles also feed the Schema.org `HowToStep.name`.
- Cook Mode `/cook/:slug`: step title, callouts, per-step countdown timer, ingredient chips.
- DB: `recipes.difficulty/equipment_json/make_ahead/storage/leftovers/substitutions_json`
  and `recipe_steps.title/tips_json/warnings_json/ingredient_ids_json`, re-synced from the
  JSON on every seed run.
