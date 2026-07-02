import { ReactNode } from 'react';
import { INK, SW, BREAD_CRUST, BREAD_CRUMB, CHAR, HERB_GREEN, PLATE_FACE, SIMPLIFY_BELOW } from '../tokens';
import { CardWash, TopPlate, SidePlate, Gloss, Steam, CrumbScatter } from '../primitives';
import { ToppingScatter, stampFor } from '../toppings';
import { rngFor } from '../seed';
import { mix } from '../palette';
import { DishProps, DishTemplate } from '../types';

/**
 * Handheld-family dish templates (side-view stacks + platters): toastie,
 * tacos, skewers, dip plate, pancakes, and the default-plate fallback.
 * Language: docs/DISH-ART-PLAN.md — flat ink-outlined silhouettes, one lighter
 * highlight per element, toppings stamped into the food (dirA reference).
 */

const TOAST_TOP = '#e2a95c';
const TOAST_BOT = '#d59a52';
const TOAST_HI = '#f4d197';
const TORTILLA = '#f0c364';
const TORTILLA_IN = '#d9a848';
const PANCAKE_A = '#f2c76d';
const PANCAKE_B = '#e9b75a';
const BUTTER = '#fbe58a';
const OIL = '#e8c34d';
const STICK = '#d9aa6a';

/** One hand-placed topping stamp (same transform grammar as ToppingScatter). */
function HandStamp({ id, x, y, s, v, rot = 0 }: { id: string; x: number; y: number; s: number; v: number; rot?: number }) {
  const stamp = stampFor(id);
  if (!stamp) return null;
  return (
    <g transform={`translate(${x - s / 2} ${y - s / 2}) rotate(${rot} ${s / 2} ${s / 2}) scale(${s / 100})`}>
      {stamp.draw(v)}
    </g>
  );
}

const notRim = (id: string) => stampFor(id)?.kind !== 'rim';

/** Irregular organic food blob (9 anchors) centred on (cx,cy) — the exemplar's. */
function foodBlob(cx: number, cy: number, r: number): string {
  return [
    `M${cx + r * 1.0},${cy - r * 0.08}`,
    `C${cx + r * 1.05},${cy + r * 0.3} ${cx + r * 0.8},${cy + r * 0.72} ${cx + r * 0.4},${cy + r * 0.87}`,
    `C${cx},${cy + r * 1.02} ${cx - r * 0.5},${cy + r * 0.96} ${cx - r * 0.76},${cy + r * 0.67}`,
    `C${cx - r * 1.01},${cy + r * 0.4} ${cx - r * 1.06},${cy + r * 0.02} ${cx - r * 0.92},${cy - r * 0.3}`,
    `C${cx - r * 0.78},${cy - r * 0.64} ${cx - r * 0.43},${cy - r * 0.88} ${cx - r * 0.02},${cy - r * 0.89}`,
    `C${cx + r * 0.39},${cy - r * 0.9} ${cx + r * 0.78},${cy - r * 0.68} ${cx + r * 0.93},${cy - r * 0.36}`,
    `C${cx + r * 0.97},${cy - r * 0.26} ${cx + r * 0.99},${cy - r * 0.17} ${cx + r * 1.0},${cy - r * 0.08} Z`,
  ].join(' ');
}

/**
 * sandwich-stack — side-view toastie/jaffle: two golden bread slabs, molten
 * filling (tones.food) dripping over the bottom slab, diagonal grill-press
 * lines charred into the top face.
 */
