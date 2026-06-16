// CI data-quality check: flag recipes whose hand-set diet tag contradicts the
// diet derived from their ingredients (e.g. a "vegetarian" recipe with bacon).
// The app derives diet flags from ingredients, so these tags are cosmetic — but
// surfacing the contradictions keeps the seed data honest.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const recipes = JSON.parse(fs.readFileSync(path.join(root, 'shared', 'recipes.json'), 'utf8'));
const ingredients = JSON.parse(fs.readFileSync(path.join(root, 'shared', 'ingredients.json'), 'utf8'));
const sectionById = Object.fromEntries(ingredients.map((i) => [i.id, i.section]));

const GLUTEN = new Set(['flour', 'pasta', 'spaghetti', 'bread', 'breadcrumbs', 'soy_sauce', 'couscous', 'tortilla', 'noodles']);
const isMeat = (id) => sectionById[id] === 'meat';
const isDairy = (id) => sectionById[id] === 'dairy';

let issues = 0;
for (const r of recipes) {
  const ids = (r.ingredients || []).map((i) => i.id);
  const tags = r.tags || [];
  const derived = {
    vegetarian: !ids.some(isMeat),
    vegan: !ids.some(isMeat) && !ids.some(isDairy) && !ids.includes('eggs') && !ids.includes('honey'),
    'gluten-free': !ids.some((id) => GLUTEN.has(id)),
  };
  const offenders = {
    vegetarian: (id) => isMeat(id),
    vegan: (id) => isMeat(id) || isDairy(id) || id === 'eggs' || id === 'honey',
    'gluten-free': (id) => GLUTEN.has(id),
  };
  for (const tag of ['vegetarian', 'vegan', 'gluten-free']) {
    if (tags.includes(tag) && !derived[tag]) {
      console.log(`  ✗ "${r.slug}" tagged "${tag}" but contains: ${ids.filter(offenders[tag]).join(', ')}`);
      issues++;
    }
  }
}

console.log(issues === 0 ? '✓ no diet tag/ingredient contradictions' : `\n${issues} diet tag contradiction(s) found`);
process.exit(issues === 0 ? 0 : 1);
