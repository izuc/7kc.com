// One-shot tool: derive each recipe's `dish_form` token MECHANICALLY from the
// existing slug→artwork registry in frontend/src/lib/dishArtwork.tsx and inject it
// into shared/recipes.json (so the artwork form becomes data-driven, not a code map).
// Re-runnable: it overwrites dish_form from the registry every time.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const full = fs.readFileSync(path.join(root, 'frontend', 'src', 'lib', 'dishArtwork.tsx'), 'utf8');
// Only the slug→template registry, not the FORM_TEMPLATES token map above it.
const start = full.indexOf('const RECIPE_ARTWORK');
const artwork = start >= 0 ? full.slice(start, full.indexOf('};', start)) : full;
const recipesPath = path.join(root, 'shared', 'recipes.json');
const recipes = JSON.parse(fs.readFileSync(recipesPath, 'utf8'));

const TOKEN = {
  PastaBowl: 'pasta-bowl', CurryBowl: 'curry-bowl', SoupBowl: 'soup-bowl', SaladPlate: 'salad-plate',
  SandwichStack: 'sandwich-stack', Tacos: 'tacos', StirFry: 'stir-fry', FriedRice: 'fried-rice',
  RoastChicken: 'roast-chicken', RoastPlate: 'roast-plate', Risotto: 'risotto', Shakshuka: 'shakshuka',
  EggBrunch: 'egg-brunch', Pancakes: 'pancakes', BakedSlice: 'baked-slice', Skewers: 'skewers',
  GrainBowl: 'grain-bowl', DipPlate: 'dip-plate', FishChips: 'fish-chips', DefaultPlate: 'default-plate',
};

// Recipes with no registry entry (render DefaultPlate today) — give them a real, sensible form.
const EXPLICIT = { 'prawn-pad-thai': 'pasta-bowl' };

// Parse the RECIPE_ARTWORK block: 'slug': (p) => <Component ... protein="x" ... />
const slugForm = {};
const re = /'([a-z0-9-]+)':\s*\(p\)\s*=>\s*<(\w+)([^>]*)\/>/g;
let m;
while ((m = re.exec(artwork)) !== null) {
  const [, slug, comp, rest] = m;
  const base = TOKEN[comp];
  if (!base) {
    console.error(`Unknown template component "${comp}" for slug "${slug}"`);
    process.exit(2);
  }
  const protein = /protein="(\w+)"/.exec(rest);
  slugForm[slug] = comp === 'RoastPlate' && protein ? `${base}-${protein[1]}` : base;
}

const counts = {};
let unmapped = 0;
const out = recipes.map((r) => {
  const form = slugForm[r.slug] ?? EXPLICIT[r.slug];
  if (!form) {
    console.error(`  ✗ no dish_form for "${r.slug}" (not in registry, no explicit fallback)`);
    unmapped++;
  }
  counts[form ?? '(none)'] = (counts[form ?? '(none)'] || 0) + 1;
  // Insert dish_form right after palette for a tidy diff.
  const rebuilt = {};
  for (const [k, v] of Object.entries(r)) {
    if (k === 'dish_form') continue; // re-derive
    rebuilt[k] = v;
    if (k === 'palette') rebuilt.dish_form = form;
  }
  if (!('dish_form' in rebuilt)) rebuilt.dish_form = form;
  return rebuilt;
});

// Registry slugs that aren't real recipes (stale entries).
const slugs = new Set(recipes.map((r) => r.slug));
for (const s of Object.keys(slugForm)) if (!slugs.has(s)) console.error(`  ⚠ registry slug "${s}" not in recipes.json`);

console.log(`Forms assigned across ${out.length} recipes:`);
for (const [f, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)}  ${f}`);
if (unmapped > 0) { console.error(`\n${unmapped} recipe(s) with no dish_form — aborting.`); process.exit(1); }

fs.writeFileSync(recipesPath, JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log(`\n✓ wrote dish_form into ${recipesPath}`);