export function SandwichStack({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':sandwich');
  const simplified = size < SIMPLIFY_BELOW;
  const cx = 200;
  const w = 224 + Math.floor(rnd() * 20);
  const x0 = cx - w / 2, x1 = cx + w / 2;
  const topY = 126 + Math.floor(rnd() * 12);
  const topH = 74;
  const fillY = topY + topH;
  const fb = fillY + 32; // filling bottom edge

  // molten filling with hanging drips (one closed path so the ink outline flows)
  const dripFr = simplified ? [0.28, 0.72] : [0.2, 0.5, 0.8];
  const drips = dripFr.map((f) => ({ x: x0 + w * f + (rnd() - 0.5) * 18, len: 20 + rnd() * 18 })).sort((a, b) => a.x - b.x);
  let fill = `M${x0 - 8},${fillY + 4} Q${x0 - 10},${fb} ${x0 + 8},${fb}`;
  for (const d of drips) fill += ` L${d.x - 11},${fb} q0,${d.len} 11,${d.len} q11,0 11,${-d.len}`;
  fill += ` L${x1 - 8},${fb} Q${x1 + 10},${fb} ${x1 + 8},${fillY + 4} Z`;

  // loaf-topped upper slab
  const lr = 26;
  const topSlab = `M${x0},${fillY + 6} L${x0},${topY + lr} Q${x0},${topY} ${x0 + lr},${topY} L${x1 - lr},${topY} Q${x1},${topY} ${x1},${topY + lr} L${x1},${fillY + 6} Z`;

  // diagonal grill-press lines on the toasted face
  const nG = simplified ? 3 : 4 + Math.floor(rnd() * 2);
  const gStep = (w - 78) / (nG - 1);
  const grill: ReactNode[] = [];
  for (let i = 0; i < nG; i++) {
    const gx = x0 + 26 + i * gStep + (rnd() - 0.5) * 6;
    grill.push(
      <path key={i} d={`M${gx},${topY + 20} L${gx + 26},${fillY - 8}`} stroke={CHAR} strokeWidth={5} strokeLinecap="round" opacity={0.8} fill="none" />
    );
  }

  const garnish = toppingIds.filter(notRim).slice(0, simplified ? 1 : 2);
  const gPos: [number, number][] = [[100, 290], [306, 294]];

  return (
    <>
      <CardWash tones={tones} />
      <SidePlate tones={tones} cy={298} rx={148} ry={29} />
      <rect x={x0 + 2} y={fb - 6} width={w - 4} height={42} rx={12} fill={TOAST_BOT} stroke={INK} strokeWidth={SW.macro} />
      <path d={`M${x0 + 22},${fb + 16} L${x1 - 22},${fb + 16}`} stroke="#eec089" strokeWidth={6} strokeLinecap="round" fill="none" />
      <path d={fill} fill={tones.food} stroke={INK} strokeWidth={SW.macro} strokeLinejoin="round" />
      <path d={`M${x0 + 4},${fillY + 15} L${x1 - 4},${fillY + 15}`} stroke={tones.tint} strokeWidth={5} strokeLinecap="round" opacity={0.9} fill="none" />
      <path d={topSlab} fill={TOAST_TOP} stroke={INK} strokeWidth={SW.macro} strokeLinejoin="round" />
      <path d={`M${x0 + 16},${topY + 30} Q${x0 + 18},${topY + 11} ${x0 + 46},${topY + 10}`} stroke={TOAST_HI} strokeWidth={8} strokeLinecap="round" fill="none" />
      {grill}
      {garnish.map((id, i) => (
        <HandStamp key={id} id={id} x={gPos[i][0]} y={gPos[i][1]} s={46} v={rnd()} rot={Math.floor(rnd() * 30) - 15} />
      ))}
      {!simplified && <Steam x={cx + 4} y={topY - 46} scale={0.75} opacity={0.5} />}
    </>
  );
}

