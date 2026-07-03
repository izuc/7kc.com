# How to write a 7 Day Kitchen recipe

You are authoring NEW recipes for 7 Day Kitchen, an Australian pantry-first recipe app.
Each recipe is a finished, beginner-cookable dish in the exact JSON shape below, carrying
a full "guided cooking" layer so a complete beginner can cook it. Study the worked example
at the bottom — your output must match its voice, depth and structure exactly.

## Output

Return a single JSON array of recipe objects (no comments, no markdown, UTF-8). Every recipe
must be a dish that is NOT already in `existing-recipes.md`, with a unique lowercase-kebab
`slug`. Spread your recipes across cuisines, proteins, meal types and the dish forms listed
below — fill gaps rather than crowding one area.

## Recipe object — EXACT key order

| key | required | rules |
| --- | --- | --- |
| `slug` | yes | lowercase-kebab, unique, not in existing-recipes.md (e.g. `miso-glazed-eggplant`) |
| `title` | yes | Title Case, the dish name |
| `description` | yes | 1–2 short, appetising, specific sentences. NEVER a template — write for THIS dish |
| `prep_time` | yes | integer minutes |
| `cook_time` | yes | integer minutes (0 for no-cook) |
| `servings` | yes | integer |
| `difficulty` | yes | `easy` | `medium` | `hard` — honest, not flattering |
| `equipment` | yes | 1–8 lowercase strings, sized where it matters ("large frying pan"); include the oven + tray/dish when baked; NO cutlery, NO brand names |
| `storage` | yes | 1–2 sentences, food-safety accurate: cooked rice keeps 1 day, seafood 1–2 days, dressed salads don't keep, dairy sauces refrigerated |
| `make_ahead` | optional | one sentence, only when genuinely useful; omit the key otherwise |
| `leftovers` | optional | one sentence of a good reuse idea; omit otherwise |
| `substitutions` | optional | 0–4 of `{ "ingredient_id", "swap" }`; the id MUST be one of this recipe's ingredients; realistic Australian-pantry swaps |
| `tags` | yes | 2–4 lowercase-kebab tags (see the tags used across existing-recipes.md) |
| `palette` | yes | `[hex, hex]`. palette[0] = the dish's dominant COOKED food colour — warm and appetising (terracottas, golds, greens, browns). NEVER blue, grey, teal or purple. palette[1] = a pale cream/blush wash of the same family |
| `dish_form` | yes | one token from the allowed list below — pick the closest-looking form |
| `ingredients` | yes | array of `{ "id", "amount", "is_optional"? }`; `id` MUST be from the allowed ingredient ids below; `amount` is free text ("500 g", "2 cloves", "to serve") |
| `steps` | yes | 4–9 step objects (below) |

## Step object — EXACT key order

| key | required | rules |
| --- | --- | --- |
| `title` | yes | 2–5 imperative words, SPECIFIC ("Brown the mince", "Crisp the sage") — never generic ("Prep the ingredients", "Cook", "Finish") |
| `content` | yes | the always-visible quick line — one crisp sentence, ≤120 chars |
| `detail` | yes | the beginner walkthrough: 2–5 sentences, specific to THIS dish. Sensory cues (what it looks/sounds/smells like), what "done" means, how to rescue it. Name the real ingredients and techniques |
| `timer_seconds` | optional | integer 120–14400, only when the step has ONE clear timed wait of 2+ minutes; omit otherwise. Must be realistic for the dish |
| `tips` | optional | ≤2 strings, each ≤200 chars, ADDING to the detail (never restating it); omit if none |
| `warnings` | optional | ≤2 strings, each ≤200 chars, REAL hazards only: raw meat/chicken hygiene (only on steps handling it), hot oil vs water, garlic/caramel burns, don't open the oven early. No nanny warnings, and NEVER a raw-meat warning on a meatless or sweet dish |
| `ingredient_ids` | yes | the recipe-ingredient ids actually used in this step (may be empty); every id must be in this recipe's `ingredients`; no duplicates |

## Voice & safety

