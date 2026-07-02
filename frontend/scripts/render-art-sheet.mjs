/**
 * Visual QA harness for the generated dish artwork + ingredient icons.
 *
 * Renders the REAL React components (MealPlate / IngredientIcon) with the REAL
 * shared/recipes.json + ingredients.json data to contact-sheet PNGs via
 * react-dom/server + the locally installed Chrome. Run from frontend/:
 *
 *   node scripts/render-art-sheet.mjs                          # all 204 dishes -> art-sheets/dishes-N.png
 *   node scripts/render-art-sheet.mjs --forms pasta-bowl,pizza-whole
 *   node scripts/render-art-sheet.mjs --slugs spaghetti-bolognese,margherita-pizza
 *   node scripts/render-art-sheet.mjs --icons                  # all ingredient icons
 *   node scripts/render-art-sheet.mjs --out C:/some/dir --chunk 24
 *
 * Requires puppeteer-core (npm i --no-save puppeteer-core) and Chrome at the
 * default Windows install path (override with CHROME env var).
 */
import { build } from 'esbuild';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { pathToFileURL } from 'url';
import path from 'path';

const argv = process.argv.slice(2);
const arg = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};
const has = (name) => argv.includes(`--${name}`);

const FRONTEND = path.resolve(import.meta.dirname, '..');
const OUT_DIR = arg('out') ?? path.join(FRONTEND, 'art-sheets');
const CHUNK = Number(arg('chunk') ?? 24);
const CHROME = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';

mkdirSync(OUT_DIR, { recursive: true });

// ---- bundle a tiny SSR entry that knows how to print the sheets ----
const ENTRY = `
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MealPlate } from './src/components/MealPlate';
import { IngredientIcon } from './src/lib/ingredientIcons';
import recipes from '../shared/recipes.json';
import ingredients from '../shared/ingredients.json';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

// Each renderToStaticMarkup call restarts React's useId counter, so every card
// gets the same gradient/clip ids — on a shared page the first def wins and all
// cards render with the same tint. Namespace every id per cell.
let uid = 0;
const uniquify = (svg) => {
  const n = 'u' + (uid++) + '-';
  return svg
    .replace(/id="([^"]+)"/g, (_, id) => 'id="' + n + id + '"')
    .replace(/url\(#([^)]+)\)/g, (_, id) => 'url(#' + n + id + ')')
    .replace(/href="#([^"]+)"/g, (_, id) => 'href="#' + n + id + '"');
};

export function dishSheets({ forms, slugs, chunk }) {
  let list = recipes;
  if (forms) list = list.filter((r) => forms.includes(r.dish_form));
  if (slugs) list = list.filter((r) => slugs.includes(r.slug));
  const cells = list.map((r) => {
    const big = uniquify(renderToStaticMarkup(React.createElement(MealPlate, { recipe: r, size: 240 })));
    const small = uniquify(renderToStaticMarkup(React.createElement(MealPlate, { recipe: r, size: 96 })));
    return '<div class="cell"><div class="art">' + big + small + '</div><div class="lbl">' + esc(r.slug) + ' · ' + esc(r.dish_form ?? '?') + '</div></div>';
  });
  const pages = [];
  for (let i = 0; i < cells.length; i += chunk) pages.push(wrap(cells.slice(i, i + chunk).join('')));
  return pages;
}

export function iconSheets({ chunk }) {
  const cells = ingredients.map((ing) => {
    const big = uniquify(renderToStaticMarkup(React.createElement(IngredientIcon, { id: ing.id, section: ing.section, size: 64 })));
    const small = uniquify(renderToStaticMarkup(React.createElement(IngredientIcon, { id: ing.id, section: ing.section, size: 28 })));
    return '<div class="cell icon"><div class="art">' + big + small + '</div><div class="lbl">' + esc(ing.id) + '</div></div>';
  });
  const pages = [];
  for (let i = 0; i < cells.length; i += chunk) pages.push(wrap(cells.slice(i, i + chunk).join('')));
  return pages;
}

function wrap(inner) {
  return '<!doctype html><html><head><meta charset="utf-8"><style>' +
    'body{background:#f7f1e8;margin:16px;font:12px/1.4 Consolas,monospace;color:#3f2410}' +
    '.grid{display:flex;flex-wrap:wrap;gap:14px}' +
    '.cell{width:352px}.cell.icon{width:120px}' +
    '.art{display:flex;align-items:flex-end;gap:8px}' +
    '.art svg{background:transparent}' +
    '.lbl{margin-top:4px;opacity:.75}' +
    '</style></head><body><div class="grid">' + inner + '</div></body></html>';
}
`;

const bundlePath = path.join(OUT_DIR, '_ssr-bundle.mjs');
await build({
  stdin: { contents: ENTRY, resolveDir: FRONTEND, loader: 'tsx' },
  bundle: true,
  format: 'esm',
  platform: 'node',
  jsx: 'automatic',
  outfile: bundlePath,
  logLevel: 'silent',
  loader: { '.json': 'json' },
  // react-dom/server pulls node builtins via CJS require — leave React to be
  // resolved at runtime from frontend/node_modules instead of bundling it.
  external: ['react', 'react-dom', 'react-dom/*', 'react/*'],
});

const ssr = await import(pathToFileURL(bundlePath).href + `?v=${Date.now()}`);

const forms = arg('forms')?.split(',').map((s) => s.trim());
const slugs = arg('slugs')?.split(',').map((s) => s.trim());
const pages = has('icons') ? ssr.iconSheets({ chunk: CHUNK * 3 }) : ssr.dishSheets({ forms, slugs, chunk: CHUNK });
const prefix = has('icons') ? 'icons' : 'dishes';

if (!pages.length) {
  console.error('Nothing matched the filter.');
  process.exit(1);
}

// ---- screenshot each page ----
const puppeteer = await import('puppeteer-core');
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1180, height: 900, deviceScaleFactor: 1.5 });
const outputs = [];
for (let i = 0; i < pages.length; i++) {
  const htmlPath = path.join(OUT_DIR, `_${prefix}-${i + 1}.html`);
  writeFileSync(htmlPath, pages[i]);
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle0' });
  const png = path.join(OUT_DIR, `${prefix}-${i + 1}.png`);
  await page.screenshot({ path: png, fullPage: true });
  outputs.push(png);
  rmSync(htmlPath);
}
await browser.close();
rmSync(bundlePath);
console.log(outputs.join('\n'));
