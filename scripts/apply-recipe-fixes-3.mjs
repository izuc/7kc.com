// Add the handful of ingredients the catalogue was missing (so risottos/pies/etc.
// can be authentic) and finish the recipe-quality fixes.
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
const has = (id) => ingredients.some((i) => i.id === id);
const get = (slug) => recipes.find((r) => r.slug === slug);

// --- new ingredients ---
const NEW = [
  { id: 'rice_arborio', display: 'Arborio rice', section: 'pantry', shelf_life_days: 365, aliases: ['arborio', 'arborio rice', 'risotto rice'] },
  { id: 'pastry_shortcrust', display: 'Shortcrust pastry', section: 'frozen', shelf_life_days: 120, aliases: ['shortcrust', 'shortcrust pastry'] },
  { id: 'coconut_desiccated', display: 'Desiccated coconut', section: 'pantry', shelf_life_days: 180, aliases: ['desiccated coconut', 'shredded coconut'] },
  { id: 'icing_sugar', display: 'Icing sugar', section: 'pantry', shelf_life_days: 730, aliases: ['icing sugar', 'powdered sugar', 'confectioners sugar'] },
  { id: 'meringue', display: 'Meringue nests', section: 'pantry', shelf_life_days: 90, aliases: ['meringue', 'meringue nests'] },
  { id: 'marshmallow', display: 'Marshmallows', section: 'pantry', shelf_life_days: 240, aliases: ['marshmallow', 'marshmallows'] },
];
for (const n of NEW) {
  if (!has(n.id)) {
    ingredients.push({ id: n.id, display: n.display, section: n.section, shelf_life_days: n.shelf_life_days });
    for (const a of n.aliases) aliases[a] = n.id;
    console.log(`  + ingredient ${n.id} (${n.display})`);
  }
}

// --- use them ---
const swap = (slug, from, to, amount) => {
  const r = get(slug); if (!r) return;
  const i = r.ingredients.find((x) => x.id === from); if (!i) return console.error(`  ✗ ${slug}: no ${from}`);
  i.id = to; if (amount) i.amount = amount;
  console.log(`  ${slug}: ${from} -> ${to}`);
};
const add = (slug, id, amount, optional) => {
  const r = get(slug); if (!r) return;
  if (r.ingredients.some((x) => x.id === id)) return;
  const o = { id, amount }; if (optional) o.is_optional = true;
  r.ingredients.push(o);
  console.log(`  ${slug}: + ${id} "${amount}"`);
};
const retag = (slug, from, to) => {
  const r = get(slug); if (!r) return;
  r.tags = r.tags.map((t) => (t === from ? to : t)).filter((t, idx, a) => a.indexOf(t) === idx);
  console.log(`  ${slug}: tag ${from} -> ${to}`);
};
const removeIng = (slug, id) => {
  const r = get(slug); if (!r) return;
  r.ingredients = r.ingredients.filter((x) => x.id !== id);
  console.log(`  ${slug}: - ${id}`);
};

swap('pumpkin-risotto', 'rice_jasmine', 'rice_arborio', '1.5 cups');
swap('mushroom-risotto', 'rice_jasmine', 'rice_arborio', '1.5 cups');
swap('quiche-lorraine', 'pastry_puff', 'pastry_shortcrust', '1 sheet');
swap('apple-pie', 'pastry_puff', 'pastry_shortcrust', '2 sheets');
add('lamingtons', 'coconut_desiccated', '2 cups');
add('lamingtons', 'icing_sugar', '3 cups');
add('carrot-cake', 'icing_sugar', '2 cups (for the icing)');
swap('eton-mess', 'bread', 'meringue', '6 nests');
add('rocky-road', 'marshmallow', '2 cups');
add('pesto-pasta', 'pine_nut', '1/3 cup'); // a proper pesto

// --- last 2 diet-tag contradictions (cosmetic; diet is derived from ingredients) ---
retag('falafel-bowl', 'vegan', 'vegetarian'); // contains yoghurt
removeIng('aglio-e-olio', 'parmesan');        // classic aglio e olio is cheeseless → genuinely vegan

fs.writeFileSync(ingPath, JSON.stringify(ingredients, null, 2) + '\n', 'utf8');
fs.writeFileSync(aliasPath, JSON.stringify(aliases, null, 2) + '\n', 'utf8');
fs.writeFileSync(recPath, JSON.stringify(recipes, null, 2) + '\n', 'utf8');
console.log(`\n✓ ingredients ${ingredients.length}, recipes ${recipes.length}`);