/** tacos — two folded tortillas, filling mounded along the fold, lettuce frill. */
export function Tacos({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':tacos');
  const simplified = size < SIMPLIFY_BELOW;

  const ids = toppingIds.filter(notRim);
  const rimId = toppingIds.find((id) => !notRim(id));

  const taco = (r: number, key: string, stamps: string[]): ReactNode => {
    const tr = rngFor(slug + ':taco:' + key);
    // lumpy filling strip above the fold
    const filling = [
      `M${-r + 12},2`,
      `C${-r + 4},${-24 - tr() * 8} ${-r + 26},${-38 - tr() * 6} ${-r * 0.45},${-28 - tr() * 6}`,
      `C${-r * 0.3},${-46 - tr() * 8} ${-8},${-48 - tr() * 6} ${6},${-32}`,
      `C${20},${-50 - tr() * 6} ${r * 0.42},${-44} ${r * 0.52},${-26 - tr() * 6}`,
      `C${r - 20},${-36} ${r - 2},${-22} ${r - 10},2 Z`,
    ].join(' ');
    // scalloped lettuce line at the fold
    const seg = (2 * r - 36) / 5;
    let lettuce = `M${-r + 18},-4`;
    for (let i = 0; i < 5; i++) lettuce += ` q${seg / 2},-15 ${seg},0`;
    // toasted freckles on the shell
    const freckles: ReactNode[] = [];
    if (!simplified) {
      for (let i = 0; i < 3; i++) {
        const a = (0.7 + tr() * 1.7);
        const d = r * (0.45 + tr() * 0.35);
        freckles.push(<circle key={i} cx={Math.cos(a) * d} cy={Math.sin(a) * d * 0.68} r={3 + tr() * 1.5} fill={TORTILLA_IN} opacity={0.85} />);
      }
    }
    return (
      <>
        {/* far shell wall peeking up behind the filling — the "folded" read */}
        <path d={`M${-r + 3},4 Q${-r * 0.55},${-50} 0,${-56} Q${r * 0.55},${-50} ${r - 3},4 Z`} fill={TORTILLA_IN} stroke={INK} strokeWidth={SW.macro} strokeLinejoin="round" />
        <path d={filling} fill={tones.food} stroke={INK} strokeWidth={SW.macro} strokeLinejoin="round" />
        <Gloss cx={0} cy={-24} rx={r * 0.5} ry={13} tint={tones.tint} />
        <path d={lettuce} fill="none" stroke={HERB_GREEN} strokeWidth={6.5} strokeLinecap="round" strokeLinejoin="round" />
        {stamps.map((id, i) => (
          <HandStamp key={id + i} id={id} x={i === 0 ? -r * 0.4 + tr() * 10 : r * 0.28 + tr() * 10} y={-32 - tr() * 8} s={28 + tr() * 6} v={tr()} rot={Math.floor(tr() * 36) - 18} />
        ))}
        <path d={`M${-r},0 A${r} ${r * 0.74} 0 0 0 ${r},0 Z`} fill={TORTILLA} stroke={INK} strokeWidth={SW.macro} strokeLinejoin="round" />
        <path d={`M${-r + 14},0 A${r - 14} ${(r - 14) * 0.74} 0 0 0 ${r - 14},0`} fill="none" stroke={TORTILLA_IN} strokeWidth={6} />
        <path d={`M${-r + 10},12 A${r - 16} ${(r - 16) * 0.74} 0 0 1 ${-r * 0.3},${r * 0.6}`} fill="none" stroke="#f9dfa0" strokeWidth={7} strokeLinecap="round" opacity={0.8} />
        {freckles}
      </>
    );
  };

  const wait = simplified ? 1 : 2;
  const backStamps = ids.filter((_, i) => i % 2 === 0).slice(0, wait);
  const frontStamps = ids.filter((_, i) => i % 2 === 1).slice(0, wait);
  const leanA = -17 + rnd() * 5, leanB = 10 + rnd() * 5;

  return (
    <>
      <CardWash tones={tones} />
      <SidePlate tones={tones} cy={310} rx={152} ry={30} />
      <g transform={`translate(138 224) rotate(${leanA})`}>{taco(92, 'back', backStamps)}</g>
      <g transform={`translate(260 238) rotate(${leanB})`}>{taco(98, 'front', frontStamps)}</g>
      {rimId && <HandStamp id={rimId} x={68 + rnd() * 14} y={314} s={44} v={rnd()} />}
    </>
  );
}

