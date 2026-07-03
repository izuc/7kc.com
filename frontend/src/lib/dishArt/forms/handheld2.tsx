import { ReactNode } from 'react';
import { INK, SW, BREAD_CRUST, BREAD_CRUMB, HERB_GREEN, SIMPLIFY_BELOW } from '../tokens';
import { lighten, darken, mix } from '../palette';
import { CardWash, SidePlate, BoardRound, Gloss, CrumbScatter } from '../primitives';
import { ToppingScatter, stampFor } from '../toppings';
import { rngFor } from '../seed';
import { DishProps, DishTemplate } from '../types';

/**
 * Handheld family #2 — burgers, wraps, rolls, toasts, bagels, lettuce cups.
 * Side-view stacks port the dirA burger reference (docs/art-exploration/
 * direction-svgs.json): flat silhouettes, one warm-ink outline, one lighter
 * offset highlight per element, toppings tucked INTO the food.
 */

// Fixed archetype food colours (like PASTA_GOLD in bowls.tsx)
const LETTUCE = '#7cb342';
const LETTUCE_PALE = '#c9e5a2';
const CHEESE = '#f6b53c';
const TOMATO = '#dc2626';
const TOMATO_LIGHT = '#f06a4a';
const PATTY = '#6f3c1c';
const PATTY_LIGHT = '#8a5028';
const SESAME = '#fdf0d8';
const TORTILLA = '#f0d9a8';
const TORTILLA_LINE = '#d4ac6e';
const CREAM_CHEESE = '#fffaf0';
const RICE_PAPER = '#f8efdc';

/** Hand-placed ingredient stamp (same transform recipe as ToppingScatter). */
function stamp(id: string, x: number, y: number, s: number, rot: number, v: number, key: string): ReactNode {
  const st = stampFor(id);
  if (!st) return null;
  return (
    <g key={key} transform={`translate(${x - s / 2} ${y - s / 2}) rotate(${rot} ${s / 2} ${s / 2}) scale(${s / 100})`}>
      {st.draw(v)}
    </g>
  );
}

/** Parametric elliptical arc as a polyline (for cut-face swirls). */
function earc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, steps = 14): string {
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = ((a0 + ((a1 - a0) * i) / steps) * Math.PI) / 180;
    pts.push(`${i ? 'L' : 'M'}${(cx + Math.cos(a) * rx).toFixed(1)},${(cy + Math.sin(a) * ry).toFixed(1)}`);
  }
  return pts.join(' ');
}

/** Organic blob path (toast topping masses) — 8 anchors around (cx,cy). */
function blob(cx: number, cy: number, r: number): string {
  return [
    `M${cx + r},${cy - r * 0.1}`,
    `C${cx + r * 1.02},${cy + r * 0.4} ${cx + r * 0.66},${cy + r * 0.86} ${cx + r * 0.16},${cy + r * 0.94}`,
    `C${cx - r * 0.36},${cy + r * 1.02} ${cx - r * 0.86},${cy + r * 0.68} ${cx - r * 0.96},${cy + r * 0.2}`,
    `C${cx - r * 1.06},${cy - r * 0.3} ${cx - r * 0.7},${cy - r * 0.84} ${cx - r * 0.16},${cy - r * 0.92}`,
    `C${cx + r * 0.4},${cy - r * 1.0} ${cx + r * 0.96},${cy - r * 0.6} ${cx + r},${cy - r * 0.1} Z`,
  ].join(' ');
}

/* ------------------------------------------------------------------ */
/* burger-stack — the dirA best-loved card, ported exactly            */
/* ------------------------------------------------------------------ */

