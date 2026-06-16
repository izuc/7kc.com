// Round-6: the id<->amount-text product mismatches (sweep 3 + a deterministic
// scan of all 204). Recipes had been reusing a placeholder id and "correcting"
// it in the amount text, so the shopping list / pantry-match showed the wrong
// product. Fix: add the real ingredients to the catalogue and repoint.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ingPath = path.join(root, 'shared', 'ingredients.json');
const aliasPath = path.join(root, 'shared', 'aliases.json');
const recPath = path.join(root, 'shared', 'recipes.json');
const ingredients = JSON.parse(fs.readFileSync(ingPath, 'utf8'));
const aliases = JSON.parse(fs.readFileSync(aliasPath, 'utf8'));
const recipes = JSON.parse(fs.readFileSync(recPath, 'utf8'));
const hasIng = (id) => ingredients.some((i) => i.id === id);
const get = (slug) => recipes.find((r) => r.slug === slug);
let miss = 0;
const fail = (m) => { console.error('  ✗ ' + m); miss++; };

const NEW = [
  { id: 'vinegar_rice', display: 'Rice vinegar', section: 'pantry', shelf_life_days: 730, aliases: ['rice vinegar'] },
  { id: 'vinegar_red_wine', display: 'Red wine vinegar', section: 'pantry', shelf_life_days: 730, aliases: ['red wine vinegar', 'red-wine vinegar'] },
  { id: 'vinegar_cider', display: 'Apple cider vinegar', section: 'pantry', shelf_life_days: 730, aliases: ['apple cider vinegar', 'cider vinegar'] },
  { id: 'blue_cheese', display: 'Blue cheese', section: 'dairy', shelf_life_days: 30, aliases: ['blue cheese', 'gorgonzola'] },
  { id: 'rice_paper', display: 'Rice paper wrappers', section: 'pantry', shelf_life_days: 365, aliases: ['rice paper', 'rice paper wrappers'] },
  { id: 'biscuit_sweet', display: 'Sweet biscuits', section: 'pantry', shelf_life_days: 180, aliases: ['sweet biscuits', 'digestives', 'graham crackers'] },
  { id: 'pasta_linguine', display: 'Linguine', section: 'pantry', shelf_life_days: 365, aliases: ['linguine'] },
  { id: 'flour_self_raising', display: 'Self-raising flour', section: 'pantry', shelf_life_days: 365, aliases: ['self-raising flour', 'self raising flour'] },
];
for (const n of NEW) {
  if (!hasIng(n.id)) {
    ingredients.push({ id: n.id, display: n.display, section: n.section, shelf_life_days: n.shelf_life_days });
    for (const a of n.aliases) if (!(a in aliases)) aliases[a] = n.id;
    console.log(`  + ingredient ${n.id} (${n.display})`);
  }
}

// repoint a recipe ingredient from one id to another, setting a clean amount
const repoint = (slug, fromId, toId, amount) => {
  const r = get(slug); if (!r) return fail(`no recipe ${slug}`);
  if (!hasIng(toId)) return fail(`unknown ingredient ${toId}`);
  const i = r.ingredients.find((x) => x.id === fromId); if (!i) return fail(`${slug}: no ${fromId}`);
  i.id = toId; if (amount !== undefined) i.amount = amount;
  console.log(`  ${slug}: ${fromId} -> ${toId} "${i.amount}"`);
};
const setDisplay = (id, display) => {
  const i = ingredients.find((x) => x.id === id); if (!i) return fail(`no ingredient ${id}`);
  const old = i.display; i.display = display; console.log(`  catalogue: ${id} display "${old}" -> "${display}"`);
};
const editStep = (slug, idx, field, from, to) => {
  const r = get(slug); if (!r) return fail(`no recipe ${slug}`);
  const s = r.steps[idx]; if (!s) return fail(`${slug}: no step ${idx}`);
  const cur = s[field] || '';
  if (!cur.includes(from)) return fail(`${slug}[${idx}].${field}: not found "${from.slice(0, 30)}"`);
  s[field] = cur.replace(from, to); console.log(`  ${slug}[${idx}].${field}: "${from.slice(0, 24)}" -> "${to.slice(0, 24)}"`);
};
const setAmt = (slug, id, amount) => {
  const r = get(slug); if (!r) return fail(`no recipe ${slug}`);
  const i = r.ingredients.find((x) => x.id === id); if (!i) return fail(`${slug}: no ${id}`);
  i.amount = amount; console.log(`  ${slug}: ${id} amount -> "${amount}"`);
};