/** skewers — two char-grilled skewers laid diagonally across a plate. */
export function Skewers({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':skewers');
  const simplified = size < SIMPLIFY_BELOW;
  const rot = -34 + rnd() * 14;
  const cubeAlt = mix(tones.food, tones.tint, 0.55);

  const skewer = (y: number): ReactNode => {
    const cubes: ReactNode[] = [];
    const n = simplified ? 3 : 4;
    let x = 98 + rnd() * 14;
    for (let i = 0; i < n; i++) {
      const cw = 40 + rnd() * 9;
      const ch = 40 + rnd() * 8;
      const tilt = rnd() * 10 - 5;
      const cyC = y + (rnd() - 0.5) * 4;
      cubes.push(
        <g key={i} transform={`rotate(${tilt} ${x + cw / 2} ${cyC})`}>
          <rect x={x} y={cyC - ch / 2} width={cw} height={ch} rx={9} fill={i % 2 === 0 ? tones.food : cubeAlt} stroke={INK} strokeWidth={SW.macro} />
          <path d={`M${x + 8},${cyC - ch / 2 + 14} Q${x + 9},${cyC - ch / 2 + 7} ${x + 18},${cyC - ch / 2 + 7}`} fill="none" stroke={tones.highlight} strokeWidth={5} strokeLinecap="round" />
          {!simplified && (
            <path d={`M${x + cw * 0.28},${cyC + 8} L${x + cw * 0.68},${cyC + 5}`} stroke={CHAR} strokeWidth={4.5} strokeLinecap="round" opacity={0.85} fill="none" />
          )}
        </g>
      );
      x += cw + 12 + rnd() * 7;
    }
    return (
      <>
        <line x1={74} y1={y} x2={334} y2={y} stroke={INK} strokeWidth={9} strokeLinecap="round" />
        <line x1={76} y1={y} x2={332} y2={y} stroke={STICK} strokeWidth={4.5} strokeLinecap="round" />
        <path d={`M${56},${y} L${78},${y - 6.5} L${78},${y + 6.5} Z`} fill={STICK} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
        {cubes}
      </>
    );
  };

  return (
    <>
      <CardWash tones={tones} />
      <TopPlate tones={tones} r={150} />
      <g transform={`rotate(${rot} 200 202)`}>
        {skewer(166)}
        {skewer(240)}
      </g>
      {!simplified && <CrumbScatter seedKey={slug + ':flk'} cx={200} cy={202} rx={104} ry={104} n={6} color={HERB_GREEN} rMax={3.5} />}
      <ToppingScatter slug={slug} ids={toppingIds} cx={200} cy={202} clipR={104} rimR={134} size={32} simplified={simplified} />
      {!simplified && <Steam x={212} y={56} scale={0.7} opacity={0.45} />}
    </>
  );
}

