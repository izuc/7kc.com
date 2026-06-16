// Post-build: write a static dist/r/<slug>/index.html for every seeded recipe with
// per-page <title>/description/canonical/OG + Schema.org Recipe JSON-LD and crawlable
// content. The SPA still hydrates over it (createRoot replaces #root on mount). This is
// what makes the "500+ indexed recipe pages" SEO flywheel real — served by the static
// host, not PHP. Reads the seed JSON directly, so it needs no running backend (CI-safe).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const frontend = path.resolve(here, '..');
const repoRoot = path.resolve(frontend, '..');
const dist = path.join(frontend, 'dist');
const ORIGIN = (process.env.PUBLIC_WEB_ORIGIN || 'https://7kc.com').replace(/\/$/, '');

const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const recipes = JSON.parse(fs.readFileSync(path.join(repoRoot, 'shared', 'recipes.json'), 'utf8'));
const ingredients = JSON.parse(fs.readFileSync(path.join(repoRoot, 'shared', 'ingredients.json'), 'utf8'));
const displayById = Object.fromEntries(ingredients.map((i) => [i.id, i.display]));

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
const stepText = (s) => (typeof s === 'string' ? s : s?.content || '');

function pageFor(r) {
  const url = `${ORIGIN}/r/${r.slug}`;
  const title = `${r.title} — 7 Day Kitchen`;
  const desc = (r.description || '').slice(0, 160);
  const ingLines = r.ingredients.map((i) =>
    `${i.amount ? i.amount + ' ' : ''}${displayById[i.id] || i.id}`.trim()
  );

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: r.title,
    description: r.description,
    image: `${ORIGIN}/og-default.png`,
    recipeIngredient: ingLines,
    recipeInstructions: r.steps.map((s) => ({ '@type': 'HowToStep', text: stepText(s) })),
    recipeYield: `${r.servings} servings`,
    prepTime: `PT${r.prep_time}M`,
    cookTime: `PT${r.cook_time}M`,
    totalTime: `PT${r.prep_time + r.cook_time}M`,
    keywords: (r.tags || []).join(', '),
  };
  const jsonLd = JSON.stringify(schema).replace(/</g, '\\u003c');

  let html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(desc)}" />`)
    .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${esc(url)}" />`)
    .replace(/<meta property="og:type" content="[^"]*" \/>/, `<meta property="og:type" content="article" />`)
    .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${esc(r.title)}" />`)
    .replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${esc(desc)}" />`)
    .replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${esc(url)}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${esc(r.title)}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${esc(desc)}" />`);

  html = html.replace('</head>', `    <script type="application/ld+json">${jsonLd}</script>\n  </head>`);

  const staticContent =
    `<main class="screen recipe-detail" style="max-width:1100px;margin:0 auto;padding:32px 20px 80px">` +
    `<h1>${esc(r.title)}</h1><p class="lede">${esc(r.description)}</p>` +
    `<h2>Ingredients</h2><ul class="recipe-ings">${ingLines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>` +
    `<h2>Method</h2><ol>${r.steps.map((s) => `<li>${esc(stepText(s))}</li>`).join('')}</ol>` +
    `</main>`;
  html = html.replace('<div id="root"></div>', `<div id="root">${staticContent}</div>`);

  return html;
}

let n = 0;
for (const r of recipes) {
  if (!r.slug) continue;
  const dir = path.join(dist, 'r', r.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), pageFor(r));
  n++;
}
console.log(`prerendered ${n} recipe pages → dist/r/<slug>/index.html`);