// ---- vinegars: the catalogue only had balsamic + white; recipes smuggled the
// real type in the amount text. Give each its own product. ----
repoint('gyoza', 'vinegar_balsamic', 'vinegar_rice', '2 tbsp');
repoint('kung-pao-chicken', 'vinegar_balsamic', 'vinegar_rice', '2 tbsp');
repoint('honey-soy-wings', 'vinegar_balsamic', 'vinegar_rice', '1 tbsp');
repoint('chimichurri-steak', 'vinegar_balsamic', 'vinegar_red_wine', '2 tbsp');
repoint('nicoise-salad', 'vinegar_balsamic', 'vinegar_red_wine', '2 tbsp');
repoint('cobb-salad', 'vinegar_balsamic', 'vinegar_red_wine', '3 tbsp');
repoint('coleslaw', 'vinegar_balsamic', 'vinegar_cider', '2 tbsp');

// ---- wrong-product ids ----
repoint('mongolian-beef', 'flour', 'cornflour', '3 tbsp');          // crisp coating
repoint('mongolian-beef', 'honey', 'brown_sugar', '1/4 cup');       // sauce sugar
repoint('cobb-salad', 'feta', 'blue_cheese', '100 g (or feta)');    // cobb is blue cheese
repoint('buffalo-wings', 'brie', 'blue_cheese', '50 g');            // blue-cheese dip
repoint('summer-rolls', 'flour', 'rice_paper', '12 sheets');        // rice paper, not flour
repoint('nyc-cheesecake', 'breadcrumbs', 'biscuit_sweet', '200 g (crushed to crumbs)'); // sweet biscuit base
repoint('prawn-linguine', 'spaghetti', 'pasta_linguine', '200 g');  // it's named linguine
repoint('damper', 'flour', 'flour_self_raising', '3 cups');         // self-raising is the leavening
repoint('lamingtons', 'flour', 'flour_self_raising', '2 cups');     // self-raising sponge

// ---- catalogue display fix ----
setDisplay('coffee', 'Coffee (ground or brewed)'); // was "Coffee beans"; tiramisu needs brewed

// ---- step prose ----
editStep('prawn-linguine', 0, 'detail', 'Cook spaghetti', 'Cook linguine');
editStep('chicken-tagine', 5, 'detail', 'an equal amount of hot stock', 'an equal amount of boiling water'); // the 500ml stock is spent on the braise
editStep('lemon-delicious', 1, 'detail', 'Sift in 1/2 cup self-raising flour.', 'Sift in 1/2 cup plain flour.'); // egg whites give the lift
editStep('sticky-date-pudding', 2, 'detail', 'Sift in 1.5 cups self-raising flour and 1 tsp baking powder.', 'Sift in 1.5 cups plain flour and 2 tsp baking powder.');
setAmt('sticky-date-pudding', 'baking_powder', '2 tsp + 1 tsp bicarb'); // match the corrected step

fs.writeFileSync(ingPath, JSON.stringify(ingredients, null, 2) + '\n', 'utf8');
fs.writeFileSync(aliasPath, JSON.stringify(aliases, null, 2) + '\n', 'utf8');
fs.writeFileSync(recPath, JSON.stringify(recipes, null, 2) + '\n', 'utf8');
console.log(`\n${miss ? '⚠ ' + miss + ' MISS' : '✓ all targets hit'} | ingredients ${ingredients.length}, recipes ${recipes.length}`);
