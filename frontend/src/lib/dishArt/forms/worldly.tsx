import { ReactNode } from 'react';
import { INK, SW, PLATE_FACE, BREAD_CRUST, BREAD_CRUMB, PASTA_GOLD, PASTA_DARK, PASTA_LIGHT, SIMPLIFY_BELOW } from '../tokens';
import { CardWash, TopPlate, SidePlate, PanIron, Gloss, Steam, CrumbScatter } from '../primitives';
import { ToppingScatter, stampFor } from '../toppings';
import { rngFor, scatter } from '../seed';
import { mix } from '../palette';
import { DishProps, DishTemplate } from '../types';

/**
 * "Worldly" dish templates: noodle pull, dumpling steamer, Spanish pans, pub
 * plates (nachos, wings, mash, fritters, schnitty, full english). Same grammar
 * as forms/bowls.tsx — seeded variation via rngFor, flat tones.food masses with
 * ONE lighter highlight, ink outlines, toppings stamped into the food,
 * simplified variant below SIMPLIFY_BELOW.
 */

// ---- fixed food colours (like PASTA_GOLD — never tones.main) ----
const CHIP_GOLD = '#f2c65e';
const CHIP_LIGHT = '#f9e2a0';
const CHIP_DEEP = '#e8b13c';
const CHEESE_MELT = '#f3a83c';
const CHEESE_LIGHT = '#f8cc7a';
const CRUMB_GOLD = '#e2a13c';
const CRUMB_DARK = '#a8641d';
const CRUMB_LIGHT = '#f4c470';
const FRITTER_GOLD = '#e8a838';
const FRITTER_LIGHT = '#f6c96a';
const SNAG_BROWN = '#96522a';
const SNAG_LIGHT = '#c98950';
const SNAG_CHAR = '#5f3212';
const GRAVY_BROWN = '#7a4a1e';
const GRAVY_LIGHT = '#a86c34';
const BUTTER_YELLOW = '#f6c33a';
const TOMATO_RED = '#d23c30';
const TOMATO_LIGHT = '#ef8070';
const SAUCE_RED = '#c03a24';
const BEAN_ORANGE = '#d97a2a';
const BEAN_DARK = '#b5501e';
const EGG_WHITE = '#fffdf6';
const YOLK = '#f2b41e';
const RICE_SAFFRON = '#eba32f';
const RICE_LIGHT = '#f7c76a';
const RICE_CHAR = '#b05a14';
const WOOD = '#d9a869';
const WOOD_DARK = '#b9884a';
const WOOD_FLOOR = '#eed7a8';
const WOOD_SLAT = '#caa267';
const DUMPLING_SKIN = '#f7ead2';
const SOY_DARK = '#5a3414';
const CREAM_DOLLOP = '#fffdf6';

