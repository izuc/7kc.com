// Round-4 recipe QA: the 36 adversarially-confirmed method<->ingredient issues.
// Adds 8 catalogue ingredients the recipes genuinely needed, then reconciles
// ingredient lists, amounts, tags and step prose. Every op logs if its target
// isn't found so a silent miss can't slip through.
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

// ---------------- new catalogue ingredients ----------------
const NEW = [
  { id: 'anchovy', display: 'Anchovy fillets', section: 'pantry', shelf_life_days: 365, aliases: ['anchovy', 'anchovies', 'anchovy fillets'] },
  { id: 'dates', display: 'Pitted dates', section: 'pantry', shelf_life_days: 365, aliases: ['dates', 'medjool dates', 'pitted dates'] },
  { id: 'pork_ribs', display: 'Pork ribs', section: 'meat', shelf_life_days: 4, aliases: ['pork ribs', 'pork rib'] },
  { id: 'cornflour', display: 'Cornflour', section: 'pantry', shelf_life_days: 730, aliases: ['cornflour', 'corn flour', 'cornstarch'] },
  { id: 'peanut', display: 'Roasted peanuts', section: 'pantry', shelf_life_days: 180, aliases: ['peanuts', 'roasted peanuts'] },
  { id: 'nutmeg', display: 'Nutmeg', section: 'pantry', shelf_life_days: 1095, aliases: ['nutmeg'] },
  { id: 'brown_sugar', display: 'Brown sugar', section: 'pantry', shelf_life_days: 730, aliases: ['brown sugar'] },
  { id: 'vinegar_white', display: 'White vinegar', section: 'pantry', shelf_life_days: 1825, aliases: ['white vinegar'] },
];
for (const n of NEW) {
  if (!hasIng(n.id)) {
    ingredients.push({ id: n.id, display: n.display, section: n.section, shelf_life_days: n.shelf_life_days });
    for (const a of n.aliases) if (!(a in aliases)) aliases[a] = n.id;
    console.log(`  + ingredient ${n.id} (${n.display})`);
  }
}

// ---------------- helpers ----------------
const add = (slug, id, amount, optional) => {
  const r = get(slug); if (!r) return fail(`no recipe ${slug}`);
  if (!hasIng(id)) return fail(`${slug}: unknown ingredient ${id}`);
  if (r.ingredients.some((x) => x.id === id)) return;
  const o = { id, amount }; if (optional) o.is_optional = true;
  r.ingredients.push(o);
  console.log(`  ${slug}: + ${id} "${amount}"`);
};
const swap = (slug, from, to, amount) => {
  const r = get(slug); if (!r) return fail(`no recipe ${slug}`);
  if (!hasIng(to)) return fail(`${slug}: unknown ingredient ${to}`);
  const i = r.ingredients.find((x) => x.id === from); if (!i) return fail(`${slug}: no ${from} to swap`);
  i.id = to; if (amount) i.amount = amount;
  console.log(`  ${slug}: ${from} -> ${to}`);
};
const setAmt = (slug, id, amount) => {
  const r = get(slug); if (!r) return fail(`no recipe ${slug}`);
  const i = r.ingredients.find((x) => x.id === id); if (!i) return fail(`${slug}: no ${id}`);
  i.amount = amount; console.log(`  ${slug}: ${id} amount -> "${amount}"`);
};
const dropTag = (slug, tag) => {
  const r = get(slug); if (!r) return fail(`no recipe ${slug}`);
  if (!r.tags.includes(tag)) return fail(`${slug}: no tag ${tag}`);
  r.tags = r.tags.filter((t) => t !== tag); console.log(`  ${slug}: - tag ${tag}`);
};
const setCook = (slug, v) => { const r = get(slug); if (!r) return fail(`no recipe ${slug}`); r.cook_time = v; console.log(`  ${slug}: cook_time -> ${v}`); };
const edit = (slug, idx, field, from, to) => {
  const r = get(slug); if (!r) return fail(`no recipe ${slug}`);
  const s = r.steps[idx]; if (!s) return fail(`${slug}: no step ${idx}`);
  const cur = s[field] || '';
  if (!cur.includes(from)) return fail(`${slug}[${idx}].${field}: substring not found: "${from.slice(0, 40)}"`);
  s[field] = cur.replace(from, to); console.log(`  ${slug}[${idx}].${field}: "${from.slice(0, 28)}" -> "${to.slice(0, 28)}"`);
};

// ---------------- missing ingredients ----------------
add('chicken-caesar-salad', 'anchovy', '4 fillets');
add('minestrone', 'celery', '2 stalks');
add('minestrone', 'garlic', '2 cloves');
add('eggplant-parma', 'garlic', '2 cloves');
add('greek-lamb-souva', 'tomato', '1');
add('greek-lamb-souva', 'onion_red', '1/2');
add('chicken-parma', 'garlic', '2 cloves');
add('stir-fry-beef', 'spring_onion', '2');
add('poached-eggs', 'vinegar_white', 'splash (for poaching)', true);
add('pork-banh-mi', 'vinegar_white', '1/3 cup');
add('pork-banh-mi', 'sugar', '2 tbsp');
add('apple-crumble', 'brown_sugar', '1/2 cup');
add('tofu-stir-fry', 'cornflour', '3 tbsp');
add('san-choy-bow', 'lime', '1');
add('bread-butter-pudding', 'nutmeg', 'whole, to grate');
add('kung-pao-chicken', 'peanut', '1/3 cup roasted, unsalted');