export function BurgerStack({ tones, slug, size }: DishProps) {
  const rnd = rngFor(slug + ':burger');
  const simplified = size < SIMPLIFY_BELOW;
  const bunLight = lighten(tones.food, 0.16);

  // sesame seeds: reference layout with seeded jitter
  const seedBase: [number, number, number][] = [
    [146, 172, -18], [186, 158, -6], [228, 160, 10], [264, 176, 22],
    [206, 186, 4], [124, 192, -26], [286, 196, 30],
  ];
  const seeds = seedBase.slice(0, simplified ? 4 : 7).map(([x, y, r], i) => (
    <ellipse
      key={i}
      cx={x + (rnd() - 0.5) * 9}
      cy={y + (rnd() - 0.5) * 7}
      rx={7} ry={4.5}
      transform={`rotate(${r + Math.floor((rnd() - 0.5) * 16)} ${x} ${y})`}
    />
  ));

  return (
    <>
      <CardWash tones={tones} />
      <SidePlate tones={tones} cy={326} rx={146} ry={30} />
      {/* bottom bun */}
      <path d="M94,318 L94,300 Q94,286 110,286 L290,286 Q306,286 306,300 L306,318 Q306,322 302,322 L98,322 Q94,322 94,318 Z" fill={tones.tint} stroke={INK} strokeWidth={SW.macro} />
      {!simplified && <path d="M108,298 Q108,292 118,292 L198,292" fill="none" stroke={tones.highlight} strokeWidth={7} strokeLinecap="round" />}
      {/* patty */}
      <rect x={86} y={248} width={228} height={42} rx={21} fill={PATTY} stroke={INK} strokeWidth={SW.macro} />
      {!simplified && <path d="M104,264 Q108,256 120,256 L236,256" fill="none" stroke={PATTY_LIGHT} strokeWidth={9} strokeLinecap="round" />}
      {/* cheese drape with hanging drips */}
      <path d="M84,242 L316,242 L316,254 L296,254 L296,284 Q296,294 288,294 Q280,294 280,284 L280,254 L232,254 L232,274 Q232,284 224,284 Q216,284 216,274 L216,254 L148,254 L148,292 Q148,302 140,302 Q132,302 132,292 L132,254 L84,254 Z" fill={CHEESE} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
      {/* tomato band */}
      <rect x={100} y={222} width={200} height={22} rx={10} fill={TOMATO} stroke={INK} strokeWidth={5.5} />
      {!simplified && <path d="M112,232 L262,232" stroke={TOMATO_LIGHT} strokeWidth={6} strokeLinecap="round" />}
      {/* lettuce ruffle — wider than the buns */}
      <path d="M72,212 Q78,192 96,200 Q102,184 120,192 Q128,176 146,186 Q156,172 172,182 Q184,170 198,180 Q212,170 226,180 Q240,172 252,184 Q266,176 276,190 Q292,184 300,198 Q316,196 322,212 Q328,226 314,226 L86,226 Q70,226 72,212 Z" fill={LETTUCE} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
      {/* sesame dome with sheen crescent */}
      <path d="M84,202 Q84,132 200,132 Q316,132 316,202 L316,204 Q316,212 306,212 L94,212 Q84,212 84,204 Z" fill={tones.food} stroke={INK} strokeWidth={SW.macro} />
      <path d="M106,166 Q132,146 172,142" fill="none" stroke={bunLight} strokeWidth={11} strokeLinecap="round" />
      <g fill={SESAME} stroke={INK} strokeWidth={3.5}>{seeds}</g>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* wrap-roll — cut wrap halves, spiral filling cross-section          */
/* ------------------------------------------------------------------ */

function WrapHalf({ tones, L, rnd, mirror }: { tones: DishProps['tones']; L: number; rnd: () => number; mirror: boolean }) {
  const r = 56;
  const f1 = -L * 0.3 + rnd() * 24;
  const sw0 = -80 - rnd() * 30;
  return (
    <g transform={mirror ? 'scale(-1 1)' : undefined}>
      {/* body — closed round end left, cut end right */}
      <path
        d={`M${L},${-r} L${-L + 60},${-r} Q${-L},${-r} ${-L},0 Q${-L},${r} ${-L + 60},${r} L${L},${r} Z`}
        fill={TORTILLA} stroke={INK} strokeWidth={SW.macro} strokeLinejoin="round"
      />
      {/* wrapper seam + toasted blush */}
      <path d={`M${f1},${-r + 8} Q${f1 - 16},0 ${f1},${r - 8}`} fill="none" stroke={TORTILLA_LINE} strokeWidth={5} strokeLinecap="round" />
      <path d={`M${f1 + (L - f1) * 0.55},${r - 14} Q${f1 + (L - f1) * 0.3},${r - 4} ${f1 - 20},${r - 12}`} fill="none" stroke={TORTILLA_LINE} strokeWidth={7} strokeLinecap="round" opacity={0.7} />
      <path d={`M${-L + 46},${-r + 14} Q${-L + 100},${-r + 4} ${-L + 160},${-r + 12}`} fill="none" stroke="#fbf0d4" strokeWidth={8} strokeLinecap="round" />
      {/* cut face + spiral filling */}
      <ellipse cx={L} cy={0} rx={30} ry={r} fill={BREAD_CRUMB} stroke={INK} strokeWidth={SW.macro} />
      <path d={earc(L, 0, 19, 42, sw0, sw0 + 255)} fill="none" stroke={tones.food} strokeWidth={13} strokeLinecap="round" />
      <path d={earc(L, 2, 9, 21, sw0 + 140, sw0 + 335)} fill="none" stroke={HERB_GREEN} strokeWidth={8} strokeLinecap="round" />
      <circle cx={L} cy={2} r={5} fill={tones.shade} />
    </g>
  );
}

export function WrapRoll({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':wrap');
  const simplified = size < SIMPLIFY_BELOW;
  const rotA = 9 + (rnd() - 0.5) * 6;
  const rotB = -7 + (rnd() - 0.5) * 6;
  // small garnish docked on the clear front-right of the plate
  const spill = simplified ? [] : toppingIds.slice(0, 2).map((id, i) =>
    stamp(id, 294 + i * 28 + (rnd() - 0.5) * 10, 284 + i * 6 + (rnd() - 0.5) * 6, 22, (rnd() - 0.5) * 60, rnd(), `s${i}`)
  );
  return (
    <>
      <CardWash tones={tones} />
      <SidePlate tones={tones} cy={302} rx={152} ry={30} />
      {/* back half — cut face to the right */}
      <g transform={`translate(188 146) rotate(${rotA})`}>
        <WrapHalf tones={tones} L={140} rnd={rnd} mirror={false} />
      </g>
      {/* front half — mirrored so its cut face looks left */}
      <g transform={`translate(212 244) rotate(${rotB})`}>
        <WrapHalf tones={tones} L={144} rnd={rnd} mirror />
      </g>
      {spill}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* baguette-roll — split crusty roll, filling ribbon poking out       */
/* ------------------------------------------------------------------ */

export function BaguetteRoll({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':baguette');
  const simplified = size < SIMPLIFY_BELOW;
  const rot = -9 + (rnd() - 0.5) * 4;

  // filling ruffle — rounded scallops poking above the split line
  const bumps: string[] = [`M-142,18`];
  const n = 6;
  for (let i = 0; i < n; i++) {
    const x0 = -140 + (i * 280) / n;
    const x1 = Math.min(-140 + ((i + 1) * 280) / n, 140);
    const peak = -18 - rnd() * 10;
    bumps.push(`Q${x0 + 8},${peak} ${(x0 + x1) / 2},${peak + 3}`);
    bumps.push(`Q${x1 - 8},${peak + 1} ${x1},${8}`);
  }
  bumps.push('L140,18 Z');

  // green herb bumps peeking near the ends (lid dips lower at centre)
  const herbs = (simplified ? [-96, 102] : [-112, -78, 88, 118]).map((hx, i) => (
    <circle key={i} cx={hx + (rnd() - 0.5) * 14} cy={-14 - rnd() * 6} r={10 + rnd() * 3} fill={HERB_GREEN} stroke={INK} strokeWidth={4.5} />
  ));

  // score slashes on the lid
  const scores = (simplified ? [-60, 30] : [-78, -10, 58]).map((x, i) => (
    <path key={i} d={`M${x - 16},${-40 - rnd() * 4} Q${x + 2},${-52} ${x + 20},${-38}`} fill="none" stroke={BREAD_CRUMB} strokeWidth={7} strokeLinecap="round" />
  ));

  return (
    <>
      <CardWash tones={tones} />
      <SidePlate tones={tones} cy={308} rx={152} ry={28} />
      <g transform={`translate(200 242) rotate(${rot})`}>
        {/* bottom half */}
        <path d="M-150,-4 C-146,26 -110,44 0,44 C110,44 146,26 150,-4 L150,-8 L-150,-8 Z" fill={lighten(BREAD_CRUST, 0.1)} stroke={INK} strokeWidth={SW.macro} strokeLinejoin="round" />
        {/* filling ribbon */}
        <path d={bumps.join(' ')} fill={tones.food} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
        {herbs}
        {/* top half — crusty lid with scores + sheen */}
        <path d="M-150,-6 C-146,-36 -108,-58 0,-58 C108,-58 146,-36 150,-6 Q150,2 140,0 C100,-10 60,-14 0,-14 C-60,-14 -100,-10 -140,0 Q-150,2 -150,-6 Z" fill={BREAD_CRUST} stroke={INK} strokeWidth={SW.macro} strokeLinejoin="round" />
        {scores}
        {!simplified && <path d="M-116,-32 Q-72,-52 -12,-54" fill="none" stroke={lighten(BREAD_CRUST, 0.16)} strokeWidth={9} strokeLinecap="round" />}
      </g>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* toast-open — top-down slices, topping mass in tones.food           */
/* ------------------------------------------------------------------ */

function ToastSlice({ tones, slug, toppingIds, cx, cy, rot, simplified, seedKey, rnd }: {
  tones: DishProps['tones']; slug: string; toppingIds: string[];
  cx: number; cy: number; rot: number; simplified: boolean; seedKey: string; rnd: () => number;
}) {
  const w = 148;
  const massR = 52 + rnd() * 8;
  const massRot = Math.floor(rnd() * 360);
  const mx = cx + (rnd() - 0.5) * 10;
  const my = cy + (rnd() - 0.5) * 10;
  return (
    <g transform={`rotate(${rot} ${cx} ${cy})`}>
      <rect x={cx - w / 2 + 4} y={cy - w / 2 + 7} width={w} height={w} rx={30} fill={tones.shadow} />
      <rect x={cx - w / 2} y={cy - w / 2} width={w} height={w} rx={30} fill={BREAD_CRUST} stroke={INK} strokeWidth={SW.macro} />
      <rect x={cx - w / 2 + 13} y={cy - w / 2 + 13} width={w - 26} height={w - 26} rx={20} fill={BREAD_CRUMB} />
      <g transform={`rotate(${massRot} ${mx} ${my})`}>
        <path d={blob(mx, my, massR)} fill={tones.food} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
      </g>
      <Gloss cx={mx} cy={my} rx={massR * 0.76} ry={massR * 0.62} tint={tones.tint} />
      <ToppingScatter slug={slug + seedKey} ids={toppingIds} cx={mx} cy={my} clipR={massR * 0.72} rimR={0} size={27} simplified={simplified} />
    </g>
  );
}

export function ToastOpen({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':toast');
  const simplified = size < SIMPLIFY_BELOW;
  const rotA = -9 + rnd() * 6;
  const rotB = 4 + rnd() * 6;
  return (
    <>
      <CardWash tones={tones} />
      <BoardRound tones={tones} />
      <ToastSlice tones={tones} slug={slug} toppingIds={toppingIds} cx={146} cy={150} rot={rotA} simplified={simplified} seedKey="#a" rnd={rnd} />
      <ToastSlice tones={tones} slug={slug} toppingIds={toppingIds} cx={256} cy={258} rot={rotB} simplified={simplified} seedKey="#b" rnd={rnd} />
      {!simplified && <CrumbScatter seedKey={slug + ':toastcrumb'} cx={272} cy={126} rx={38} ry={24} n={5} color="#b97f3c" />}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* bagel-stack — seeded dome with dimple, cream + filling ribbons     */
/* ------------------------------------------------------------------ */

export function BagelStack({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':bagel');
  const simplified = size < SIMPLIFY_BELOW;
  const bagel = '#d99b4e';
  const bagelLight = lighten(bagel, 0.16);

  // sesame/poppy seeds on the dome (skip the centre dimple)
  const nSeeds = simplified ? 5 : 9;
  const seeds: ReactNode[] = [];
  for (let i = 0; i < nSeeds; i++) {
    const a = (192 + (i * 156) / (nSeeds - 1) + (rnd() - 0.5) * 9) * (Math.PI / 180);
    const deg = (a * 180) / Math.PI;
    if (deg > 260 && deg < 280) continue; // dimple gap
    const x = 200 + Math.cos(a) * (72 + rnd() * 20);
    const y = 226 + Math.sin(a) * (54 + rnd() * 14);
    seeds.push(
      <ellipse key={i} cx={x} cy={y} rx={6.5} ry={4} transform={`rotate(${Math.floor((rnd() - 0.5) * 70)} ${x} ${y})`} />
    );
  }

  // cream-cheese scalloped edge
  const cream: string[] = ['M92,236 L308,236 L308,244'];
  for (let i = 0; i < 6; i++) {
    const x0 = 300 - i * 35;
    cream.push(`Q${x0 - 17},${272 + (i % 2) * 7 + rnd() * 5} ${Math.max(x0 - 35, 92)},${250}`);
  }
  cream.push('L92,244 Z');

  // filling ribbon (smoked salmon / whatever tones.food is) — wavy
  const fill: string[] = ['M96,248 L304,248 L304,256'];
  for (let i = 0; i < 5; i++) {
    const x0 = 296 - i * 40;
    fill.push(`Q${x0 - 20},${284 + rnd() * 6} ${Math.max(x0 - 40, 96)},${258}`);
  }
  fill.push('L96,256 Z');

  // small stamps sitting ON the cream band (capers/onion/herb flecks)
  const onCream = simplified ? [] : toppingIds.filter((id) => id !== 'lemon' && id !== 'lime').slice(0, 2).map((id, i) =>
    stamp(id, 150 + i * 104 + (rnd() - 0.5) * 26, 246 + (rnd() - 0.5) * 6, 21, (rnd() - 0.5) * 40, rnd(), `t${i}`)
  );

  return (
    <>
      <CardWash tones={tones} />
      <SidePlate tones={tones} cy={322} rx={146} ry={28} />
      {/* bottom bagel half */}
      <rect x={106} y={266} width={188} height={36} rx={17} fill={bagel} stroke={INK} strokeWidth={SW.macro} />
      {!simplified && <path d="M120,284 Q124,278 136,278 L210,278" fill="none" stroke={bagelLight} strokeWidth={7} strokeLinecap="round" />}
      {/* filling ribbon then cream cheese over it */}
      <path d={fill.join(' ')} fill={tones.food} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
      <path d={cream.join(' ')} fill={CREAM_CHEESE} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
      {onCream}
      {/* top bagel — dome with a centre dimple (the hole) */}
      <path d="M96,226 Q96,154 180,148 Q196,146 200,160 Q204,146 220,148 Q304,154 304,226 Q304,240 290,240 L110,240 Q96,240 96,226 Z" fill={bagel} stroke={INK} strokeWidth={SW.macro} strokeLinejoin="round" />
      <path d="M118,192 Q140,162 176,156" fill="none" stroke={bagelLight} strokeWidth={10} strokeLinecap="round" />
      <g fill={SESAME} stroke={INK} strokeWidth={3}>{seeds}</g>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* lettuce-cups — green cups of filling (+ rice-paper rolls variant)  */
/* ------------------------------------------------------------------ */

function LettuceCup({ tones, cx, cy, s, seedKey }: { tones: DishProps['tones']; cx: number; cy: number; s: number; seedKey: string }) {
  const rnd = rngFor(seedKey);
  const j = () => (rnd() - 0.5) * 6;
  // savoury mince — warmed from tones.food so green-palette recipes stay legible.
  // Seafood fillings (prawn cocktail…) keep their coral instead of going mince-brown.
  const seafood = /prawn|shrimp|crab|seafood/.test(seedKey);
  const mince = seafood ? mix(tones.food, '#f29b74', 0.4) : mix(tones.food, '#a8703a', 0.62);
  const minceHi = lighten(mince, 0.14);
  const minceLo = darken(mince, 0.16);
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      {/* back rim ruffle */}
      <path
        d={`M-56,-6 Q${-62 + j()},-34 ${-38 + j()},-31 Q${-42 + j()},-50 ${-16 + j()},-41 Q${-8 + j()},-56 ${12 + j()},-44 Q${30 + j()},-53 ${38 + j()},-35 Q${58 + j()},-38 54,-6 Z`}
        fill={LETTUCE_PALE} stroke={INK} strokeWidth={5} strokeLinejoin="round"
      />
      {/* filling mound — pokes clearly above the front rim */}
      <ellipse cx={0} cy={-12} rx={44} ry={25} fill={mince} stroke={INK} strokeWidth={5.5} />
      <ellipse cx={-13} cy={-21} rx={16} ry={8} fill={minceHi} opacity={0.9} />
      <circle cx={11 + j()} cy={-16} r={4} fill={minceLo} />
      <circle cx={-24 + j()} cy={-9} r={3.5} fill={minceLo} />
      <circle cx={25 + j()} cy={-6} r={3.5} fill={minceLo} />
      {/* front leaf cup */}
      <path d="M-58,-6 Q-54,32 0,36 Q54,32 58,-6 Q38,4 18,2 Q0,6 -18,2 Q-38,4 -58,-6 Z" fill={LETTUCE} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
      <g fill="none" stroke={LETTUCE_PALE} strokeWidth={4} strokeLinecap="round" opacity={0.85}>
        <path d="M-2,32 Q-4,18 -14,6" />
        <path d="M2,32 Q4,18 14,6" />
      </g>
    </g>
  );
}

function RicePaperRoll({ tones, rnd }: { tones: DishProps['tones']; rnd: () => number }) {
  const gx = (rnd() - 0.5) * 18;
  return (
    <>
      <rect x={-102} y={-34} width={204} height={68} rx={34} fill={RICE_PAPER} />
      {/* filling seen through the wrapper — prawn discs, herbs, carrot, noodles */}
      <circle cx={18 + gx} cy={-8} r={15} fill="#ef8a72" />
      <circle cx={52 + gx} cy={-6} r={14} fill="#ef8a72" />
      <circle cx={84 + gx} cy={-2} r={12} fill="#ef8a72" />
      <path d={`M${-78 + gx},-14 Q${-58 + gx},-26 ${-38 + gx},-12 Q${-52 + gx},4 ${-78 + gx},-2 Z`} fill="#4c8a2f" />
      <rect x={-30 + gx} y={4} width={52} height={11} rx={5.5} fill="#e88a2a" transform={`rotate(-4 ${-4 + gx} 9)`} />
      <path d={`M${-84 + gx},16 Q${-40 + gx},8 ${8 + gx},17 Q${52 + gx},24 ${88 + gx},15`} fill="none" stroke="#fffdf6" strokeWidth={8} strokeLinecap="round" />
      {/* rice-paper haze + outline */}
      <rect x={-102} y={-34} width={204} height={68} rx={34} fill="#fdf6e6" opacity={0.32} />
      <rect x={-102} y={-34} width={204} height={68} rx={34} fill="none" stroke={INK} strokeWidth={SW.macro} />
      <path d="M-78,-22 Q-32,-30 24,-27" fill="none" stroke="#ffffff" strokeWidth={7} strokeLinecap="round" opacity={0.8} />
    </>
  );
}

export function LettuceCups({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':cups');
  const simplified = size < SIMPLIFY_BELOW;

  if (slug.includes('roll')) {
    // rice-paper rolls: two whole rolls + one cut face
    const rotA = -14 + (rnd() - 0.5) * 6;
    const rotB = -14 + (rnd() - 0.5) * 6;
    return (
      <>
        <CardWash tones={tones} />
        <SidePlate tones={tones} cy={306} rx={152} ry={28} />
        <g transform={`translate(214 168) rotate(${rotA})`}><RicePaperRoll tones={tones} rnd={rnd} /></g>
        <g transform={`translate(232 240) rotate(${rotB})`}><RicePaperRoll tones={tones} rnd={rnd} /></g>
        {/* cut half — cross-section */}
        <circle cx={100} cy={254} r={40} fill={RICE_PAPER} stroke={INK} strokeWidth={SW.macro} />
        <circle cx={100} cy={254} r={29} fill="#fbf3e0" />
        <path d={earc(100, 258, 20, 20, 30, 200)} fill="none" stroke="#fffdf6" strokeWidth={9} strokeLinecap="round" />
        <path d={earc(100, 254, 21, 21, -155, -25)} fill="none" stroke="#ef8a72" strokeWidth={11} strokeLinecap="round" />
        <circle cx={84} cy={266} r={7} fill="#4c8a2f" />
        <circle cx={112} cy={270} r={6} fill="#e88a2a" />
        {!simplified && (
          <ToppingScatter slug={slug} ids={toppingIds.slice(0, 2)} cx={316} cy={292} clipR={26} rimR={0} size={22} simplified />
        )}
      </>
    );
  }

  const lift = (rnd() - 0.5) * 10;
  return (
    <>
      <CardWash tones={tones} />
      <SidePlate tones={tones} cy={304} rx={152} ry={28} />
      <LettuceCup tones={tones} cx={97} cy={246 + lift} s={1.12} seedKey={slug + ':c0'} />
      <LettuceCup tones={tones} cx={303} cy={248 - lift} s={1.12} seedKey={slug + ':c2'} />
      <LettuceCup tones={tones} cx={200} cy={216} s={1.34} seedKey={slug + ':c1'} />
      <ToppingScatter slug={slug} ids={toppingIds} cx={200} cy={198} clipR={38} rimR={0} size={26} simplified={simplified} />
    </>
  );
}

/* ------------------------------------------------------------------ */

export const HANDHELD2_FORMS: Record<string, DishTemplate> = {
  'burger-stack': (p) => <BurgerStack {...p} />,
  'wrap-roll': (p) => <WrapRoll {...p} />,
  'baguette-roll': (p) => <BaguetteRoll {...p} />,
  'toast-open': (p) => <ToastOpen {...p} />,
  'bagel-stack': (p) => <BagelStack {...p} />,
  'lettuce-cups': (p) => <LettuceCups {...p} />,
};