/** Seeded organic blob (ellipse-capable) around (cx,cy) — midpoint-Q smoothed. */
function blob(key: string, cx: number, cy: number, rx: number, ry = rx, wobble = 0.16, n = 8): string {
  const rnd = rngFor(key);
  const pts: [number, number][] = [];
  const start = rnd() * Math.PI * 2;
  for (let i = 0; i < n; i++) {
    const a = start + (i / n) * Math.PI * 2;
    const w = 1 - wobble / 2 + rnd() * wobble;
    pts.push([cx + Math.cos(a) * rx * w, cy + Math.sin(a) * ry * w]);
  }
  const mid = (a: [number, number], b: [number, number]): [number, number] => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const m0 = mid(pts[n - 1], pts[0]);
  let d = `M${m0[0].toFixed(1)},${m0[1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const m = mid(p, pts[(i + 1) % n]);
    d += ` Q${p[0].toFixed(1)},${p[1].toFixed(1)} ${m[0].toFixed(1)},${m[1].toFixed(1)}`;
  }
  return d + ' Z';
}

/** Hand-place one topping stamp (100×100 space) at (x,y) scaled to s. */
function placeStamp(id: string, x: number, y: number, s: number, rot: number, v: number): ReactNode {
  const st = stampFor(id);
  if (!st) return null;
  return (
    <g transform={`translate(${x - s / 2} ${y - s / 2}) rotate(${rot} ${s / 2} ${s / 2}) scale(${s / 100})`}>
      {st.draw(v)}
    </g>
  );
}

/** Side-view sausage: browned capsule + light top stripe + char ticks. */
function Snag({ x, y, len, rot }: { x: number; y: number; len: number; rot: number }) {
  return (
    <g transform={`rotate(${rot} ${x} ${y})`}>
      <rect x={x - len / 2} y={y - 14} width={len} height={28} rx={14} fill={SNAG_BROWN} stroke={INK} strokeWidth={SW.topping} />
      <path d={`M${x - len / 2 + 13},${y - 6} Q${x},${y - 11} ${x + len / 2 - 15},${y - 5}`} stroke={SNAG_LIGHT} strokeWidth={6} fill="none" strokeLinecap="round" />
      <path d={`M${x - len * 0.18},${y + 7} l10,-1 M${x + len * 0.12},${y + 7} l10,-1`} stroke={SNAG_CHAR} strokeWidth={4} strokeLinecap="round" fill="none" />
    </g>
  );
}

/** Fried egg: irregular white + yolk with a specular dot. */
function FriedEgg({ seedKey, cx, cy, s }: { seedKey: string; cx: number; cy: number; s: number }) {
  const rnd = rngFor(seedKey);
  const ya = rnd() * Math.PI * 2;
  const yx = cx + Math.cos(ya) * s * 0.14;
  const yy = cy + Math.sin(ya) * s * 0.14;
  return (
    <>
      <path d={blob(seedKey + ':w', cx, cy, s, s, 0.3, 7)} fill={EGG_WHITE} stroke={INK} strokeWidth={SW.topping} strokeLinejoin="round" />
      <circle cx={yx} cy={yy} r={s * 0.42} fill={YOLK} stroke={INK} strokeWidth={SW.topping} />
      <circle cx={yx - s * 0.15} cy={yy - s * 0.15} r={s * 0.12} fill="#ffffff" opacity={0.7} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* noodle-pull — THE signature: chopsticks lifting strands from broth. */
/* ------------------------------------------------------------------ */
export function NoodlePull({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':pull');
  const simplified = size < SIMPLIFY_BELOW;
  const cx = 200, ry = 242; // bowl rim centre
  const tilt = -4 + rnd() * 8;
  const gx = 248 + Math.floor(rnd() * 8); // noodle grip point at the tips
  const gy = 116 + Math.floor(rnd() * 8);

  // strands: broth surface → chopstick grip, bowing left
  const nStrand = simplified ? 3 : 5;
  const strandCols = [PASTA_DARK, PASTA_GOLD, PASTA_LIGHT, PASTA_GOLD, '#f6d783'];
  const strands: ReactNode[] = [];
  for (let i = 0; i < nStrand; i++) {
    const x0 = 148 + i * (simplified ? 34 : 22) + (rnd() - 0.5) * 10;
    const bow = 34 + rnd() * 18;
    strands.push(
      <path
        key={i}
        d={`M${x0},${ry - 5} C${x0 + 4},${ry - 60} ${gx - bow},${gy + 52} ${gx + (i - 2) * 2.4},${gy + 4 + i * 2}`}
        fill="none" stroke={strandCols[i % strandCols.length]} strokeWidth={8} strokeLinecap="round"
      />
    );
  }

  // toppings float on the broth surface (squashed scatter, not ToppingScatter)
  const surfaceIds = toppingIds.filter((id) => stampFor(id)?.kind !== 'rim');
  const rimId = toppingIds.find((id) => stampFor(id)?.kind === 'rim');
  const pts = scatter(slug + ':float', Math.min(simplified ? 2 : 3, surfaceIds.length), { cx, cy: ry - 4, rMin: 26, rMax: 72, squashY: 0.22 });
  const floats = pts.map((p, i) => (
    <g key={i}>{placeStamp(surfaceIds[i % surfaceIds.length], p.x, p.y, 30, (p.rot % 40) - 20, p.r01)}</g>
  ));

  return (
    <>
      <CardWash tones={tones} />
      {!simplified && <Steam x={128} y={86} scale={0.75} />}
      {/* bowl */}
      <ellipse cx={cx + 6} cy={352} rx={122} ry={16} fill={tones.shadow} />
      <rect x={168} y={332} width={64} height={18} rx={7} fill={PLATE_FACE} stroke={INK} strokeWidth={SW.topping} />
      <path d={`M${cx - 118},${ry} C${cx - 114},${ry + 62} ${cx - 70},${ry + 98} ${cx},${ry + 98} C${cx + 70},${ry + 98} ${cx + 114},${ry + 62} ${cx + 118},${ry} Z`} fill={PLATE_FACE} stroke={INK} strokeWidth={SW.macro} strokeLinejoin="round" />
      <path d={`M${cx - 84},${ry + 30} Q${cx},${ry + 62} ${cx + 84},${ry + 30}`} fill="none" stroke={tones.food} strokeWidth={13} strokeLinecap="round" opacity={0.9} />
      <ellipse cx={cx} cy={ry} rx={118} ry={25} fill={PLATE_FACE} stroke={INK} strokeWidth={SW.macro} />
      <ellipse cx={cx} cy={ry} rx={100} ry={18} fill={tones.food} stroke={INK} strokeWidth={SW.topping} />
      <Gloss cx={cx - 10} cy={ry} rx={64} ry={11} tint={tones.tint} />
      {/* noodles resting in the broth */}
      <path d={`M${cx - 66},${ry + 2} Q${cx - 30},${ry + 12} ${cx + 8},${ry + 4}`} fill="none" stroke={PASTA_GOLD} strokeWidth={7} strokeLinecap="round" />
      <path d={`M${cx - 20},${ry + 8} Q${cx + 28},${ry + 15} ${cx + 66},${ry + 3}`} fill="none" stroke={PASTA_LIGHT} strokeWidth={6} strokeLinecap="round" />
      {floats}
      {rimId && placeStamp(rimId, cx + 100, ry - 18, 42, 8, 0.3)}
      {/* the pull */}
      <g transform={`rotate(${tilt} ${gx} ${gy})`}>
        {strands}
        <path d={`M${gx - 8},${gy + 10} q16,-8 12,8 q-3,12 -17,7`} fill="none" stroke={PASTA_GOLD} strokeWidth={7} strokeLinecap="round" />
        {/* chopsticks over the strands */}
        <path d={`M${gx - 10},${gy} L${gx + 108},${gy - 122}`} stroke={INK} strokeWidth={14} strokeLinecap="round" />
        <path d={`M${gx - 10},${gy} L${gx + 108},${gy - 122}`} stroke="#cd9a5e" strokeWidth={8.5} strokeLinecap="round" />
        <path d={`M${gx + 16},${gy + 12} L${gx + 134},${gy - 104}`} stroke={INK} strokeWidth={14} strokeLinecap="round" />
        <path d={`M${gx + 16},${gy + 12} L${gx + 134},${gy - 104}`} stroke="#c08a4e" strokeWidth={8.5} strokeLinecap="round" />
      </g>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* dumpling-steamer — top-down bamboo ring, pleated dumplings, dip.    */
/* ------------------------------------------------------------------ */
export function DumplingSteamer({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':steamer');
  const simplified = size < SIMPLIFY_BELOW;
  const cx = 190, cy = 194;
  const slatRot = Math.floor(rnd() * 180);
  const nDump = simplified ? 4 : 5;
  const start = rnd() * Math.PI * 2;

  const dumplings: ReactNode[] = [];
  for (let i = 0; i < nDump; i++) {
    const a = start + (i / nDump) * Math.PI * 2 + (rnd() - 0.5) * 0.24;
    const rr = 60 + rnd() * 8;
    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
    const rot = (a * 180) / Math.PI + 90 + (rnd() - 0.5) * 20;
    const ds = 1.08 + rnd() * 0.12;
    dumplings.push(
      <g key={i} transform={`translate(${x} ${y}) rotate(${rot}) scale(${ds.toFixed(2)})`}>
        <path d="M-33,10 C-31,-12 -15,-24 0,-24 C15,-24 31,-12 33,10 C18,21 -18,21 -33,10 Z" fill={DUMPLING_SKIN} stroke={INK} strokeWidth={SW.topping} strokeLinejoin="round" />
        <path d="M-30,12 Q0,20 30,12" fill="none" stroke="#e0c494" strokeWidth={5} strokeLinecap="round" />
        <path d="M-18,-13 C-10,-19 2,-20 10,-17" fill="none" stroke="#fffdf6" strokeWidth={5} strokeLinecap="round" />
        {!simplified && (
          <path d="M-16,-19 L-11,-2 M-5.5,-22.5 L-3,-4 M5.5,-22.5 L3,-4 M16,-19 L11,-2" stroke={INK} strokeWidth={2.8} strokeLinecap="round" opacity={0.55} fill="none" />
        )}
      </g>
    );
  }

  // garnish herbs only — the filling stays inside the wrappers
  const herbIds = toppingIds.filter((id) => ['spring_onion', 'coriander', 'parsley', 'basil', 'mint', 'chilli', 'chilli_flakes'].includes(id));

  return (
    <>
      <CardWash tones={tones} />
      {/* bamboo steamer */}
      <circle cx={cx + 6} cy={cy + 10} r={144} fill={tones.shadow} />
      <circle cx={cx} cy={cy} r={144} fill={WOOD} stroke={INK} strokeWidth={SW.macro} />
      <circle cx={cx} cy={cy} r={130} fill="none" stroke={WOOD_DARK} strokeWidth={4} />
      <circle cx={cx} cy={cy} r={116} fill={WOOD_FLOOR} stroke={INK} strokeWidth={3.5} />
      <g transform={`rotate(${slatRot} ${cx} ${cy})`} stroke={WOOD_SLAT} strokeWidth={4.5}>
        {[-72, -36, 0, 36, 72].map((dx) => {
          const h = Math.sqrt(116 * 116 - dx * dx) * 0.94;
          return <line key={dx} x1={cx + dx} y1={cy - h} x2={cx + dx} y2={cy + h} />;
        })}
      </g>
      {dumplings}
      <ToppingScatter slug={slug} ids={herbIds} cx={cx} cy={cy} clipR={78} rimR={126} size={24} simplified={simplified} />
      {/* dip dish */}
      <ellipse cx={334} cy={340} rx={40} ry={38} fill={tones.shadow} />
      <circle cx={330} cy={334} r={38} fill={PLATE_FACE} stroke={INK} strokeWidth={SW.topping} />
      <circle cx={330} cy={334} r={25} fill={SOY_DARK} stroke={INK} strokeWidth={3} />
      <circle cx={322} cy={327} r={5} fill="#ffffff" opacity={0.55} />
      {!simplified && <Steam x={cx} y={54} scale={0.85} />}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* paella-pan — iron pan, saffron rice, mussels + topping stamps.      */
/* ------------------------------------------------------------------ */
export function PaellaPan({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':paella');
  const simplified = size < SIMPLIFY_BELOW;
  const cx = 190, cy = 202;
  const handleA = -18 + rnd() * 30;

  // rice grain flecks + darker socarrat bits near the edge
  const grains = scatter(slug + ':grain', simplified ? 6 : 13, { cx, cy, rMin: 10, rMax: 92 }).map((p, i) => (
    <rect key={i} x={p.x - 6} y={p.y - 2.5} width={12} height={5} rx={2.5} fill={RICE_LIGHT} transform={`rotate(${p.rot} ${p.x} ${p.y})`} />
  ));
  const socarrat = simplified ? null : scatter(slug + ':soc', 5, { cx, cy, rMin: 78, rMax: 96 }).map((p, i) => (
    <rect key={i} x={p.x - 5} y={p.y - 2} width={10} height={4.5} rx={2} fill={RICE_CHAR} transform={`rotate(${p.rot} ${p.x} ${p.y})`} />
  ));
  const mussels = scatter(slug + ':mussel', simplified ? 1 : 2, { cx, cy, rMin: 42, rMax: 72 }).map((p, i) => (
    <g key={i}>{placeStamp('mussel', p.x, p.y, 46, (p.rot % 70) - 35, p.r01)}</g>
  ));

  return (
    <>
      <CardWash tones={tones} />
      <PanIron tones={tones} cx={cx} cy={cy} handleAngle={handleA} />
      <path d={blob(slug + ':rice', cx, cy, 107, 107, 0.07, 9)} fill={RICE_SAFFRON} stroke={INK} strokeWidth={SW.macro} strokeLinejoin="round" />
      <Gloss cx={cx - 6} cy={cy - 8} rx={78} ry={64} tint={RICE_LIGHT} />
      {grains}
      {socarrat}
      <g stroke={INK} strokeWidth={3.5}>
        <circle cx={cx - 44} cy={cy + 52} r={7} fill="#5d9a3a" />
        <circle cx={cx + 58} cy={cy - 40} r={7} fill="#6fae4a" />
        {!simplified && <circle cx={cx + 18} cy={cy + 70} r={6.5} fill="#4d8a2d" />}
      </g>
      {mussels}
      <ToppingScatter slug={slug} ids={toppingIds} cx={cx} cy={cy} clipR={82} rimR={128} size={34} simplified={simplified} />
      {!simplified && <Steam x={cx} y={52} scale={0.8} />}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* pan-dish — sizzling pan: sauce pool + chunks (or a slice fan when   */
/* the recipe brings no stampable toppings — char siu, pork belly).    */
/* ------------------------------------------------------------------ */
export function PanDish({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':pan');
  const simplified = size < SIMPLIFY_BELOW;
  const cx = 190, cy = 202;
  const handleA = -24 + rnd() * 44;
  const sliced = toppingIds.length === 0;
  const chunkIds = toppingIds.filter((id) => stampFor(id)?.kind === 'chunk');
  const flatIds = toppingIds.filter((id) => stampFor(id)?.kind !== 'chunk');
  const hasChunkStamps = chunkIds.length > 0;
  const pool = mix(tones.shade, INK, 0.08);

  let contents: ReactNode;
  if (sliced) {
    const fanRot = -18 + rnd() * 14;
    const nSlice = simplified ? 3 : 5;
    const sliceFill = mix(tones.food, '#93321c', 0.3);
    const sliceLight = mix(tones.tint, '#f6b06a', 0.35);
    const slices: ReactNode[] = [];
    for (let i = nSlice - 1; i >= 0; i--) {
      const dx = (i - (nSlice - 1) / 2) * (simplified ? 42 : 30);
      slices.push(
        <g key={i} transform={`translate(${dx} 0) rotate(${(i - (nSlice - 1) / 2) * 5} 0 40)`}>
          <rect x={-17} y={-48} width={34} height={96} rx={13} fill={sliceFill} stroke={INK} strokeWidth={SW.topping} />
          <rect x={-9} y={-40} width={18} height={80} rx={9} fill={sliceLight} opacity={0.9} />
        </g>
      );
    }
    contents = (
      <g transform={`translate(${cx} ${cy}) rotate(${fanRot})`}>
        {slices}
        <path d="M-78,-28 q 38,-14 78,-2 q 40,10 76,-6" fill="none" stroke={tones.highlight} strokeWidth={6.5} strokeLinecap="round" opacity={0.9} />
      </g>
    );
  } else if (hasChunkStamps) {
    // the topping stamps (prawns, scallops, potato…) ARE the contents — pack
    // the pan with them instead of leaving 1-2 lonely pieces
    const placed: ReactNode[] = [];
    chunkIds.forEach((id, j) => {
      const copies = simplified ? 2 : chunkIds.length > 1 ? 3 : 5;
      const pts = scatter(`${slug}:meat-${id}`, copies, { cx: cx + (j % 2 ? 14 : -12), cy: cy + (j % 2 ? -10 : 10), rMin: 12, rMax: 54 });
      for (const p of pts) {
        placed.push(<g key={`${id}-${p.x.toFixed(0)}-${p.y.toFixed(0)}`}>{placeStamp(id, p.x, p.y, 80 + p.r01 * 14, (p.rot % 70) - 35, p.r01)}</g>);
      }
    });
    contents = <>{placed}</>;
  } else {
    const chunks = scatter(slug + ':chunk', simplified ? 3 : 5, { cx, cy, rMin: 16, rMax: 60 }).map((p, i) => {
      const r = 20 + p.r01 * 9;
      return (
        <g key={i}>
          <path d={blob(`${slug}:ch${i}`, p.x, p.y, r, r, 0.22, 6)} fill={tones.food} stroke={INK} strokeWidth={SW.topping} strokeLinejoin="round" />
          <ellipse cx={p.x - r * 0.18} cy={p.y - r * 0.28} rx={r * 0.62} ry={r * 0.42} fill={tones.tint} transform={`rotate(-16 ${p.x} ${p.y})`} />
          <circle cx={p.x - r * 0.34} cy={p.y - r * 0.42} r={3} fill="#ffffff" opacity={0.75} />
        </g>
      );
    });
    contents = <>{chunks}</>;
  }

  return (
    <>
      <CardWash tones={tones} />
      <PanIron tones={tones} cx={cx} cy={cy} handleAngle={handleA} />
      <path d={blob(slug + ':pool', cx, cy, 100, 100, 0.09, 9)} fill={pool} stroke={INK} strokeWidth={SW.macro} strokeLinejoin="round" />
      <Gloss cx={cx - 4} cy={cy - 4} rx={76} ry={64} tint={tones.tint} />
      {contents}
      {!simplified && (
        <g fill={tones.highlight} opacity={0.85}>
          <circle cx={cx - 74} cy={cy + 40} r={4.5} />
          <circle cx={cx + 66} cy={cy + 56} r={4} />
          <circle cx={cx + 78} cy={cy - 34} r={3.5} />
        </g>
      )}
      <ToppingScatter slug={slug} ids={hasChunkStamps ? flatIds : toppingIds} cx={cx} cy={cy} clipR={72} rimR={126} size={33} simplified={simplified} />
      {!simplified && <Steam x={cx + 4} y={52} scale={0.8} />}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* nachos-pile — corn-chip pile, melted cheese drape, dollops.         */
/* ------------------------------------------------------------------ */
export function NachosPile({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':nachos');
  const simplified = size < SIMPLIFY_BELOW;
  const cx = 200, cy = 202;
  const chipCols = [CHIP_GOLD, CHIP_LIGHT, CHIP_DEEP];
  const chips = scatter(slug + ':chips', simplified ? 7 : 12, { cx, cy: cy + 4, rMin: 6, rMax: 74, squashY: 0.92 }).map((p, i) => {
    const s = 40 + p.r01 * 14;
    return (
      <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${p.rot})`}>
        <path d={`M0,${-s} L${s * 0.92},${s * 0.62} Q0,${s * 1.02} ${-s * 0.92},${s * 0.62} Z`} fill={chipCols[i % 3]} stroke={INK} strokeWidth={SW.topping} strokeLinejoin="round" />
        <path d={`M${-s * 0.3},${-s * 0.2} L${s * 0.1},${-s * 0.62}`} stroke="#fbeec2" strokeWidth={5} strokeLinecap="round" fill="none" />
      </g>
    );
  });

  return (
    <>
      <CardWash tones={tones} />
      <TopPlate tones={tones} />
      {chips}
      {/* melted cheese drape with hanging drips */}
      <g transform={`rotate(${-8 + rnd() * 16} ${cx} ${cy - 14})`}>
        <path
          d={`M${cx - 78},${cy - 28} Q${cx - 44},${cy - 64} ${cx + 5},${cy - 56} Q${cx + 64},${cy - 60} ${cx + 75},${cy - 16} Q${cx + 68},${cy + 2} ${cx + 52},${cy - 6} L${cx + 52},${cy + 22} Q${cx + 42},${cy + 35} ${cx + 33},${cy + 18} L${cx + 31},${cy - 1} Q${cx + 13},${cy + 9} ${cx - 5},${cy + 2} L${cx - 8},${cy + 30} Q${cx - 18},${cy + 43} ${cx - 27},${cy + 24} L${cx - 28},${cy - 1} Q${cx - 57},${cy + 7} ${cx - 78},${cy - 28} Z`}
          fill={CHEESE_MELT} stroke={INK} strokeWidth={SW.topping} strokeLinejoin="round"
        />
        <path d={`M${cx - 52},${cy - 34} Q${cx - 16},${cy - 54} ${cx + 39},${cy - 42}`} fill="none" stroke={CHEESE_LIGHT} strokeWidth={8} strokeLinecap="round" />
      </g>
      {/* salsa + cream dollops */}
      <path d={blob(slug + ':salsa', cx + 62, cy + 60, 26, 22, 0.2, 7)} fill={TOMATO_RED} stroke={INK} strokeWidth={SW.topping} strokeLinejoin="round" />
      <circle cx={cx + 54} cy={cy + 52} r={6.5} fill={TOMATO_LIGHT} />
      <path d={blob(slug + ':crema', cx - 68, cy + 52, 22, 19, 0.2, 7)} fill={CREAM_DOLLOP} stroke={INK} strokeWidth={SW.topping} strokeLinejoin="round" />
      {!simplified && <CrumbScatter seedKey={slug + ':chipcrumb'} cx={cx} cy={cy + 96} rx={82} ry={20} n={5} color={CHIP_DEEP} rMax={3.5} />}
      <ToppingScatter slug={slug} ids={toppingIds} cx={cx} cy={cy - 6} clipR={70} rimR={134} size={27} simplified={simplified} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* wings-pile — glossy sauced wings, sesame, dip on the plate.         */
/* ------------------------------------------------------------------ */
export function WingsPile({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':wings');
  const simplified = size < SIMPLIFY_BELOW;
  const cx = 186, cy = 212;
  const wingFill = mix(tones.food, '#7a2e14', 0.28);
  const wingLight = mix(tones.tint, '#ffffff', 0.15);
  const wings = scatter(slug + ':pile', simplified ? 4 : 6, { cx, cy, rMin: 8, rMax: 52, squashY: 0.9 }).map((p, i) => {
    const rot = (p.rot % 360);
    return (
      <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${rot}) scale(${1.02 + p.r01 * 0.22})`}>
        <rect x={-46} y={-13} width={50} height={27} rx={13} fill={wingFill} stroke={INK} strokeWidth={SW.topping} transform="rotate(-18 -21 0)" />
        <rect x={-4} y={-12} width={46} height={25} rx={12} fill={wingFill} stroke={INK} strokeWidth={SW.topping} transform="rotate(22 18 0)" />
        <path d="M-36,-9 Q-22,-16 -8,-11" fill="none" stroke={wingLight} strokeWidth={5.5} strokeLinecap="round" transform="rotate(-18 -21 0)" />
        <path d="M4,-7 Q18,-14 32,-8" fill="none" stroke={wingLight} strokeWidth={5} strokeLinecap="round" transform="rotate(22 18 0)" />
        <circle cx={-16} cy={-5} r={2.8} fill="#ffffff" opacity={0.8} />
      </g>
    );
  });
  const wingIds = toppingIds.filter((id) => id !== 'yoghurt' && id !== 'sour_cream');

  return (
    <>
      <CardWash tones={tones} />
      <TopPlate tones={tones} />
      {/* sticky sauce smear under the pile */}
      <path d={blob(slug + ':smear', cx, cy + 4, 74, 64, 0.12, 8)} fill={tones.shade} stroke={INK} strokeWidth={SW.macro} strokeLinejoin="round" />
      {wings}
      <Gloss cx={cx - 8} cy={cy - 16} rx={50} ry={36} tint={tones.tint} />
      {!simplified && <CrumbScatter seedKey={slug + ':sesame'} cx={cx} cy={cy - 4} rx={60} ry={50} n={10} color="#fdf6e2" rMax={2.8} />}
      {/* dip dish on the plate */}
      <circle cx={cx + 90} cy={cy - 74} r={29} fill={PLATE_FACE} stroke={INK} strokeWidth={SW.topping} />
      <circle cx={cx + 90} cy={cy - 74} r={19} fill="#fdf8ea" stroke={INK} strokeWidth={3} />
      <path d={`M${cx + 81},${cy - 80} q8,-5 16,1`} fill="none" stroke="#e3d9bc" strokeWidth={4.5} strokeLinecap="round" />
      <ToppingScatter slug={slug} ids={wingIds} cx={cx - 10} cy={cy + 10} clipR={58} rimR={134} size={27} simplified={simplified} />
      {!simplified && <Steam x={cx - 24} y={56} scale={0.7} />}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* mash-mound — creamy swirled mound, melting butter, gravy pool;      */
/* bangers variant leans two snags on the mound.                       */
/* ------------------------------------------------------------------ */
export function MashMound({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':mash');
  const simplified = size < SIMPLIFY_BELOW;
  const cx = 200, cy = 196;
  const hasSnags = /banger|sausage|snag/.test(slug);
  const hasGravy = hasSnags || /gravy/.test(slug);
  const mashFill = mix('#f7ecd2', tones.food, 0.1);
  const mashLight = mix('#fffdf6', tones.food, 0.04);
  const mashShade = mix('#e0c896', tones.food, 0.14);
  const ids = toppingIds.filter((id) => id !== 'potato');
  const mx = hasSnags ? cx - 16 : cx;
  const poolX = hasSnags ? cx - 62 : cx + 44;

  return (
    <>
      <CardWash tones={tones} />
      <TopPlate tones={tones} />
      {/* gravy / butter pool peeking out from under the mound */}
      <path d={blob(slug + ':pool', poolX, cy + 64, hasGravy ? 58 : 46, hasGravy ? 36 : 34, 0.16, 9)} fill={hasGravy ? GRAVY_BROWN : BUTTER_YELLOW} stroke={INK} strokeWidth={SW.macro} strokeLinejoin="round" />
      <Gloss cx={poolX - 4} cy={cy + 58} rx={hasGravy ? 40 : 32} ry={hasGravy ? 24 : 22} tint={hasGravy ? GRAVY_LIGHT : '#fbe088'} />
      {/* the mound */}
      <path d={blob(slug + ':mound', mx, cy - 6, 92, 84, 0.1, 9)} fill={mashFill} stroke={INK} strokeWidth={SW.macro} strokeLinejoin="round" />
      <path d={`M${mx - 56},${cy + 40} Q${mx},${cy + 62} ${mx + 54},${cy + 36}`} fill="none" stroke={mashShade} strokeWidth={8} strokeLinecap="round" />
      <path d={`M${mx - 50},${cy - 24} Q${mx - 6},${cy - 52} ${mx + 44},${cy - 26}`} fill="none" stroke={mashLight} strokeWidth={10} strokeLinecap="round" />
      {!simplified && <path d={`M${mx - 38},${cy + 8} Q${mx + 2},${cy - 12} ${mx + 40},${cy + 6}`} fill="none" stroke={mashShade} strokeWidth={5.5} strokeLinecap="round" opacity={0.7} />}
      {hasGravy ? (
        <>
          {/* gravy ladled over the top — a wide flat splash, not a ball */}
          <path d={blob(slug + ':ladle', mx - 10, cy - 20, 64, 26, 0.22, 10)} fill={GRAVY_BROWN} stroke={INK} strokeWidth={SW.topping} strokeLinejoin="round" />
          <Gloss cx={mx - 18} cy={cy - 24} rx={40} ry={15} tint={GRAVY_LIGHT} />
          <path d={`M${mx - 46},${cy + 2} q6,16 14,2 M${mx + 18},${cy - 2} q6,15 14,1`} fill="none" stroke={GRAVY_BROWN} strokeWidth={7} strokeLinecap="round" />
        </>
      ) : (
        /* butter pat melting on top */
        <g transform={`rotate(${-10 + rnd() * 20} ${mx - 6} ${cy - 34})`}>
          <path d={`M${mx - 12},${cy - 16} q6,12 12,0`} fill="none" stroke={BUTTER_YELLOW} strokeWidth={7} strokeLinecap="round" />
          <rect x={mx - 24} y={cy - 52} width={36} height={30} rx={6} fill={BUTTER_YELLOW} stroke={INK} strokeWidth={SW.topping} />
          <rect x={mx - 18} y={cy - 46} width={18} height={7} rx={3.5} fill="#fbe088" />
        </g>
      )}
      {/* bangers */}
      {hasSnags && (
        <>
          <Snag x={cx + 46} y={cy - 40} len={116} rot={-28 + rnd() * 10} />
          <Snag x={cx + 62} y={cy + 4} len={108} rot={-12 + rnd() * 10} />
        </>
      )}
      <ToppingScatter slug={slug} ids={ids} cx={mx} cy={cy - 8} clipR={62} rimR={134} size={27} simplified={simplified} />
      {!simplified && <Steam x={mx + 4} y={52} scale={0.8} />}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* fritter-stack — golden fritters stacked on a side plate + dollop.   */
/* ------------------------------------------------------------------ */
export function FritterStack({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':fritter');
  const simplified = size < SIMPLIFY_BELOW;
  const cx = 200;
  const n = simplified ? 2 : 3;
  const rimId = toppingIds.find((id) => stampFor(id)?.kind === 'rim');
  const stackIds = toppingIds.filter((id) => stampFor(id)?.kind !== 'rim');

  const fritters: ReactNode[] = [];
  let topY = 282;
  for (let i = 0; i < n; i++) {
    const w = 182 - i * 22 + rnd() * 8;
    const h = 42;
    const y = 280 - i * (h - 6); // centre of this fritter
    topY = y - h / 2;
    const x = cx + (rnd() - 0.5) * 26;
    const rot = (rnd() - 0.5) * 8;
    fritters.push(
      <g key={i} transform={`rotate(${rot} ${x} ${y})`}>
        <path d={blob(`${slug}:frit${i}`, x, y, w / 2, h / 2, 0.24, 12)} fill={FRITTER_GOLD} stroke={INK} strokeWidth={SW.macro} strokeLinejoin="round" />
        <path d={`M${x - w / 2 + 20},${y - 8} Q${x},${y - 17} ${x + w / 2 - 22},${y - 7}`} fill="none" stroke={FRITTER_LIGHT} strokeWidth={7} strokeLinecap="round" />
        <path d={`M${x - w * 0.22},${y + 9} l14,-2 M${x + w * 0.1},${y + 10} l13,-2`} stroke={CRUMB_DARK} strokeWidth={4} strokeLinecap="round" fill="none" />
        <CrumbScatter seedKey={`${slug}:fr${i}`} cx={x} cy={y + 2} rx={w * 0.36} ry={9} n={simplified ? 3 : 5} color={CRUMB_DARK} rMax={3} />
      </g>
    );
  }

  return (
    <>
      <CardWash tones={tones} />
      <SidePlate tones={tones} cy={302} />
      {fritters}
      {/* dollop on top */}
      <path d={`M${cx - 22},${topY + 2} Q${cx - 26},${topY - 16} ${cx - 8},${topY - 20} Q${cx - 4},${topY - 32} ${cx + 7},${topY - 21} Q${cx + 24},${topY - 18} ${cx + 19},${topY + 1} Q${cx},${topY + 9} ${cx - 22},${topY + 2} Z`} fill={CREAM_DOLLOP} stroke={INK} strokeWidth={SW.topping} strokeLinejoin="round" />
      <circle cx={cx - 8} cy={topY - 14} r={3.5} fill="#ffffff" opacity={0.8} />
      <ToppingScatter slug={slug} ids={stackIds} cx={cx} cy={topY + 34} clipR={54} rimR={134} size={26} simplified={simplified} />
      {rimId && placeStamp(rimId, cx + 112, 296, 46, -6, 0.4)}
      {!simplified && <CrumbScatter seedKey={slug + ':plate'} cx={cx} cy={306} rx={110} ry={14} n={5} color={CRUMB_DARK} rMax={3} />}
      {!simplified && <Steam x={cx + 6} y={70} scale={0.7} />}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* crumbed-plate — golden cutlet + lemon + leaves; parma variant       */
/* drapes red sauce and melted cheese over the crumb.                  */
/* ------------------------------------------------------------------ */
export function CrumbedPlate({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':crumbed');
  const simplified = size < SIMPLIFY_BELOW;
  const cx = 200, cy = 202;
  const isParma = /parma/.test(slug) || toppingIds.includes('mozzarella');
  const rot = -12 + rnd() * 14;
  const scatterIds = toppingIds.filter((id) => !['eggs', 'chicken_breast', 'ham_sliced', 'mozzarella'].includes(id));

  return (
    <>
      <CardWash tones={tones} />
      <TopPlate tones={tones} />
      <g transform={`rotate(${rot} ${cx} ${cy})`}>
        {/* the cutlet — wide flat oval with a craggy crumb edge */}
        <path d={blob(slug + ':cutlet', cx - 2, cy - 8, 118, 70, 0.13, 12)} fill={CRUMB_GOLD} stroke={INK} strokeWidth={SW.macro} strokeLinejoin="round" />
        <path d={`M${cx - 84},${cy - 38} Q${cx - 22},${cy - 62} ${cx + 62},${cy - 42}`} fill="none" stroke={CRUMB_LIGHT} strokeWidth={9} strokeLinecap="round" />
        <path d={`M${cx - 106},${cy + 4} l9,6 M${cx + 104},${cy - 14} l9,-5 M${cx - 30},${cy + 56} l4,9`} stroke={CRUMB_DARK} strokeWidth={3.5} strokeLinecap="round" fill="none" />
        <CrumbScatter seedKey={slug + ':speck'} cx={cx - 2} cy={cy - 4} rx={92} ry={48} n={simplified ? 8 : 20} color={CRUMB_DARK} rMax={4.4} />
        {isParma && (
          <>
            {/* napoli ladled over, cheese melted off-centre with drips */}
            <path d={blob(slug + ':parmasauce', cx - 4, cy - 14, 88, 48, 0.15, 9)} fill={SAUCE_RED} stroke={INK} strokeWidth={SW.topping} strokeLinejoin="round" />
            <Gloss cx={cx - 12} cy={cy - 20} rx={60} ry={30} tint="#e06848" />
            <path
              d={`M${cx - 56},${cy - 24} Q${cx - 40},${cy - 44} ${cx - 6},${cy - 40} Q${cx + 26},${cy - 42} ${cx + 34},${cy - 22} Q${cx + 28},${cy - 12} ${cx + 18},${cy - 16} L${cx + 16},${cy + 2} Q${cx + 8},${cy + 10} ${cx + 2},${cy - 2} Q${cx - 12},${cy - 4} ${cx - 24},${cy - 10} L${cx - 27},${cy + 6} Q${cx - 36},${cy + 12} ${cx - 40},${cy - 2} Q${cx - 52},${cy - 8} ${cx - 56},${cy - 24} Z`}
              fill="#fdf8ea" stroke={INK} strokeWidth={SW.topping} strokeLinejoin="round"
            />
            <path d={`M${cx - 42},${cy - 28} Q${cx - 20},${cy - 38} ${cx + 14},${cy - 30}`} fill="none" stroke="#ffffff" strokeWidth={5.5} strokeLinecap="round" opacity={0.9} />
          </>
        )}
      </g>
      {/* leaf side */}
      {placeStamp('rocket', cx - 96, cy + 74, 42, -24 + rnd() * 30, 0.3)}
      {!simplified && placeStamp('rocket', cx - 66, cy + 94, 36, 130 + rnd() * 30, 0.7)}
      <ToppingScatter slug={slug} ids={scatterIds} cx={cx - 4} cy={cy - 10} clipR={62} rimR={134} size={30} simplified={simplified} />
      {!simplified && <CrumbScatter seedKey={slug + ':plate'} cx={cx + 74} cy={cy + 82} rx={30} ry={16} n={4} color={CRUMB_DARK} rMax={3} />}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* fry-up-plate — the full english on one plate.                       */
/* ------------------------------------------------------------------ */
export function FryUpPlate({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':fryup');
  const simplified = size < SIMPLIFY_BELOW;
  const cx = 200, cy = 202;
  const beanX = cx - 56, beanY = cy + 50;
  const beans = scatter(slug + ':beans', simplified ? 4 : 7, { cx: beanX, cy: beanY, rMin: 4, rMax: 36 }).map((p, i) => (
    <ellipse key={i} cx={p.x} cy={p.y} rx={7.5} ry={5.5} fill={BEAN_DARK} transform={`rotate(${(p.rot % 60) - 30} ${p.x} ${p.y})`} />
  ));
  return (
    <>
      <CardWash tones={tones} />
      <TopPlate tones={tones} />
      {/* beans pool */}
      <path d={blob(slug + ':pool', beanX, beanY, 56, 48, 0.12, 8)} fill={BEAN_ORANGE} stroke={INK} strokeWidth={SW.macro} strokeLinejoin="round" />
      {beans}
      <Gloss cx={beanX - 4} cy={beanY - 6} rx={38} ry={30} tint="#eda05c" />
      {/* toast */}
      <g transform={`rotate(${8 + rnd() * 10} ${cx + 62} ${cy + 66})`}>
        <rect x={cx + 20} y={cy + 24} width={86} height={86} rx={16} fill={BREAD_CRUST} stroke={INK} strokeWidth={SW.macro} />
        <rect x={cx + 31} y={cy + 35} width={64} height={64} rx={10} fill={BREAD_CRUMB} />
      </g>
      {/* sausages */}
      <Snag x={cx - 62} y={cy - 58} len={104} rot={-32 + rnd() * 10} />
      <Snag x={cx - 34} y={cy - 30} len={98} rot={-24 + rnd() * 10} />
      {/* tomato half */}
      <g transform={`translate(${cx + 24} ${cy - 78})`}>
        <circle r={30} fill={TOMATO_RED} stroke={INK} strokeWidth={SW.topping} />
        <circle r={20} fill={TOMATO_LIGHT} />
        <path d="M0,-16 L0,16 M-14,-8 L14,8 M-14,8 L14,-8" stroke={TOMATO_RED} strokeWidth={3.5} strokeLinecap="round" />
        <circle cx={-9} cy={-9} r={4} fill="#ffffff" opacity={0.65} />
      </g>
      {/* mushroom + bacon extras */}
      {!simplified && placeStamp('mushroom', cx + 92, cy - 26, 42, -8 + rnd() * 16, 0.4)}
      {!simplified && placeStamp('bacon', cx - 100, cy - 2, 52, -64 + rnd() * 16, 0.6)}
      {/* the egg in front */}
      <FriedEgg seedKey={slug + ':egg'} cx={cx - 6 + rnd() * 8} cy={cy + 2} s={42} />
      {!simplified && <CrumbScatter seedKey={slug + ':pepper'} cx={cx} cy={cy + 10} rx={70} ry={40} n={4} color={INK} rMax={2.2} />}
      {!simplified && <Steam x={cx - 4} y={52} scale={0.7} />}
    </>
  );
}

export const WORLDLY_FORMS: Record<string, DishTemplate> = {
  'noodle-pull': (p) => <NoodlePull {...p} />,
  'dumpling-steamer': (p) => <DumplingSteamer {...p} />,
  'paella-pan': (p) => <PaellaPan {...p} />,
  'pan-dish': (p) => <PanDish {...p} />,
  'nachos-pile': (p) => <NachosPile {...p} />,
  'wings-pile': (p) => <WingsPile {...p} />,
  'mash-mound': (p) => <MashMound {...p} />,
  'fritter-stack': (p) => <FritterStack {...p} />,
  'crumbed-plate': (p) => <CrumbedPlate {...p} />,
  'fry-up-plate': (p) => <FryUpPlate {...p} />,
};