Warm, plain Australian English. Metric + Celsius only. Say tinned / capsicum / coriander —
never broil / skillet / cilantro. No emoji, no brand names. Chicken is cooked to **74°C** at
the thickest point; mince cooked through; fish flakes when done; rest red meat; fan-forced
oven temps.

## Hard rules (a validator rejects the recipe otherwise)

1. Every ingredient id — in `ingredients`, `substitutions` and every step's `ingredient_ids` — MUST be one of the allowed ids below. No inventing ids. If a dish needs something the list doesn't have (condensed milk, gelatine, lemongrass…), approximate with listed ingredients and say so in the recipe.
2. `dish_form` must be one of the allowed tokens below.
3. `slug` unique and not already in existing-recipes.md.
4. Each step needs a specific `title` (≤80 chars) and a valid `ingredient_ids` array.
5. tips/warnings: ≤2 each, ≤200 chars each. `timer_seconds`: 120–14400, one clear wait only.
6. No two of your recipes may share a step-title sequence or a description template — write each for its own dish.

## Allowed dish_form tokens (pick the closest-looking form)

- `bagel-stack` — e.g. Smoked Salmon Bagel, Bacon Egg Bagel Stack
- `baguette-roll` — e.g. BBQ Snag Sanga, Pork Banh Mi
- `bake-dish` — e.g. Sausage Pasta Bake, Mac & Cheese
- `borek-coil` — e.g. Spinach & Cheese Borek, Spinach Ricotta Filo Coil
- `burger-stack` — e.g. Classic Beef Burger, Crispy Chicken Burger
- `cake-slice` — e.g. Sticky Date Pudding, Tiramisu
- `clafoutis-pan` — e.g. Cherry Clafoutis, Toad in the Hole
- `cookie-scatter` — e.g. Fudgy Chocolate Brownies, Anzac Biscuits
- `crumbed-plate` — e.g. Chicken Schnitty, Eggplant Parma
- `curry-bowl` — e.g. Green Thai Curry, Chicken Tikka Masala
- `default-plate` — (unused; pick only if it truly fits)
- `dip-plate` — e.g. Hummus & Flatbread, Baba Ganoush
- `dumpling-steamer` — e.g. Pan-Fried Gyoza
- `egg-brunch` — e.g. Breakfast Frittata, Poached Eggs
- `fish-chips` — e.g. Fish & Chips, Salt & Pepper Calamari
- `fried-rice` — e.g. Veggie Fried Rice, Nasi Goreng
- `fritter-stack` — e.g. Zucchini Slice, Crispy Hash Browns
- `fry-up-plate` — e.g. Full English Fry-Up
- `grain-bowl` — e.g. Haloumi Grain Bowl, Salmon Teriyaki
- `lettuce-cups` — e.g. San Choy Bow, Vietnamese Summer Rolls
- `loaf-slice` — e.g. Banana Bread, Zucchini Walnut Loaf
- `mash-mound` — e.g. Silky Mashed Potato, Creamy Parmesan Polenta
- `muffins` — e.g. Blueberry Muffins, Chocolate Banana Muffins
- `nachos-pile` — e.g. Loaded Beef Nachos, Chorizo Corn Nachos
- `noodle-pull` — e.g. Chicken Noodle Soup, Duck Noodle Soup
- `oats-jar` — e.g. Overnight Oats, Yoghurt & Granola Bowl
- `paella-pan` — e.g. Chicken & Chorizo Paella, Saffron Prawn Rice Pan
- `pan-dish` — e.g. Seared Scallops with Pea Purée, Provençal Ratatouille
- `pancakes` — e.g. Pancakes, Fluffy Buttermilk Pancakes
- `pasta-bowl` — e.g. Spaghetti Bolognese, Prawn Pad Thai
- `pavlova-cloud` — e.g. Passionfruit Pavlova, Strawberry Eton Mess
- `pie-whole` — e.g. Classic Meat Pie, Apple Pie
- `pizza-whole` — e.g. Margherita Pizza, Tomato Olive Mozzarella Pizza
- `poached-fruit` — e.g. Red Wine Poached Pears, Tea-Poached Pears
- `ramekin` — e.g. Dark Chocolate Mousse, Crème Brûlée
- `risotto` — e.g. Mushroom Risotto, Pumpkin & Sage Risotto
- `roast-chicken` — e.g. Sunday Roast Chook, Whole Chicken Citrus Roast
- `roast-plate` — e.g. Sticky Pork Ribs, Pork Chops with Apple & Sage
- `roast-plate-chicken` — e.g. Honey Mustard Chicken Traybake, Rosemary Chicken Potato Tray
- `roast-plate-fish` — e.g. Kiwi-Mango Salsa over Pan-Fried Fish, Garlic Butter Barramundi
- `roast-plate-lamb` — e.g. Moroccan Lamb, Lamb Cutlet Couscous Plate
- `roast-plate-steak` — e.g. Steak & Chips, Chimichurri Steak
- `salad-plate` — e.g. Chicken Caesar Salad, Greek Salad
- `sandwich-stack` — e.g. Fried Egg Sandwich, The Ultimate Cheese Toastie
- `sausage-rolls` — e.g. Sausage Rolls, Lamb Mint Sausage Rolls
- `scones-plate` — e.g. Yorkshire Puddings, Cheddar Cheese Scones
- `shakshuka` — e.g. Shakshuka, Tomato Egg Shakshuka Rice
- `skewers` — e.g. Lamb Kofta with Tzatziki, Chicken Satay Skewers
- `smoothie-bowl` — e.g. Berry Smoothie Bowl, Creamy Banana Porridge
- `soup-bowl` — e.g. Sweet Potato Soup, Minestrone
- `stir-fry` — e.g. Stir-Fry Beef, Ginger Beef Stir-Fry
- `tacos` — e.g. Beef Tacos, Fish Tacos
- `tart-slice` — e.g. Lemon Tart, New York Cheesecake
- `toast-open` — e.g. Smashed Avo on Toast, Tomato Bruschetta
- `wings-pile` — e.g. Buffalo Chicken Wings, Honey Soy Chicken Wings
- `wrap-roll` — e.g. Veggie Wrap, Breakfast Burrito

