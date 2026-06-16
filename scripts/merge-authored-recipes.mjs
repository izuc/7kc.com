// One-off: merge workflow-authored recipes into shared/recipes.json, accepting ONLY
// those that pass strict checks (valid ingredient ids, valid dish_form, unique slug,
// 2-hex palette, has ingredients+steps). Usage: node scripts/merge-authored-recipes.mjs <workflow-output.json>
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outPath = process.argv[2];
if (!outPath) { console.error('pass the workflow output json path'); process.exit(2); }

const wf = JSON.parse(fs.readFileSync(outPath, 'utf8'));
const batches = wf.result?.batches ?? wf.batches ?? [];
const candidates = batches.flatMap((b) => b?.recipes ?? []);

const recipes = JSON.parse(fs.readFileSync(path.join(root, 'shared', 'recipes.json'), 'utf8'));
const ingredients = JSON.parse(fs.readFileSync(path.join(root, 'shared', 'ingredients.json'), 'utf8'));
const ingredientIds = new Set(ingredients.map((i) => i.id));

const artwork = fs.readFileSync(path.join(root, 'frontend', 'src', 'lib', 'dishArtwork.tsx'), 'utf8');
const fb = artwork.slice(artwork.indexOf('const FORM_TEMPLATES'), artwork.indexOf('};', artwork.indexOf('const FORM_TEMPLATES')));
const DISH_FORMS = new Set([...fb.matchAll(/['"]?([a-z][a-z-]*)['"]?\s*:\s*\(p\)\s*=>/g)].map((m) => m[1]));

const HEX = /^#[0-9a-fA-F]{6}$/;
const existing = new Set(recipes.map((r) => r.slug));
const accepted = [];
const rejected = [];

for (const r of candidates) {
  const problems = [];
  if (!r.slug || existing.has(r.slug)) problems.push(`slug "${r.slug}" missing/duplicate`);
  if (!Array.isArray(r.palette) || r.palette.length !== 2 || !r.palette.every((c) => HEX.test(c))) problems.push('bad palette');
  if (!r.dish_form || !DISH_FORMS.has(r.dish_form)) problems.push(`bad dish_form "${r.dish_form}"`);
  if (!Array.isArray(r.ingredients) || r.ingredients.length < 3) problems.push('too few ingredients');
  else {
    const bad = r.ingredients.map((i) => i.id).filter((id) => !ingredientIds.has(id));
    if (bad.length) problems.push(`unknown ingredient ids: ${bad.join(', ')}`);
  }
  if (!Array.isArray(r.steps) || r.steps.length < 3) problems.push('too few steps');

  if (problems.length) { rejected.push({ slug: r.slug, problems }); continue; }

  existing.add(r.slug);
  // Normalize to the catalogue shape + field order.
  accepted.push({
    slug: r.slug,
    title: r.title,
    description: r.description,
    prep_time: r.prep_time,
    cook_time: r.cook_time,
    servings: r.servings,
    tags: r.tags ?? [],
    palette: r.palette,
    dish_form: r.dish_form,
    ingredients: r.ingredients.map((i) => {
      const o = { id: i.id, amount: i.amount };
      if (i.is_optional) o.is_optional = true;
      return o;
    }),
    steps: r.steps.map((s) => {
      const o = { content: s.content, detail: s.detail };
      if (typeof s.timer_seconds === 'number' && s.timer_seconds > 0) o.timer_seconds = s.timer_seconds;
      return o;
    }),
  });
}

console.log(`Candidates: ${candidates.length} | accepted: ${accepted.length} | rejected: ${rejected.length}`);
for (const r of rejected) console.log(`  ✗ ${r.slug}: ${r.problems.join('; ')}`);
console.log('\nAccepted:');
for (const r of accepted) console.log(`  ✓ ${r.slug} (${r.dish_form}, ${r.ingredients.length} ing, ${r.steps.length} steps)`);

if (accepted.length) {
  fs.writeFileSync(path.join(root, 'shared', 'recipes.json'), JSON.stringify([...recipes, ...accepted], null, 2) + '\n', 'utf8');
  console.log(`\n✓ recipes.json: ${recipes.length} → ${recipes.length + accepted.length}`);
}