/** dip-plate — centre dip bowl with swirl + oil pool, flatbread wedges around. */
export function DipPlate({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':dip');
  const simplified = size < SIMPLIFY_BELOW;
  const pt = (deg: number, rr: number) => `${200 + Math.cos((deg * Math.PI) / 180) * rr},${202 + Math.sin((deg * Math.PI) / 180) * rr}`;
  const swirlRot = Math.floor(rnd() * 360);

  // flatbread wedges around the bowl, one slot eaten (crumbs remain)
  const slots = simplified ? 5 : 7;
  const missIdx = simplified ? -1 : Math.floor(rnd() * slots);
  const start = rnd() * 360;
  const wedges: ReactNode[] = [];
  for (let s = 0; s < slots; s++) {
    const a = start + (s * 360) / slots + (rnd() - 0.5) * 10;
    const rad = (a * Math.PI) / 180;
    const wx = 200 + Math.cos(rad) * 114;
    const wy = 202 + Math.sin(rad) * 114;
    if (s === missIdx) {
      wedges.push(<CrumbScatter key={s} seedKey={slug + ':eaten'} cx={wx} cy={wy} rx={20} ry={16} n={5} color={BREAD_CRUST} rMax={4} />);
      continue;
    }
    wedges.push(
      <g key={s} transform={`translate(${wx} ${wy}) rotate(${a + 270})`}>
        <path d="M0,-32 L24,20 Q0,31 -24,20 Z" fill={BREAD_CRUMB} stroke={INK} strokeWidth={SW.macro} strokeLinejoin="round" />
        <path d="M-20,18 Q0,27 20,18" fill="none" stroke={BREAD_CRUST} strokeWidth={6} strokeLinecap="round" />
        {!simplified && (
          <g fill={CHAR} opacity={0.6}>
            <circle cx={-6 + rnd() * 6} cy={-8 + rnd() * 6} r={2.6} />
            <circle cx={4 + rnd() * 6} cy={2 + rnd() * 6} r={2.2} />
          </g>
        )}
      </g>
    );
  }

  return (
    <>
      <CardWash tones={tones} />
      <TopPlate tones={tones} r={152} />
      {wedges}
      <circle cx={200} cy={202} r={86} fill={PLATE_FACE} stroke={INK} strokeWidth={SW.macro} />
      <circle cx={200} cy={202} r={70} fill={tones.food} stroke={INK} strokeWidth={SW.macro} />
      <Gloss cx={200} cy={202} rx={48} ry={40} tint={tones.tint} />
      <g transform={`rotate(${swirlRot} 200 202)`} fill="none" strokeLinecap="round">
        <path d={`M${pt(-26, 47)} A47,47 0 1 1 ${pt(199, 47)}`} stroke={tones.highlight} strokeWidth={8} opacity={0.9} />
        <path d={`M${pt(-30, 40)} A40,40 0 1 1 ${pt(195, 40)}`} stroke={tones.shade} strokeWidth={9} />
        <path d={`M${pt(150, 20)} A20,20 0 1 1 ${pt(20, 20)}`} stroke={tones.shade} strokeWidth={8} />
      </g>
      <ellipse cx={207 + rnd() * 6} cy={197 + rnd() * 6} rx={14} ry={10} fill={OIL} opacity={0.85} />
      <ToppingScatter slug={slug} ids={toppingIds} cx={200} cy={202} clipR={52} rimR={140} size={28} simplified={simplified} />
    </>
  );
}

/** pancakes — side stack, syrup cap + drips, butter pat, berries at the base. */
export function Pancakes({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':pancakes');
  const simplified = size < SIMPLIFY_BELOW;
  const n = simplified ? 3 : rnd() < 0.5 ? 3 : 4;
  const pw = 196 + rnd() * 14;
  const ph = 38;

  const layers: ReactNode[] = [];
  let topX = 0, topW = 0, topYv = 0;
  for (let i = 0; i < n; i++) {
    const y = 250 - i * (ph - 10);
    const w = pw - i * 10 - rnd() * 6;
    const x = 200 - w / 2 + (rnd() - 0.5) * 10;
    layers.push(
      <rect key={i} x={x} y={y} width={w} height={ph} rx={ph / 2} fill={i % 2 === 0 ? PANCAKE_A : PANCAKE_B} stroke={INK} strokeWidth={SW.macro} />
    );
    if (i === n - 1) { topX = x; topW = w; topYv = y; }
  }

  // syrup cap over the top pancake with drips running down the stack face
  const fb = topYv + 18;
  const dripFr = simplified ? [0.3, 0.74] : [0.22, 0.52, 0.8];
  const drips = dripFr.map((f) => ({ x: topX + topW * f + (rnd() - 0.5) * 14, len: 26 + rnd() * 32 })).sort((a, b) => b.x - a.x);
  let syrup = `M${topX - 2},${fb - 10} Q${topX - 5},${topYv - 6} ${topX + 24},${topYv - 7} L${topX + topW - 24},${topYv - 7} Q${topX + topW + 5},${topYv - 6} ${topX + topW + 2},${fb - 10} Q${topX + topW},${fb} ${topX + topW - 12},${fb}`;
  for (const d of drips) syrup += ` L${d.x + 10},${fb} q0,${d.len} -10,${d.len} q-10,0 -10,${-d.len}`;
  syrup += ` L${topX + 12},${fb} Q${topX},${fb} ${topX - 2},${fb - 10} Z`;

  const berryIds = toppingIds.filter((id) => notRim(id) && id !== 'eggs').slice(0, simplified ? 1 : 2);
  const bx = topX + topW;

  return (
    <>
      <CardWash tones={tones} />
      <SidePlate tones={tones} cy={314} rx={150} ry={28} />
      {layers}
      <path d={syrup} fill={tones.food} stroke={INK} strokeWidth={SW.macro} strokeLinejoin="round" />
      <path d={`M${topX + 26},${topYv + 2} L${topX + topW * 0.55},${topYv + 2}`} stroke={tones.tint} strokeWidth={6} strokeLinecap="round" opacity={0.9} fill="none" />
      <g transform={`rotate(-7 200 ${topYv - 14})`}>
        <rect x={181} y={topYv - 25} width={38} height={21} rx={5} fill={BUTTER} stroke={INK} strokeWidth={4.5} />
        <path d={`M${187},${topYv - 20} L${208},${topYv - 20}`} stroke="#fff7cc" strokeWidth={4} strokeLinecap="round" fill="none" />
      </g>
      {/* berry tumble at the stack base */}
      <g stroke={INK} strokeWidth={4.5}>
        <circle cx={topX - 22 + rnd() * 6} cy={294} r={11} fill="#3a4a8c" />
        <circle cx={topX - 40 + rnd() * 6} cy={305} r={9} fill="#2c3a72" />
        {!simplified && <circle cx={bx + 22 + rnd() * 6} cy={299} r={10} fill="#4a5aa0" />}
      </g>
      {berryIds.map((id, i) => (
        <HandStamp key={id} id={id} x={i === 0 ? bx + 32 : topX - 28} y={i === 0 ? 304 : 310} s={38} v={rnd()} rot={Math.floor(rnd() * 30) - 15} />
      ))}
      {!simplified && <Steam x={202} y={topYv - 62} scale={0.7} opacity={0.45} />}
    </>
  );
}

