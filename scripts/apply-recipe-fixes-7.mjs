// Round-7 (culinary sweep): 21 chef-verified fixes. Adds the catalogue ingredients
// some dishes genuinely need, cooks the rice that was never cooked, adds raw-egg /
// ground-meat food-safety notes, and makes titles/descriptions match what's made.
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
const get = (s) => recipes.find((r) => r.slug === s);
let miss = 0;
const fail = (m) => { console.error('  ✗ ' + m); miss++; };

// ---- new catalogue ingredients ----
const NEW = [
  { id: 'fermented_black_bean', display: 'Fermented black beans', section: 'pantry', shelf_life_days: 730, aliases: ['fermented black beans', 'douchi', 'salted black beans'] },
  { id: 'gnocchi', display: 'Gnocchi', section: 'pantry', shelf_life_days: 120, aliases: ['gnocchi'] },
  { id: 'noodle_glass', display: 'Sweet potato glass noodles', section: 'pantry', shelf_life_days: 365, aliases: ['glass noodles', 'sweet potato noodles', 'dangmyeon'] },
  { id: 'chilli_flakes', display: 'Chilli flakes', section: 'pantry', shelf_life_days: 365, aliases: ['chilli flakes', 'chili flakes', 'red pepper flakes'] },
  { id: 'tomato_sauce', display: 'Tomato sauce', section: 'pantry', shelf_life_days: 365, aliases: ['tomato sauce'] },
];
for (const n of NEW) {
  if (!hasIng(n.id)) {
    ingredients.push({ id: n.id, display: n.display, section: n.section, shelf_life_days: n.shelf_life_days });
    for (const a of n.aliases) if (!(a in aliases)) aliases[a] = n.id;
    console.log(`  + ingredient ${n.id} (${n.display})`);
  }
}

// ---- helpers ----
const swap = (slug, from, to, amount) => { const r = get(slug); if (!r) return fail(slug); if (!hasIng(to)) return fail(`unknown ${to}`); const i = r.ingredients.find((x) => x.id === from); if (!i) return fail(`${slug}: no ${from}`); i.id = to; if (amount !== undefined) i.amount = amount; console.log(`  ${slug}: ${from} -> ${to} "${i.amount}"`); };
const add = (slug, id, amount) => { const r = get(slug); if (!r) return fail(slug); if (!hasIng(id)) return fail(`unknown ${id}`); if (r.ingredients.some((x) => x.id === id)) return fail(`${slug} already has ${id}`); r.ingredients.push({ id, amount }); console.log(`  ${slug}: + ${id} "${amount}"`); };
const setAmt = (slug, id, amount) => { const r = get(slug); if (!r) return fail(slug); const i = r.ingredients.find((x) => x.id === id); if (!i) return fail(`${slug}: no ${id}`); i.amount = amount; console.log(`  ${slug}: ${id} -> "${amount}"`); };
const setField = (slug, field, from, to) => { const r = get(slug); if (!r) return fail(slug); if (!(r[field] || '').includes(from)) return fail(`${slug}.${field}: not found "${from.slice(0, 30)}"`); r[field] = r[field].replace(from, to); console.log(`  ${slug}.${field}: "${from.slice(0, 24)}" -> "${to.slice(0, 24)}"`); };
const editStep = (slug, idx, field, from, to) => { const r = get(slug); if (!r) return fail(slug); const s = r.steps[idx]; if (!s) return fail(`${slug}: no step ${idx}`); if (!(s[field] || '').includes(from)) return fail(`${slug}[${idx}].${field}: not found "${from.slice(0, 30)}"`); s[field] = s[field].replace(from, to); console.log(`  ${slug}[${idx}].${field} edited`); };
const appendDetail = (slug, idx, text) => { const r = get(slug); if (!r) return fail(slug); const s = r.steps[idx]; if (!s) return fail(`${slug}: no step ${idx}`); if ((s.detail || '').includes(text.trim().slice(0, 20))) return; s.detail = (s.detail || '') + text; console.log(`  ${slug}[${idx}] caveat appended`); };
const unshiftStep = (slug, step) => { const r = get(slug); if (!r) return fail(slug); if (r.steps[0] && /cook the rice/i.test(r.steps[0].content)) return fail(`${slug}: already has cook-rice`); r.steps.unshift(step); console.log(`  ${slug}: + cook-rice step at [0]`); };