## Allowed ingredient ids (use ONLY these — id, with display name)

**produce** — `banana` (Bananas), `apple` (Apples), `lemon` (Lemons), `lime` (Limes), `avocado` (Avocados), `tomato` (Tomatoes), `cherry_tomato` (Cherry tomatoes), `roma_tomato` (Roma tomatoes), `onion_brown` (Brown onions), `onion_red` (Red onions), `spring_onion` (Spring onions), `garlic` (Garlic), `ginger` (Ginger), `capsicum_red` (Red capsicum), `capsicum_green` (Green capsicum), `chilli` (Red chilli), `carrot` (Carrots), `potato` (Potatoes), `sweet_potato` (Sweet potato), `broccoli` (Broccoli), `cauliflower` (Cauliflower), `spinach` (Baby spinach), `rocket` (Rocket), `lettuce` (Lettuce), `cucumber` (Cucumber), `zucchini` (Zucchini), `mushroom` (Mushrooms), `coriander` (Coriander), `parsley` (Parsley), `basil` (Basil), `mint` (Mint), `sage` (Sage), `corn` (Corn), `pumpkin` (Pumpkin), `eggplant` (Eggplant), `green_bean` (Green beans), `celery` (Celery), `kale` (Kale), `leek` (Leek), `asparagus` (Asparagus), `beetroot` (Beetroot), `snow_pea` (Snow peas), `bok_choy` (Bok choy), `cabbage` (Cabbage), `strawberry` (Strawberries), `blueberry` (Blueberries), `orange` (Oranges), `grape` (Grapes), `mango` (Mango), `pineapple` (Pineapple), `passionfruit` (Passionfruit), `rosemary` (Rosemary), `thyme` (Thyme), `fig` (Figs), `pear` (Pears), `peach` (Peaches), `cherry` (Cherries), `kiwi` (Kiwifruit)