// ---------------- ingredient swaps ----------------
swap('pork-ribs', 'pork_belly', 'pork_ribs', '2 kg');
swap('eggs-benedict', 'vinegar_balsamic', 'vinegar_white', 'splash (for poaching)');
swap('sticky-date-pudding', 'raisin', 'dates', '250 g');

// ---------------- amount corrections ----------------
setAmt('lamb-kofta', 'garlic', '5 cloves');             // 3 for kofta + 2 for tzatziki
setAmt('lamingtons', 'icing_sugar', '2 cups');          // only 2 cups used in glaze
setAmt('welsh-rarebit', 'worcestershire', '1 tsp (vegetarian)');
setAmt('zucchini-bread', 'baking_powder', '1 tsp + 1/2 tsp bicarb');
setAmt('sticky-date-pudding', 'baking_powder', '1 tsp + 1 tsp bicarb');
setAmt('sticky-date-pudding', 'butter', '245 g (125 g pudding + 120 g sauce)');
setAmt('sticky-date-pudding', 'sugar', '2 cups brown sugar (1 pudding + 1 sauce)');
setAmt('sticky-date-pudding', 'cream', '300 ml thickened (for sauce), plus extra to serve');

// ---------------- metadata ----------------
setCook('bbq-snag-sanga', 20);   // 20-min onion caramelise is the limiting step
dropTag('veggie-wrap', 'no-cook'); // grilling haloumi is cooking
setCook('veggie-wrap', 5);

// ---------------- step prose (ASCII-safe match substrings) ----------------
edit('sausage-pasta-bake', 5, 'content', 'min at 200', 'min at 220'); // matches detail's 220C
edit('banana-bread', 2, 'detail', 'Sift in 2 cups of self-raising flour and 1 tsp cinnamon.', 'Sift in 2 cups of plain flour, the 2 tsp baking powder and 1 tsp cinnamon.');
edit('pancakes', 0, 'detail', '1.5 cups self-raising flour', '1.5 cups plain flour'); // keeps the listed baking powder valid
edit('pancakes-fluffy', 0, 'detail', 'The bicarb is activated by the buttermilk acids later', "The baking powder lifts once it hits the wet ingredients and the pan's heat");
edit('choc-chip-cookies', 2, 'content', 'Fold in flour, bicarb, pinch of salt.', 'Fold in flour, baking powder, pinch of salt.');
edit('choc-chip-cookies', 2, 'detail', '1 tsp bicarb', '1 tsp baking powder');
edit('lentil-bolognese', 2, 'detail', 'at the end rounds the edges', 'at the end (plant milk or olive oil to keep it vegan) rounds the edges');
edit('meat-pie', 3, 'detail', 'one sheet of shortcrust pastry to line', 'one sheet of puff pastry to line');
edit('meat-pie', 3, 'detail', 'Lay a second sheet of pastry on top (puff pastry traditionally for a flaky lid).', 'Lay the second sheet of puff pastry on top for a flaky lid.');
edit('kung-pao-chicken', 5, 'detail', 'scatter green parts of spring onion.', 'scatter green parts of spring onion and the roasted peanuts.');
edit('rocky-road', 2, 'detail', '(traditional pink marshmallows also work)', ', and 2 cups marshmallows (pink ones are traditional)');
edit('pho', 6, 'detail', 'bean sprouts, sliced chilli, lime wedges.', 'bean sprouts, sliced chilli, sliced spring onion, lime wedges.');
edit('pulled-pork', 4, 'content', 'Shred with forks, toss in pan juices.', 'Braise 4 hr at 150C, low and slow.');
edit('pulled-pork', 5, 'content', 'Shred cabbage and carrot, dress with mayo and vinegar for slaw.', 'Shred pork with forks, toss in reduced juices.');
edit('pulled-pork', 6, 'content', 'Stack pork in rolls, pile slaw on top.', 'Make slaw, stack pork in rolls.');
edit('satay-skewers', 3, 'content', 'Grill 5 min a side.', 'Grill ~8 min, turning every 2 min.');
edit('honey-soy-wings', 5, 'detail', 'sprinkle of sesame seeds. Immediately.', 'sprinkle of sesame seeds if you have them. Immediately.');
edit('sticky-date-pudding', 0, 'content', 'Soak raisins', 'Soak dates');
edit('sticky-date-pudding', 0, 'detail', 'Pit raisins', 'Pit the dates');
edit('sticky-date-pudding', 0, 'detail', 'down the raisins', 'down the dates');

fs.writeFileSync(ingPath, JSON.stringify(ingredients, null, 2) + '\n', 'utf8');
fs.writeFileSync(aliasPath, JSON.stringify(aliases, null, 2) + '\n', 'utf8');
fs.writeFileSync(recPath, JSON.stringify(recipes, null, 2) + '\n', 'utf8');
console.log(`\n${miss ? '⚠ ' + miss + ' MISS' : '✓ all targets hit'} | ingredients ${ingredients.length}, recipes ${recipes.length}`);
