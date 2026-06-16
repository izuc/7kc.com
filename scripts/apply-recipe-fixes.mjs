// One-off: apply the high-confidence fixes from the recipe-quality audit to
// shared/recipes.json. Every op is defensive (logs if the target isn't found) and
// only touches in-dictionary ingredients / valid dish_form tokens.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const p = path.join(root, 'shared', 'recipes.json');
const recipes = JSON.parse(fs.readFileSync(p, 'utf8'));
const bySlug = Object.fromEntries(recipes.map((r) => [r.slug, r]));
let changes = 0;
const log = (m) => { console.log('  ' + m); changes++; };

const addIng = (slug, id, amount, opts = {}) => {
  const r = bySlug[slug]; if (!r) return console.error(`  ✗ no recipe ${slug}`);
  if (r.ingredients.some((i) => i.id === id)) return;
  const o = { id, amount }; if (opts.is_optional) o.is_optional = true;
  r.ingredients.push(o);
  log(`${slug}: + ${id} "${amount}"`);
};
const removeTag = (slug, tag) => {
  const r = bySlug[slug]; if (!r) return;
  if (!r.tags.includes(tag)) return;
  r.tags = r.tags.filter((t) => t !== tag);
  log(`${slug}: - tag "${tag}"`);
};
const setForm = (slug, form) => {
  const r = bySlug[slug]; if (!r) return;
  if (r.dish_form === form) return;
  log(`${slug}: dish_form ${r.dish_form} -> ${form}`);
  r.dish_form = form;
};
const removeIng = (slug, id) => {
  const r = bySlug[slug]; if (!r) return;
  const n = r.ingredients.length;
  r.ingredients = r.ingredients.filter((i) => i.id !== id);
  if (r.ingredients.length !== n) log(`${slug}: - ingredient ${id}`);
};
const swapIng = (slug, fromId, toId, amount) => {
  const r = bySlug[slug]; if (!r) return;
  const ing = r.ingredients.find((i) => i.id === fromId);
  if (!ing) return console.error(`  ✗ ${slug}: no ${fromId} to swap`);
  ing.id = toId; if (amount) ing.amount = amount;
  log(`${slug}: swap ${fromId} -> ${toId}`);
};
const setAmount = (slug, id, amount) => {
  const r = bySlug[slug]; if (!r) return;
  const ing = r.ingredients.find((i) => i.id === id); if (!ing) return;
  ing.amount = amount; log(`${slug}: ${id} amount -> "${amount}"`);
};
const setTitle = (slug, title) => { const r = bySlug[slug]; if (!r) return; r.title = title; log(`${slug}: title -> "${title}"`); };
const replaceSteps = (slug, from, to) => {
  const r = bySlug[slug]; if (!r) return;
  const re = new RegExp(from, 'g');
  let hit = false;
  for (const s of r.steps) {
    if (re.test(s.content)) { s.content = s.content.replace(re, to); hit = true; }
    if (s.detail && re.test(s.detail)) { s.detail = s.detail.replace(re, to); hit = true; }
  }
  if (hit) log(`${slug}: steps "${from}" -> "${to}"`);
};

// --- Add missing ingredients the method already calls for (all in-dictionary) ---
addIng('prawn-pad-thai', 'noodle_rice', '200 g');
addIng('prawn-pad-thai', 'coriander', 'handful', { is_optional: true });
addIng('prawn-linguine', 'lemon', '1/2');
addIng('banana-bread', 'baking_powder', '2 tsp');
addIng('stir-fry-beef', 'soy_sauce', '2 tbsp');
addIng('stir-fry-beef', 'sesame_oil', '1 tsp');
addIng('roast-veg-couscous', 'couscous', '1.5 cups');
addIng('pancakes', 'baking_powder', '2 tsp');
addIng('fish-chips', 'beer', '1 cup');
addIng('fish-chips', 'baking_powder', '1 tsp');
addIng('spaghetti-bolognese', 'butter', 'knob, to finish', { is_optional: true });
addIng('chicken-caesar-salad', 'garlic', '1 clove');
addIng('chicken-caesar-salad', 'dijon', '1 tsp');
addIng('chicken-caesar-salad', 'lemon', '1/2');
addIng('steak-chips', 'thyme', 'few sprigs', { is_optional: true });
addIng('greek-salad', 'oregano', '1 tsp dried');
addIng('greek-salad', 'olive', '1/2 cup');
addIng('greek-lamb-souva', 'oregano', '1 tsp');
addIng('thai-beef-salad', 'onion_red', '1/2');
addIng('chicken-shawarma', 'lettuce', '1/4, shredded');
addIng('lamb-kofta', 'tomato', '1', { is_optional: true });
addIng('eggs-benedict', 'vinegar_balsamic', 'splash (for poaching)', { is_optional: true });

// --- Remove false tags ---
removeTag('zucchini-slice', 'vegetarian'); // contains bacon
removeTag('tofu-stir-fry', 'vegan');        // contains honey
removeTag('san-choy-bow', 'gluten-free');   // oyster/soy sauce
removeTag('duck-noodle-soup', 'seafood');   // it's duck
removeTag('chorizo-pasta', 'italian');      // Spanish chorizo

// --- Fix wrong dish_form tokens ---
setForm('chilli-con-carne', 'curry-bowl');  // saucy stew over rice
setForm('salmon-teriyaki', 'grain-bowl');   // salmon over rice, not a curry
setForm('buffalo-wings', 'roast-plate');    // not skewers
setForm('mashed-potato', 'default-plate');  // soft side, not risotto
setForm('summer-rolls', 'default-plate');   // not tacos

// --- Remove genuinely unused ingredients ---
removeIng('gyoza', 'bok_choy');     // cabbage already covers it
removeIng('lamingtons', 'baking_powder'); // self-raising flour provides rise

// --- Ingredient swaps to match the dish, with matching step text ---
swapIng('eggplant-parma', 'zucchini', 'eggplant', '1 large');
replaceSteps('eggplant-parma', 'Zucchini', 'Eggplant');
replaceSteps('eggplant-parma', 'zucchini', 'eggplant');
swapIng('pancakes-fluffy', 'milk', 'buttermilk', '2 cups');
replaceSteps('pancakes-fluffy', '\\bmilk\\b', 'buttermilk');

// --- Step-text only fixes (in-dictionary) ---
replaceSteps('peach-cobbler', 'cornflour', 'flour');         // flour is the listed ingredient
replaceSteps('sticky-date-pudding', 'dates', 'raisins');     // raisin is the stand-in
replaceSteps('sticky-date-pudding', 'Dates', 'Raisins');
setAmount('choc-chip-cookies', 'baking_powder', '1 tsp');    // was "1 tsp bicarb"
setTitle('beetroot-salad', 'Beetroot, Ricotta & Walnut Salad');

fs.writeFileSync(p, JSON.stringify(recipes, null, 2) + '\n', 'utf8');
console.log(`\n✓ applied ${changes} fixes to ${recipes.length} recipes`);