**meat** — `chicken_breast` (Chicken breast), `chicken_thigh` (Chicken thigh), `chicken_whole` (Whole chicken), `beef_mince` (Beef mince), `pork_mince` (Pork mince), `beef_steak` (Beef steak), `lamb_cutlet` (Lamb cutlets), `snags` (Snags), `bacon` (Bacon), `prawns` (Prawns), `salmon` (Salmon), `barramundi` (Barramundi), `ham_sliced` (Sliced ham), `lamb_mince` (Lamb mince), `pork_belly` (Pork belly), `chorizo` (Chorizo), `duck` (Duck breast), `scallop` (Scallops), `mussel` (Mussels), `calamari` (Calamari), `chicken_wing` (Chicken wings), `pork_shoulder` (Pork shoulder), `smoked_salmon` (Smoked salmon), `pork_chop` (Pork chops), `beef_brisket` (Beef brisket), `pork_ribs` (Pork ribs)

**dairy** — `milk` (Milk), `butter` (Butter), `eggs` (Eggs), `cheddar` (Cheddar), `parmesan` (Parmesan), `feta` (Feta), `yoghurt` (Greek yoghurt), `cream` (Thickened cream), `mozzarella` (Mozzarella), `haloumi` (Haloumi), `ricotta` (Ricotta), `mascarpone` (Mascarpone), `sour_cream` (Sour cream), `kimchi` (Kimchi), `cream_cheese` (Cream cheese), `paneer` (Paneer), `buttermilk` (Buttermilk), `blue_cheese` (Blue cheese)

**pantry** — `pasta` (Pasta), `spaghetti` (Spaghetti), `rice_jasmine` (Jasmine rice), `rice_basmati` (Basmati rice), `bread` (Bread), `wrap` (Wraps), `olive_oil` (Olive oil), `vegetable_oil` (Vegetable oil), `soy_sauce` (Soy sauce), `fish_sauce` (Fish sauce), `oyster_sauce` (Oyster sauce), `vinegar_balsamic` (Balsamic vinegar), `salt` (Sea salt), `pepper` (Black pepper), `sugar` (Sugar), `flour` (Plain flour), `tinned_tomato` (Tinned tomatoes), `tinned_chickpea` (Tinned chickpeas), `tinned_bean` (Tinned beans), `tinned_tuna` (Tinned tuna), `coconut_milk` (Coconut milk), `curry_paste_red` (Red curry paste), `curry_paste_green` (Green curry paste), `stock_chicken` (Chicken stock), `stock_veg` (Vegetable stock), `honey` (Honey), `peanut_butter` (Peanut butter), `vegemite` (Vegemite), `weetbix` (Weet-Bix), `oats` (Rolled oats), `muesli` (Muesli), `cumin` (Ground cumin), `paprika` (Smoked paprika), `chilli_powder` (Chilli powder), `cinnamon` (Cinnamon), `curry_powder` (Curry powder), `chickpea_dry` (Dried chickpeas), `lentil_red` (Red lentils), `breadcrumbs` (Breadcrumbs), `tortilla` (Tortillas), `couscous` (Couscous), `quinoa` (Quinoa), `noodle_egg` (Egg noodles), `noodle_rice` (Rice noodles), `polenta` (Polenta), `tinned_black_bean` (Black beans), `baking_powder` (Baking powder), `yeast` (Yeast), `vanilla` (Vanilla extract), `turmeric` (Turmeric), `sesame_oil` (Sesame oil), `dijon` (Dijon mustard), `mayo` (Mayonnaise), `sriracha` (Sriracha), `maple_syrup` (Maple syrup), `dark_chocolate` (Dark chocolate), `cocoa` (Cocoa powder), `almond` (Almonds), `cashew` (Cashews), `walnut` (Walnuts), `raisin` (Raisins), `tofu` (Tofu), `miso` (Miso paste), `nori` (Nori sheets), `gochujang` (Gochujang), `worcestershire` (Worcestershire), `stock_beef` (Beef stock), `tomato_paste` (Tomato paste), `oregano` (Oregano), `olive` (Olives), `caper` (Capers), `chocolate_chip` (Chocolate chips), `tea_chai` (Chai tea), `tahini` (Tahini), `preserved_lemon` (Preserved lemon), `sumac` (Sumac), `pine_nut` (Pine nuts), `pecan` (Pecans), `hazelnut` (Hazelnuts), `saffron` (Saffron), `bay_leaf` (Bay leaves), `star_anise` (Star anise), `rice_arborio` (Arborio rice), `coconut_desiccated` (Desiccated coconut), `icing_sugar` (Icing sugar), `meringue` (Meringue nests), `marshmallow` (Marshmallows), `anchovy` (Anchovy fillets), `dates` (Pitted dates), `cornflour` (Cornflour), `peanut` (Roasted peanuts), `nutmeg` (Nutmeg), `brown_sugar` (Brown sugar), `vinegar_white` (White vinegar), `vinegar_rice` (Rice vinegar), `vinegar_red_wine` (Red wine vinegar), `vinegar_cider` (Apple cider vinegar), `rice_paper` (Rice paper wrappers), `biscuit_sweet` (Sweet biscuits), `pasta_linguine` (Linguine), `flour_self_raising` (Self-raising flour), `fermented_black_bean` (Fermented black beans), `gnocchi` (Gnocchi), `noodle_glass` (Sweet potato glass noodles), `chilli_flakes` (Chilli flakes), `tomato_sauce` (Tomato sauce)