/** default-plate — the fallback: a handsome plated mound of the recipe colour. */
export function DefaultPlate({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':plate');
  const simplified = size < SIMPLIFY_BELOW;
  const r = 86 + rnd() * 14;
  const rot = Math.floor(rnd() * 360);

  const marks: ReactNode[] = [];
  if (!simplified) {
    for (let i = 0; i < 4; i++) {
      const a = rnd() * Math.PI * 2;
      const d = Math.sqrt(rnd()) * r * 0.62;
      marks.push(
        <circle key={i} cx={200 + Math.cos(a) * d} cy={202 + Math.sin(a) * d} r={2.6 + rnd() * 1.4} fill={tones.shade} opacity={0.6} />
      );
    }
  }

  return (
    <>
      <CardWash tones={tones} />
      <TopPlate tones={tones} r={152} />
      <path d={foodBlob(200, 202, r)} fill={tones.food} stroke={INK} strokeWidth={SW.macro} transform={`rotate(${rot} 200 202)`} />
      <path d={`M${200 + Math.cos(0.55) * r * 0.82},${202 + Math.sin(0.55) * r * 0.82} A${r * 0.82},${r * 0.82} 0 0 1 ${200 + Math.cos(1.65) * r * 0.82},${202 + Math.sin(1.65) * r * 0.82}`} fill="none" stroke={tones.shade} strokeWidth={9} strokeLinecap="round" opacity={0.4} />
      <Gloss cx={200} cy={202} rx={r * 0.78} ry={r * 0.6} tint={tones.tint} />
      {marks}
      <ToppingScatter slug={slug} ids={toppingIds} cx={200} cy={202} clipR={r - 10} rimR={136} size={36} simplified={simplified} />
      {!simplified && <Steam x={206} y={58} scale={0.75} opacity={0.5} />}
    </>
  );
}

export const HANDHELD_FORMS: Record<string, DishTemplate> = {
  'sandwich-stack': (p) => <SandwichStack {...p} />,
  'tacos': (p) => <Tacos {...p} />,
  'skewers': (p) => <Skewers {...p} />,
  'dip-plate': (p) => <DipPlate {...p} />,
  'pancakes': (p) => <Pancakes {...p} />,
  'default-plate': (p) => <DefaultPlate {...p} />,
};
