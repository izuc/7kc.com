// CI data-quality gate for the recipe catalogue. Hard-fails (exit 1) on structural
// problems; warns (exit 0) on orphan ingredients. Node built-ins only — the CI data
// job has no npm install.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const recipes = JSON.parse(fs.readFileSync(path.join(root, 'shared', 'recipes.json'), 'utf8'));
const ingredients = JSON.parse(fs.readFileSync(path.join(root, 'shared', 'ingredients.json'), 'utf8'));

const ingredientIds = new Set(ingredients.map((i) => i.id));

// Derive the valid dish_form tokens from the template sources so the data and
// the art never drift: the union of every dishArt/forms/*.tsx family registry
// (v2) and — while it still exists during the migration — the legacy
// FORM_TEMPLATES map in dishArtwork.tsx. Registry entries look like
// `'token': (p) =>` in both systems.
const DISH_FORMS = new Set();
const collectTokens = (src) => {
  for (const m of src.matchAll(/['"]?([a-z][a-z0-9-]*)['"]?\s*:\s*\(p\)\s*=>/g)) DISH_FORMS.add(m[1]);
};
const formsDir = path.join(root, 'frontend', 'src', 'lib', 'dishArt', 'forms');
for (const f of fs.readdirSync(formsDir)) {
  if (f.endsWith('.tsx')) collectTokens(fs.readFileSync(path.join(formsDir, f), 'utf8'));
}
const legacyPath = path.join(root, 'frontend', 'src', 'lib', 'dishArtwork.tsx');
if (fs.existsSync(legacyPath)) {
  const artwork = fs.readFileSync(legacyPath, 'utf8');
  const formsStart = artwork.indexOf('const FORM_TEMPLATES');
  if (formsStart >= 0) collectTokens(artwork.slice(formsStart, artwork.indexOf('};', formsStart)));
}
if (DISH_FORMS.size === 0) {
  console.error('could not derive any dish_form tokens from the template sources');
  process.exit(2);
}

const HEX = /^#[0-9a-fA-F]{6}$/;
const stepText = (s) => (typeof s === 'string' ? s : (s && s.content) || '');

let errors = 0;
let warnings = 0;
const err = (msg) => { console.log('  ✗ ' + msg); errors++; };
const used = new Set();
const seenSlugs = new Set();

for (const r of recipes) {
  const slug = r.slug || '(no slug)';

  if (!r.slug) err('a recipe is missing its slug');
  else if (seenSlugs.has(r.slug)) err(`duplicate slug "${r.slug}"`);
  else seenSlugs.add(r.slug);

  // palette: 2+ valid hex colours
  if (!Array.isArray(r.palette) || r.palette.length < 2 || !r.palette.every((c) => HEX.test(c))) {
    err(`"${slug}" has an invalid palette: ${JSON.stringify(r.palette)}`);
  }

  // dish_form present + in the allowed set
  if (!r.dish_form) err(`"${slug}" is missing dish_form`);
  else if (!DISH_FORMS.has(r.dish_form)) err(`"${slug}" has unknown dish_form "${r.dish_form}"`);

  // ingredients: must be a non-empty array, each referencing a known id
  if (!Array.isArray(r.ingredients) || r.ingredients.length === 0) {
    err(`"${slug}" has no ingredients`);
  } else {
    for (const ing of r.ingredients) {
      const id = ing && (ing.id ?? ing.ingredient_id);
      if (!id) { err(`"${slug}" has an ingredient with no id`); continue; }
      used.add(id);
      if (!ingredientIds.has(id)) err(`"${slug}" references unknown ingredient "${id}"`);
    }
  }

  // at least one non-blank step
  const steps = r.steps || [];
  if (!Array.isArray(steps) || steps.length === 0 || !steps.some((s) => stepText(s).trim())) {
    err(`"${slug}" has no usable steps`);
  }

  // ---- guided-cooking layer (required on the seeded catalogue) ----
  const recipeIngIds = new Set((r.ingredients || []).map((i) => i && (i.id ?? i.ingredient_id)).filter(Boolean));

  if (!['easy', 'medium', 'hard'].includes(r.difficulty)) {
    err(`"${slug}" has invalid difficulty "${r.difficulty}"`);
  }
  if (!Array.isArray(r.equipment) || r.equipment.length === 0 || r.equipment.length > 8
    || !r.equipment.every((e) => typeof e === 'string' && e.trim())) {
    err(`"${slug}" needs 1–8 non-empty equipment strings`);
  }
  if (typeof r.storage !== 'string' || !r.storage.trim()) {
    err(`"${slug}" is missing storage guidance`);
  }
  for (const key of ['make_ahead', 'leftovers']) {
    if (key in r && r[key] !== null && (typeof r[key] !== 'string' || !r[key].trim())) {
      err(`"${slug}" has a blank ${key} (use null or omit instead)`);
    }
  }
  for (const s of r.substitutions || []) {
    if (!s || typeof s.swap !== 'string' || !s.swap.trim()) err(`"${slug}" has a substitution with no swap text`);
    else if (!recipeIngIds.has(s.ingredient_id)) {
      err(`"${slug}" substitution references "${s.ingredient_id}" which is not in the recipe`);
    }
  }
  for (const [i, s] of steps.entries()) {
    if (typeof s === 'string') { err(`"${slug}" step ${i + 1} is a bare string (guided steps must be objects)`); continue; }
    if (typeof s.title !== 'string' || !s.title.trim() || s.title.length > 80) {
      err(`"${slug}" step ${i + 1} needs a title (≤80 chars)`);
    }
    if ('timer_seconds' in s && s.timer_seconds !== null
      && (!Number.isInteger(s.timer_seconds) || s.timer_seconds < 30 || s.timer_seconds > 14400)) {
      err(`"${slug}" step ${i + 1} has implausible timer_seconds ${s.timer_seconds}`);
    }
    for (const key of ['tips', 'warnings']) {
      const v = s[key];
      if (v === undefined) continue;
      if (!Array.isArray(v) || v.length > 2 || !v.every((t) => typeof t === 'string' && t.trim() && t.length <= 200)) {
        err(`"${slug}" step ${i + 1} has invalid ${key} (array of ≤2 strings, each ≤200 chars)`);
      }
    }
    if (!Array.isArray(s.ingredient_ids)) {
      err(`"${slug}" step ${i + 1} is missing ingredient_ids (empty array is fine)`);
    } else {
      for (const id of s.ingredient_ids) {
        if (!recipeIngIds.has(id)) err(`"${slug}" step ${i + 1} uses "${id}" which is not in the recipe`);
      }
    }
  }
}

// Orphan ingredients (in the dictionary, used by no recipe) — warning only.
const orphans = ingredients.map((i) => i.id).filter((id) => !used.has(id));
if (orphans.length) {
  warnings += orphans.length;
  console.log(`  ⚠ ${orphans.length} orphan ingredient(s) used by no recipe: ${orphans.join(', ')}`);
}

console.log(
  errors === 0
    ? `✓ ${recipes.length} recipes valid${warnings ? ` (${warnings} warning(s))` : ''}`
    : `\n${errors} error(s), ${warnings} warning(s)`
);
process.exit(errors === 0 ? 0 : 1);