**frozen** — `peas_frozen` (Frozen peas), `berries_frozen` (Frozen berries), `pastry_puff` (Puff pastry), `ice_cream` (Ice cream), `corn_frozen` (Frozen corn), `pastry_filo` (Filo pastry), `ice_cream_vanilla` (Vanilla ice cream), `banana_frozen` (Frozen banana), `pastry_shortcrust` (Shortcrust pastry)

**other** — `coffee` (Coffee (ground or brewed)), `tea` (Tea bags), `wine_white` (White wine), `wine_red` (Red wine), `beer` (Beer)

## Full worked example

One complete, real recipe showing the exact shape, key order and depth to match:

```json
{
  "slug": "spaghetti-bolognese",
  "title": "Spaghetti Bolognese",
  "description": "The weeknight classic. Slow-simmered mince, rich tinned tomato, a knob of butter to finish.",
  "prep_time": 15,
  "cook_time": 35,
  "servings": 4,
  "difficulty": "easy",
  "equipment": [
    "large heavy frying pan",
    "large pot for pasta",
    "tongs",
    "wooden spoon",
    "chopping board and sharp knife",
    "grater"
  ],
  "storage": "Keeps 3 days in an airtight container in the fridge, or freeze the sauce (without pasta) for up to 3 months. Reheat until piping hot.",
  "make_ahead": "The sauce is even better the next day — make it up to 2 days ahead and reheat gently while the spaghetti cooks.",
  "leftovers": "Spare sauce is brilliant on a jacket potato or pressed into a cheese toastie.",
  "substitutions": [
    {
      "ingredient_id": "beef_mince",
      "swap": "pork mince, or half pork and half beef for a softer, richer sauce"
    },
    {
      "ingredient_id": "parmesan",
      "swap": "any hard grating cheese — a block of tasty does the job"
    },
    {
      "ingredient_id": "spaghetti",
      "swap": "any long pasta, or penne if that's what's in the cupboard"
    }
  ],
  "tags": [
    "comfort",
    "one-pot",
    "family"
  ],
  "palette": [
    "#c2410c",
    "#fde6d4"
  ],
  "dish_form": "pasta-bowl",
  "ingredients": [
    {
      "id": "beef_mince",
      "amount": "500 g"
    },
    {
      "id": "onion_brown",
      "amount": "1"
    },
    {
      "id": "garlic",
      "amount": "3 cloves"
    },
    {
      "id": "tinned_tomato",
      "amount": "2 tins"
    },
    {
      "id": "spaghetti",
      "amount": "400 g"
    },
    {
      "id": "parmesan",
      "amount": "to serve"
    },
    {
      "id": "olive_oil",
      "amount": "glug"
    },
    {
      "id": "salt",
      "amount": "pinch"
    },
    {
      "id": "butter",
      "amount": "knob, to finish",
      "is_optional": true
    }
  ],
  "steps": [
    {
      "title": "Dice the aromatics",
      "content": "Dice onion, mince garlic.",
      "detail": "Halve and peel the onion, keeping the root on to stop your eyes watering. Make lengthwise cuts, then across — aim for small, even dice (about 5mm). Smash garlic with the flat of a knife to loosen the skin, then mince or grate. Having everything prepped before you start the heat is called mise en place — makes the cook relaxed, not frantic.",
      "tips": [
        "If garlic sticks to the knife, a drop of oil rubbed on the blade stops it clinging."
      ],
      "ingredient_ids": [
        "onion_brown",
        "garlic"
      ]
    },
    {
      "title": "Brown the mince",
      "content": "Brown mince in olive oil, 6 min.",
      "detail": "Heat a glug of oil in a heavy pan over medium-high until it shimmers. Crumble the mince in in large chunks — don't break it up straight away. Let it sit untouched for 2 min to deep-brown on the bottom. Then start breaking up with a wooden spoon as you stir. That browning is flavour. Cook until no pink remains.",
      "timer_seconds": 360,
      "tips": [
        "If the mince releases a pool of liquid, keep going — it has to evaporate before real browning starts."
      ],
      "warnings": [
        "Wash hands, board and anything raw mince touched before moving on — don't let it near food you'll eat raw."
      ],
      "ingredient_ids": [
        "beef_mince",
        "olive_oil"
      ]
    },
    {
      "title": "Soften onion and garlic",
      "content": "Add onion and garlic, cook until soft.",
      "detail": "Drop heat to medium. Tip in onion and garlic — they'll sizzle and soften in the mince fat. Cook 5 min, stirring occasionally, until the onion is translucent and starting to gold at the edges. If the pan looks dry, a splash of water helps. Season with a big pinch of salt now.",
      "timer_seconds": 300,
      "tips": [
        "As the onion releases moisture, scrape the browned bits off the pan base — that's free flavour for the sauce."
      ],
      "ingredient_ids": [
        "onion_brown",
        "garlic",
        "salt"
      ]
    },
    {
      "title": "Simmer the sauce",
      "content": "Tip in tomatoes, simmer 20 min.",
      "detail": "Crush whole tomatoes with your hand as you pour them in. Add a pinch of salt, a crack of pepper, and a knob of butter if you've got one — it rounds off the acid. Simmer uncovered on low — big lazy bubbles, not a rolling boil — for 20 min, stirring every few minutes. It should reduce to a rich, glossy sauce that coats a spoon.",
      "timer_seconds": 1200,
      "tips": [
        "Splash a little water into each empty tin, swirl and tip it in — no tomato left behind."
      ],
      "ingredient_ids": [
        "tinned_tomato",
        "salt",
        "butter"
      ]
    },
    {
      "title": "Boil the spaghetti",
      "content": "Cook spaghetti.",
      "detail": "Bring a big pot of water to a rolling boil. Salt it heavily — it should taste like sea water. Add spaghetti, stir to prevent clumping. Cook 1 min less than the packet time for al dente. Before draining, scoop out a cup of pasta water — the starchy water emulsifies the sauce and pasta.",
      "tips": [
        "Set a timer off the packet, minus one minute — then taste a strand; it should have a slim pale core."
      ],
      "ingredient_ids": [
        "spaghetti",
        "salt"
      ]
    },
    {
      "title": "Marry pasta and sauce",
      "content": "Toss through sauce, top with parmesan.",
      "detail": "Drag the pasta straight from the pot into the sauce with tongs — a little water clinging is fine. Toss for a minute over low heat. If the sauce looks tight, splash in pasta water. Parmesan grated over the top, crack of pepper, eat immediately while it's still steaming.",
      "tips": [
        "Grate the parmesan finely so it melts into the sauce instead of sitting on top."
      ],
      "ingredient_ids": [
        "spaghetti",
        "parmesan"
      ]
    }
  ]
}
```