const RICE15 = { content: 'Cook the rice.', detail: 'Rinse 1.5 cups jasmine rice until the water runs clear, then drain. Tip into a pot with 2.25 cups water (1 part rice to 1.5 water), lid on, bring to a boil, then drop to the lowest heat for 12 min. Off the heat, still covered, 5 min more, then fluff with a fork. Start this first so it’s hot and ready when everything else is.', timer_seconds: 720 };
const RICE2 = (after) => ({ content: 'Cook the rice.', detail: `Rinse 2 cups jasmine rice until the water runs clear. Pot with 3 cups water, bring to a boil, cover, drop to the lowest heat for 12 min, then rest covered 5 min and fluff with a fork. Start this first so it’s hot ${after}.`, timer_seconds: 720 });
const RAW_EGG = ' Note: this contains raw egg — use very fresh or pasteurised eggs, and skip it for anyone pregnant, very young, elderly or immunocompromised.';

// ---------------- ingredient corrections ----------------
swap('black-bean-beef', 'tinned_black_bean', 'fermented_black_bean', '2 tbsp');
swap('gnocchi-pomodoro', 'potato', 'gnocchi', '500 g');
swap('tofu-japchae', 'noodle_egg', 'noodle_glass', '200 g');
swap('smashed-avo-toast', 'chilli_powder', 'chilli_flakes', 'pinch');
setAmt('chicken-shawarma', 'garlic', '6 cloves');          // 4 marinade + 2 sauce
add('bbq-snag-sanga', 'tomato_sauce', 'to serve');
add('moroccan-lamb', 'couscous', '2 cups');

// ---------------- cook the rice that was never cooked ----------------
unshiftStep('korean-beef-bowl', RICE15);
unshiftStep('green-thai-curry', RICE2('to serve under the curry'));
unshiftStep('satay-skewers', RICE2('when the skewers come off'));

// ---------------- food safety ----------------
appendDetail('tiramisu', get('tiramisu').steps.length - 1, RAW_EGG);
appendDetail('chocolate-mousse', get('chocolate-mousse').steps.length - 1, RAW_EGG);
editStep('lamb-kofta', 4, 'detail',
  'Turn once. 4 min per side for pink in the middle, 5 for medium. They should feel firm but still give a little.',
  'Turn once and cook about 5 min a side, until firm and no longer pink in the centre — ground lamb should be cooked through, not left rare.');

// ---------------- method / step corrections ----------------
editStep('black-bean-beef', 1, 'content', 'Mash half the black beans, rinse the rest.', 'Chop the fermented black beans.');
editStep('black-bean-beef', 1, 'detail',
  "Tip the tin into a sieve and rinse off the brine — it's heavily salted. Mash about half with a fork into a rough paste and leave the rest whole: the paste melts into the sauce for savoury depth, the whole beans give little salty pops. This 'black bean sauce' is the heart of the dish.",
  "Roughly chop the fermented black beans (a quick rinse only if they're very salty — don't wash the flavour away). They're intensely savoury and funky, so a couple of tablespoons melts into the sauce and gives the dish its signature salty-deep umami. This is the heart of the dish.");
editStep('pancakes', 0, 'detail', '1.5 cups plain flour, 2 tbsp sugar, pinch of salt.', '1.5 cups plain flour, 2 tsp baking powder, 2 tbsp sugar, pinch of salt.');
editStep('chicken-caesar-salad', 4, 'detail', 'Dressing (anchovy, garlic, dijon, lemon, oil, parmesan, yolk)', 'Dressing (anchovy, garlic, dijon, lemon, oil, parmesan)');
editStep('tofu-japchae', 1, 'detail', 'Boil the egg noodles to just tender', 'Boil the glass noodles to just tender');
editStep('eggplant-curry', 5, 'detail', 'dollop of yoghurt.', 'dollop of yoghurt (use coconut yoghurt to keep it vegan).');

// ---------------- title / description match what's made ----------------
setField('falafel-bowl', 'title', 'Falafel Bowl with Tahini', 'Falafel Bowl with Garlic Yoghurt');
setField('chicken-tagine', 'description', 'Saffron-scented chicken, lemon, olives, apricots.', 'Spiced chicken, lemon, olives.');
setField('greek-lamb-souva', 'description', 'Skewers, tzatziki, warm bread.', 'Grilled lamb cutlets, tzatziki, warm bread.');
setField('fish-tacos', 'description', 'Flaky barramundi, cabbage slaw, lime crema.', 'Flaky barramundi, lettuce slaw, lime crema.');
setField('paella', 'description', 'Saffron rice, crusty socarrat bottom', 'Golden turmeric & paprika rice, crusty socarrat bottom');

fs.writeFileSync(ingPath, JSON.stringify(ingredients, null, 2) + '\n', 'utf8');
fs.writeFileSync(aliasPath, JSON.stringify(aliases, null, 2) + '\n', 'utf8');
fs.writeFileSync(recPath, JSON.stringify(recipes, null, 2) + '\n', 'utf8');
console.log(`\n${miss ? '⚠ ' + miss + ' MISS' : '✓ all targets hit'} | ingredients ${ingredients.length}, recipes ${recipes.length}`);
