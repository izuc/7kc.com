// Round-5: the 6 residual issues from the confirmation sweep. All reuse existing
// catalogue ids (incl. ones added in round 4), so no new ingredients needed.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const recPath = path.join(root, 'shared', 'recipes.json');
const ingredients = JSON.parse(fs.readFileSync(path.join(root, 'shared', 'ingredients.json'), 'utf8'));
const recipes = JSON.parse(fs.readFileSync(recPath, 'utf8'));
const hasIng = (id) => ingredients.some((i) => i.id === id);
const get = (slug) => recipes.find((r) => r.slug === slug);
let miss = 0;
const fail = (m) => { console.error('  ✗ ' + m); miss++; };

const add = (slug, id, amount, optional) => {
  const r = get(slug); if (!r) return fail(`no recipe ${slug}`);
  if (!hasIng(id)) return fail(`unknown ingredient ${id}`);
  if (r.ingredients.some((x) => x.id === id)) return fail(`${slug} already has ${id}`);
  const o = { id, amount }; if (optional) o.is_optional = true;
  r.ingredients.push(o); console.log(`  ${slug}: + ${id} "${amount}"`);
};
const swap = (slug, from, to) => {
  const r = get(slug); if (!r) return fail(`no recipe ${slug}`);
  if (!hasIng(to)) return fail(`unknown ingredient ${to}`);
  const i = r.ingredients.find((x) => x.id === from); if (!i) return fail(`${slug}: no ${from}`);
  i.id = to; console.log(`  ${slug}: ${from} -> ${to} (amount kept: "${i.amount}")`);
};
const setAmt = (slug, id, amount) => {
  const r = get(slug); if (!r) return fail(`no recipe ${slug}`);
  const i = r.ingredients.find((x) => x.id === id); if (!i) return fail(`${slug}: no ${id}`);
  i.amount = amount; console.log(`  ${slug}: ${id} amount -> "${amount}"`);
};
const editField = (slug, idx, field, from, to) => {
  const r = get(slug); if (!r) return fail(`no recipe ${slug}`);
  const obj = idx === null ? r : r.steps[idx];
  if (!obj) return fail(`${slug}: no step ${idx}`);
  const cur = obj[field] || '';
  if (!cur.includes(from)) return fail(`${slug} ${field}: not found "${from.slice(0, 30)}"`);
  obj[field] = cur.replace(from, to);
  console.log(`  ${slug}${idx === null ? '' : '[' + idx + ']'}.${field}: "${from.slice(0, 24)}" -> "${to.slice(0, 24)}"`);
};

setAmt('lemon-tart', 'eggs', '4 + 2 yolks');         // pastry 1 yolk + filling 4 whole + 1 yolk
swap('paella', 'rice_jasmine', 'rice_arborio');      // short-grain; steps say "arborio works"
swap('buffalo-wings', 'vinegar_balsamic', 'vinegar_white'); // sharp white vinegar, not sweet balsamic
add('thai-beef-salad', 'sugar', '1 tsp');            // the "sweet" leg of the dressing balance
add('prawn-pad-thai', 'peanut', '2 tbsp, chopped', true); // the scatter-garnish (peanut_butter is the sauce)
// rocky-road: stir-in + description name the listed `strawberry`, not unlisted cherries; also fix stray space
editField('rocky-road', 2, 'detail', 'cherries , and 2 cups', 'strawberries, and 2 cups');
editField('rocky-road', null, 'description', 'cherries,', 'strawberries,');

fs.writeFileSync(recPath, JSON.stringify(recipes, null, 2) + '\n', 'utf8');
console.log(`\n${miss ? '⚠ ' + miss + ' MISS' : '✓ all targets hit'} | recipes ${recipes.length}`);
