// Round-7: the 9 confirmed issues from sweep 4 (fresh dimensions — tags, time
// claims, internal quantity contradictions). All pure metadata/text, no new ids.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const recPath = path.join(root, 'shared', 'recipes.json');
const recipes = JSON.parse(fs.readFileSync(recPath, 'utf8'));
const get = (slug) => recipes.find((r) => r.slug === slug);
let miss = 0;
const fail = (m) => { console.error('  ✗ ' + m); miss++; };

const setCook = (slug, v) => { const r = get(slug); if (!r) return fail(slug); r.cook_time = v; console.log(`  ${slug}: cook_time -> ${v}`); };
const setAmt = (slug, id, amount) => { const r = get(slug); if (!r) return fail(slug); const i = r.ingredients.find((x) => x.id === id); if (!i) return fail(`${slug}: no ${id}`); i.amount = amount; console.log(`  ${slug}: ${id} -> "${amount}"`); };
const dropTag = (slug, tag) => { const r = get(slug); if (!r) return fail(slug); if (!r.tags.includes(tag)) return fail(`${slug}: no tag ${tag}`); r.tags = r.tags.filter((t) => t !== tag); console.log(`  ${slug}: - tag ${tag}  -> [${r.tags.join(',')}]`); };
const editDesc = (slug, from, to) => { const r = get(slug); if (!r) return fail(slug); if (!r.description.includes(from)) return fail(`${slug} desc: not found "${from}"`); r.description = r.description.replace(from, to); console.log(`  ${slug}: desc "${from}" -> "${to.slice(0, 28)}"`); };
const editStep = (slug, idx, field, from, to) => { const r = get(slug); if (!r) return fail(slug); const s = r.steps[idx]; if (!s) return fail(`${slug}: no step ${idx}`); if (!(s[field] || '').includes(from)) return fail(`${slug}[${idx}].${field}: not found "${from.slice(0, 24)}"`); s[field] = s[field].replace(from, to); console.log(`  ${slug}[${idx}].${field}: "${from.slice(0, 22)}" -> "${to.slice(0, 22)}"`); };

// time claims that don't match the steps
setCook('chorizo-pasta', 20);                          // steps sum to ~19.5 min
editDesc('chorizo-pasta', 'twelve minutes', 'twenty minutes');
editDesc('roast-grape-ricotta-toast', 'takes ten minutes', 'ready in about 25 minutes, mostly hands-off');

// wrong tags
dropTag('smoked-salmon-bagel', 'no-cook');             // toasts the bagels (cook_time 3)
dropTag('summer-rolls', 'no-cook');                    // cooks the noodles (cook_time 5)
dropTag('beef-stir-fry', 'one-pot');                   // pot for noodles + wok

// internal quantity / copy contradictions
setAmt('eggs-benedict', 'eggs', '6');                  // 2 yolks hollandaise + 4 to poach (4 stacks)
setAmt('scallops-peas', 'scallop', '6');              // plating says 3 per person x 2 servings
editStep('satay-skewers', 2, 'content', 'Brush half over skewers', 'Brush a third over skewers'); // detail reserves 2/3
editDesc('banana-bread', 'brown butter', 'soft butter'); // method creams soft butter, never browns it

fs.writeFileSync(recPath, JSON.stringify(recipes, null, 2) + '\n', 'utf8');
console.log(`\n${miss ? '⚠ ' + miss + ' MISS' : '✓ all targets hit'} | recipes ${recipes.length}`);
