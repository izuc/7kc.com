// Targeted culinary fixes for the two lamb recipes flagged with a cut↔method mismatch.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const p = path.join(root, 'shared', 'recipes.json');
const recipes = JSON.parse(fs.readFileSync(p, 'utf8'));
const get = (slug) => recipes.find((r) => r.slug === slug);

// --- moroccan-lamb: lamb cutlets can't be cubed & braised to shredding → make it
// a proper lamb-mince tagine (brown, simmer, reduce). Add raisins for the sweet note. ---
{
  const r = get('moroccan-lamb');
  const lamb = r.ingredients.find((i) => i.id === 'lamb_cutlet');
  if (lamb) { lamb.id = 'lamb_mince'; lamb.amount = '750 g'; }
  if (!r.ingredients.some((i) => i.id === 'raisin')) {
    r.ingredients.splice(2, 0, { id: 'raisin', amount: '1/3 cup', is_optional: true });
  }
  r.cook_time = 50;
  if (/apricot/i.test(r.description)) r.description = r.description.replace(/,?\s*apricots?/i, '');
  r.steps[0] = {
    content: 'Brown the lamb mince.',
    detail:
      'Heat a glug of oil in a heavy pot until shimmering. Add the lamb mince and let it brown properly in batches, breaking up the clumps with a spoon — crowding the pot steams the meat instead of colouring it, and that deep brown crust is where the flavour comes from. Season with salt and pepper, then tip each batch out and set aside.',
  };
  r.steps[2] = {
    content: 'Return lamb, add tomato, chickpeas, raisins, stock.',
    detail:
      'Lamb and any juices back in. Tip in a tin of tomatoes (crush with your hand), a tin of drained chickpeas, the raisins for a gentle sweetness, and 500 ml chicken stock. Stir and scrape the base so nothing catches.',
  };
  r.steps[3] = {
    content: 'Simmer 35 min, lid off the last 10.',
    detail:
      'Bring to a gentle simmer, lid on, on the lowest heat for 25 min so the spices marry into the mince. Then lid off, nudge the heat up, and reduce for 10 min to a thick, glossy sauce that clings. Taste for salt — slow-cooked spice often needs a final pinch.',
    timer_seconds: 2100,
  };
  console.log('  ✓ moroccan-lamb: lamb_mince tagine, reworded brown/simmer steps, +raisins');
}

// --- greek-lamb-souva: don't cube thin lamb cutlets — grill them whole, souva-style. ---
{
  const r = get('greek-lamb-souva');
  r.steps[0] = {
    content: 'Marinate the lamb in oil, lemon and oregano.',
    detail:
      'Lamb cutlets are quick-cooking chops, so skip the cubing — just trim any heavy fat and toss them in a bowl with a glug of oil, the juice of half a lemon, the oregano, salt and pepper. Let them sit while you make the tzatziki; even 15 min of marinating lifts them.',
  };
  r.steps[2] = {
    content: 'Grill the cutlets 6 min.',
    detail:
      'BBQ or griddle pan blazing hot, oil the grills. Lay the cutlets on and don’t move them for 2–3 min so a proper char forms. Flip once and give another 2–3 min for blushing pink in the middle. Rest a couple of minutes before serving — they keep cooking off the heat.',
    timer_seconds: 360,
  };
  if (r.steps[3]?.detail) {
    r.steps[3].detail = r.steps[3].detail.replace('slide lamb off the skewers on top', 'lay the grilled cutlets on top');
  }
  console.log('  ✓ greek-lamb-souva: grill cutlets whole (no cubing/skewering)');
}

fs.writeFileSync(p, JSON.stringify(recipes, null, 2) + '\n', 'utf8');
console.log('done');
