import { ReactNode } from 'react';
import { INK, SW, CREAM_FOOD, BREAD_CRUST, BREAD_CRUMB, LEAF_DARK, SIMPLIFY_BELOW } from '../tokens';
import { CardWash, TopPlate, PanIron, Gloss, Steam, CrumbScatter } from '../primitives';
import { ToppingScatter, stampFor } from '../toppings';
import { rngFor } from '../seed';
import { mix } from '../palette';
import { DishProps, DishTemplate } from '../types';

/**
 * Plate-family dish templates: salads, roast/protein plates, the whole chook,
 * fish & chips, egg brunches and the shakshuka pan. Reference art lives in
 * docs/art-exploration/direction-svgs.json (dirA greek-salad seeded the salad
 * plate). Same grammar as forms/bowls.tsx: seeded variation via rngFor, flat
 * tones.food masses with ONE lighter highlight, ink outlines, toppings stamped
 * into the food, simplified variant below SIMPLIFY_BELOW.
 */

// ---- fixed food colours (like PASTA_GOLD — never tones.main) ----
const CHIP_GOLD = '#f2c65e';
const CHIP_LIGHT = '#f9e2a0';
const SPUD_GOLD = '#e8b45a';
const SPUD_LIGHT = '#f6d88e';
const CRUMB_GOLD = '#e29c36';
const CRUMB_DARK = '#a8641d';
const STEAK_CRUST = '#6e3a22';
const STEAK_PINK = '#e2907a';
const STEAK_CORE = '#f2bca8';
const YOLK = '#f2b41e';
const EGG_WHITE = '#fffdf6';
const BEAN_GREEN = '#4c7d24';
const FLESH_CREAM = '#ecc794';
const SKIN_TAN = '#c9884a';

/** Smooth seeded organic blob path around (cx,cy) — n anchor points, midpoint-Q smoothing. */
function blob(key: string, cx: number, cy: number, r: number, wobble = 0.16, n = 8, squashY = 1): string {
  const rnd = rngFor(key);
  const pts: [number, number][] = [];
  const start = rnd() * Math.PI * 2;
  for (let i = 0; i < n; i++) {
    const a = start + (i / n) * Math.PI * 2;
    const rr = r * (1 - wobble / 2 + rnd() * wobble);
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * squashY]);
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

/** One golden chip rod (rounded rect + lighter top face). */
function ChipRod({ x, y, len, rot, w = 20 }: { x: number; y: number; len: number; rot: number; w?: number }) {
  return (
    <g transform={`rotate(${rot} ${x} ${y})`}>
      <rect x={x - len / 2} y={y - w / 2} width={len} height={w} rx={w * 0.45} fill={CHIP_GOLD} stroke={INK} strokeWidth={SW.topping} />
      <rect x={x - len / 2 + 8} y={y - w * 0.28} width={len * 0.42} height={w * 0.35} rx={w * 0.17} fill={CHIP_LIGHT} />
    </g>
  );
}

/** Roast potato chunk with a light top facet. */
function Spud({ seedKey, x, y, r }: { seedKey: string; x: number; y: number; r: number }) {
  return (
    <>
      <path d={blob(seedKey, x, y, r, 0.24, 6)} fill={SPUD_GOLD} stroke={INK} strokeWidth={SW.topping} strokeLinejoin="round" />
      <path d={`M${x - r * 0.5},${y - r * 0.28} Q${x - r * 0.1},${y - r * 0.62} ${x + r * 0.42},${y - r * 0.3}`} fill="none" stroke={SPUD_LIGHT} strokeWidth={7} strokeLinecap="round" />
    </>
  );
}

/** Fried/nestled egg: irregular white + yolk with a specular dot. */
function FriedEgg({ seedKey, cx, cy, s }: { seedKey: string; cx: number; cy: number; s: number }) {
  const rnd = rngFor(seedKey);
  const ya = rnd() * Math.PI * 2;
  const yx = cx + Math.cos(ya) * s * 0.16;
  const yy = cy + Math.sin(ya) * s * 0.16;
  return (
    <>
      <path d={blob(seedKey + ':w', cx, cy, s, 0.3, 7)} fill={EGG_WHITE} stroke={INK} strokeWidth={SW.topping} strokeLinejoin="round" />
      <circle cx={yx} cy={yy} r={s * 0.42} fill={YOLK} stroke={INK} strokeWidth={SW.topping} />
      <circle cx={yx - s * 0.15} cy={yy - s * 0.15} r={s * 0.12} fill="#ffffff" opacity={0.7} />
    </>
  );
}

/** Green bean arc. */
function Bean({ x, y, rot }: { x: number; y: number; rot: number }) {
  return (
    <path
      d={`M${x - 26},${y + 10} Q${x - 4},${y - 16} ${x + 26},${y - 4}`}
      fill="none" stroke={BEAN_GREEN} strokeWidth={9} strokeLinecap="round"
      transform={`rotate(${rot} ${x} ${y})`}
    />
  );
}

/** Salad leaf with a vein, drawn at real size (no scaled strokes). */
function LeafShape({ x, y, rot, s, fill }: { x: number; y: number; rot: number; s: number; fill: string }) {
  const p = `M0,${-s * 0.55} C${-s * 0.34},${-s * 0.32} ${-s * 0.45},${s * 0.12} ${-s * 0.26},${s * 0.5} C${-s * 0.1},${s * 0.34} ${s * 0.1},${s * 0.34} ${s * 0.26},${s * 0.5} C${s * 0.45},${s * 0.12} ${s * 0.34},${-s * 0.32} 0,${-s * 0.55} Z`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d={p} fill={fill} stroke={INK} strokeWidth={SW.topping} strokeLinejoin="round" />
      <path d={`M0,${-s * 0.38} L0,${s * 0.3}`} stroke="#e6f2cc" strokeWidth={3.5} strokeLinecap="round" fill="none" opacity={0.9} />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* salad-plate — leaf bed of 3-tone greens + recipe toppings (dirA).   */
/* ------------------------------------------------------------------ */
export function SaladPlate({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':salad');
  const simplified = size < SIMPLIFY_BELOW;
  const cx = 200, cy = 202;
  const bedR = 112 + rnd() * 10;
  const bedFill = mix('#e9f3d8', tones.food, 0.08);
  const greens = ['#3f6c1d', '#6aa348', '#8fbc5e'];
  const nLeaf = simplified ? 7 : 13;
  const start = rnd() * 360;
  const leaves: ReactNode[] = [];
  for (let i = 0; i < nLeaf; i++) {
    const a = ((start + i * (360 / nLeaf) + rnd() * 24) * Math.PI) / 180;
    const rr = bedR * (0.12 + rnd() * 0.7);
    leaves.push(
      <LeafShape
        key={i}
        x={cx + Math.cos(a) * rr}
        y={cy + Math.sin(a) * rr}
        rot={Math.floor(rnd() * 360)}
        s={simplified ? 44 + rnd() * 10 : 38 + rnd() * 16}
        fill={greens[i % 3]}
      />
    );
  }
  return (
    <>
      <CardWash tones={tones} />
      <TopPlate tones={tones} />
      <path d={blob(slug + ':bed', cx, cy, bedR, 0.08, 9)} fill={bedFill} stroke={INK} strokeWidth={SW.macro} strokeLinejoin="round" />
      {leaves}
      <ToppingScatter slug={slug} ids={toppingIds} cx={cx} cy={cy} clipR={bedR - 22} rimR={134} size={40} simplified={simplified} />
      {!simplified && <CrumbScatter seedKey={slug + ':dress'} cx={cx} cy={cy} rx={bedR - 30} ry={bedR - 34} n={5} color={LEAF_DARK} rMax={3} />}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* roast-plate — carved roast: joint + 2 cut slices, gravy, spuds.     */
/* ------------------------------------------------------------------ */
export function RoastPlate({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':roast');
  const simplified = size < SIMPLIFY_BELOW;
  const cx = 200, cy = 202;
  const slabRot = -14 + rnd() * 10;
  return (
    <>
      <CardWash tones={tones} />
      <TopPlate tones={tones} />
      {/* flat gravy pool spilling out from under the meat */}
      <path d={blob(slug + ':gravy', cx + 2, cy + 46, 96, 0.1, 8, 0.58)} fill={tones.shade} stroke={INK} strokeWidth={SW.macro} strokeLinejoin="round" />
      <Gloss cx={cx + 16} cy={cy + 44} rx={64} ry={30} tint={tones.tint} />
      <g transform={`rotate(${slabRot} ${cx - 30} ${cy - 14})`}>
        {/* the joint */}
        <rect x={cx - 102} y={cy - 60} width={110} height={86} rx={24} fill={tones.food} stroke={INK} strokeWidth={SW.macro} />
        <rect x={cx - 90} y={cy - 48} width={82} height={20} rx={10} fill={tones.tint} opacity={0.9} />
        {/* two carved slices lying flat off the cut end */}
        <g transform={`rotate(9 ${cx + 22} ${cy - 12})`}>
          <rect x={cx + 8} y={cy - 54} width={30} height={82} rx={9} fill={tones.food} stroke={INK} strokeWidth={SW.topping} />
          <rect x={cx + 15} y={cy - 46} width={16} height={66} rx={6} fill={tones.tint} opacity={0.85} />
        </g>
        <g transform={`rotate(17 ${cx + 50} ${cy - 8})`}>
          <rect x={cx + 36} y={cy - 46} width={30} height={76} rx={9} fill={tones.food} stroke={INK} strokeWidth={SW.topping} />
          <rect x={cx + 43} y={cy - 38} width={16} height={60} rx={6} fill={tones.tint} opacity={0.85} />
        </g>
        {/* gravy drizzled over the joint */}
        <path d={`M${cx - 92},${cy - 22} q 26,-12 52,-2 q 24,9 46,-4`} fill="none" stroke={tones.shade} strokeWidth={7} strokeLinecap="round" opacity={0.95} />
      </g>
      <Spud seedKey={slug + ':sp1'} x={cx + 98} y={cy - 58} r={27} />
      <Spud seedKey={slug + ':sp2'} x={cx + 52} y={cy - 92} r={24} />
      {!simplified && <Spud seedKey={slug + ':sp3'} x={cx + 110} y={cy + 2} r={22} />}
      <Bean x={cx - 92} y={cy + 58} rot={Math.floor(rnd() * 40) - 20} />
      {!simplified && <Bean x={cx - 56} y={cy + 84} rot={Math.floor(rnd() * 40) + 10} />}
      <ToppingScatter slug={slug} ids={toppingIds} cx={cx} cy={cy + 46} clipR={44} rimR={134} size={26} simplified={simplified} />
      {!simplified && <Steam x={cx} y={52} scale={0.75} />}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* roast-plate-steak — fanned char slices with a pink centre + chips.  */
/* ------------------------------------------------------------------ */
export function RoastPlateSteak({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':steak');
  const simplified = size < SIMPLIFY_BELOW;
  const cx = 200, cy = 202;
  const fanRot = -24 + rnd() * 12;
  const nSlices = simplified ? 3 : 5;
  // overlapping pink-faced slices fanned off the heel (drawn back-to-front)
  const slices: ReactNode[] = [];
  for (let i = nSlices - 1; i >= 0; i--) {
    const spread = (i - (nSlices - 1) / 2) * (simplified ? 17 : 13) + (rnd() - 0.5) * 4;
    slices.push(
      <g key={i} transform={`translate(${i * (simplified ? 30 : 22)} 0) rotate(${spread} 0 44)`}>
        <rect x={-19} y={-56} width={38} height={104} rx={15} fill={STEAK_CRUST} stroke={INK} strokeWidth={SW.topping} />
        <rect x={-13} y={-50} width={26} height={92} rx={11} fill={STEAK_PINK} />
        <rect x={-6} y={-38} width={12} height={68} rx={6} fill={STEAK_CORE} />
      </g>
    );
  }
  return (
    <>
      <CardWash tones={tones} />
      <TopPlate tones={tones} />
      <g transform={`translate(${cx - 30} ${cy - 24}) rotate(${fanRot})`}>
        {/* uncut heel with char grill marks */}
        <g transform="translate(-74 4) rotate(-10)">
          <rect x={-34} y={-56} width={68} height={112} rx={24} fill={STEAK_CRUST} stroke={INK} strokeWidth={SW.macro} />
          <rect x={-24} y={-46} width={26} height={26} rx={12} fill="#8a4c30" />
          <path d="M-22,-24 L22,-34 M-22,4 L22,-6 M-22,32 L22,22" stroke="#3a1c0e" strokeWidth={5.5} strokeLinecap="round" />
        </g>
        {slices}
        {/* sauce drizzle across the fan in the recipe colour */}
        <path d="M-100,-30 q 40,-16 88,-4 q 44,10 84,-6" fill="none" stroke={tones.food} strokeWidth={7.5} strokeLinecap="round" opacity={0.95} />
        {!simplified && (
          <path d="M-96,6 q 38,14 82,4 q 40,-8 78,2" fill="none" stroke={tones.food} strokeWidth={5.5} strokeLinecap="round" opacity={0.85} />
        )}
      </g>
      <ChipRod x={cx + 62} y={cy + 92} len={102} rot={Math.floor(rnd() * 30) - 24} />
      <ChipRod x={cx + 84} y={cy + 68} len={96} rot={Math.floor(rnd() * 24) + 2} />
      <ChipRod x={cx + 44} y={cy + 112} len={88} rot={Math.floor(rnd() * 30) - 6} />
      {!simplified && <ChipRod x={cx + 96} y={cy + 96} len={84} rot={Math.floor(rnd() * 40) - 44} />}
      <ToppingScatter slug={slug} ids={toppingIds} cx={cx - 34} cy={cy - 24} clipR={50} rimR={134} size={26} simplified={simplified} />
      {!simplified && <Steam x={cx - 12} y={54} scale={0.7} />}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* roast-plate-chicken — golden crumbed pieces, speckled crumb crust.  */
/* ------------------------------------------------------------------ */
export function RoastPlateChicken({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':chook-pieces');
  const simplified = size < SIMPLIFY_BELOW;
  const cx = 200, cy = 202;
  const rot = -10 + rnd() * 12;
  return (
    <>
      <CardWash tones={tones} />
      <TopPlate tones={tones} />
      <path d={blob(slug + ':pool', cx + 46, cy + 62, 62, 0.14, 7)} fill={tones.shade} stroke={INK} strokeWidth={SW.macro} strokeLinejoin="round" />
      <Gloss cx={cx + 40} cy={cy + 56} rx={44} ry={32} tint={tones.tint} />
      <g transform={`rotate(${rot} ${cx - 24} ${cy - 8})`}>
        <path d={blob(slug + ':cut1', cx - 26, cy - 12, 82, 0.14, 9)} fill={CRUMB_GOLD} stroke={INK} strokeWidth={SW.macro} strokeLinejoin="round" />
        <path d={`M${cx - 74},${cy - 30} Q${cx - 40},${cy - 66} ${cx + 18},${cy - 48}`} fill="none" stroke="#f4c470" strokeWidth={9} strokeLinecap="round" />
      </g>
      <path d={blob(slug + ':cut2', cx + 66, cy + 52, 46, 0.18, 7)} fill={CRUMB_GOLD} stroke={INK} strokeWidth={SW.macro} strokeLinejoin="round" />
      <CrumbScatter seedKey={slug + ':cr1'} cx={cx - 26} cy={cy - 10} rx={58} ry={52} n={simplified ? 5 : 9} color={CRUMB_DARK} rMax={3.5} />
      {!simplified && <CrumbScatter seedKey={slug + ':cr2'} cx={cx + 66} cy={cy + 52} rx={30} ry={26} n={4} color={CRUMB_DARK} rMax={3} />}
      <g stroke={INK} strokeWidth={SW.micro}>
        <circle cx={cx - 84} cy={cy + 68} r={11} fill="#5d9a3a" />
        <circle cx={cx - 60} cy={cy + 84} r={10} fill="#6fae4a" />
        {!simplified && <circle cx={cx - 100} cy={cy + 90} r={9} fill="#4d8a2d" />}
      </g>
      <ToppingScatter slug={slug} ids={toppingIds} cx={cx - 24} cy={cy - 8} clipR={58} rimR={134} size={30} simplified={simplified} />
      {!simplified && <Steam x={cx} y={52} scale={0.75} />}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* roast-plate-lamb — fanned cutlets with cream bones.                 */
/* ------------------------------------------------------------------ */
export function RoastPlateLamb({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':lamb');
  const simplified = size < SIMPLIFY_BELOW;
  const cx = 200, cy = 202;
  const rackRot = 24 + rnd() * 12; // whole rack leans so bones point up-right
  const nCut = simplified ? 2 : 3;
  const cutlets: ReactNode[] = [];
  // overlapping row, back-to-front so the front chop lies on the one behind
  for (let i = nCut - 1; i >= 0; i--) {
    const ox = (i - (nCut - 1) / 2) * (simplified ? 54 : 46);
    const tilt = (i - (nCut - 1) / 2) * 12 + (rnd() - 0.5) * 6;
    cutlets.push(
      <g key={i} transform={`translate(${ox} 0) rotate(${tilt} 0 30)`}>
        {/* bone up, knob out */}
        <rect x={-8} y={-86} width={16} height={64} rx={8} fill={CREAM_FOOD} stroke={INK} strokeWidth={SW.topping} />
        <circle cx={0} cy={-92} r={11} fill={CREAM_FOOD} stroke={INK} strokeWidth={SW.topping} />
        {/* the chop */}
        <path d={blob(`${slug}:lobe${i}`, 0, 8, 42, 0.14, 7)} fill={tones.food} stroke={INK} strokeWidth={SW.macro} strokeLinejoin="round" />
        <ellipse cx={-10} cy={-6} rx={18} ry={11} fill={tones.tint} opacity={0.9} transform="rotate(-28 -10 -6)" />
      </g>
    );
  }
  return (
    <>
      <CardWash tones={tones} />
      <TopPlate tones={tones} />
      <path d={blob(slug + ':pool', cx - 10, cy + 52, 84, 0.1, 7, 0.6)} fill={tones.shade} stroke={INK} strokeWidth={SW.macro} strokeLinejoin="round" />
      <Gloss cx={cx - 18} cy={cy + 48} rx={54} ry={26} tint={tones.tint} />
      <g transform={`translate(${cx - 14} ${cy + 20}) rotate(${-rackRot})`}>{cutlets}</g>
      <Bean x={cx - 72} y={cy + 96} rot={Math.floor(rnd() * 30) - 30} />
      {!simplified && <Bean x={cx - 106} y={cy + 40} rot={Math.floor(rnd() * 30) + 40} />}
      <ToppingScatter slug={slug} ids={toppingIds} cx={cx - 12} cy={cy + 44} clipR={42} rimR={134} size={26} simplified={simplified} />
      {!simplified && <Steam x={cx + 6} y={52} scale={0.7} />}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* roast-plate-fish — pale fillet, flake/skin lines, sauce, lemon.     */
/* ------------------------------------------------------------------ */
export function RoastPlateFish({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':fish');
  const simplified = size < SIMPLIFY_BELOW;
  const cx = 200, cy = 202;
  const rot = -16 + rnd() * 10;
  const fy = cy - 6;
  // white flake crescents fanning out from the thick (right) end, like salmon
  const flakes = (simplified ? [58, 120] : [42, 82, 122, 162]).map((d, i) => {
    const x = cx + 104 - d;
    const h = 46 - d * 0.14;
    return (
      <path key={i} d={`M${x + 14},${fy - h} Q${x - 16},${fy - 2} ${x + 14},${fy + h}`} fill="none" stroke={CREAM_FOOD} strokeWidth={8} strokeLinecap="round" />
    );
  });
  return (
    <>
      <CardWash tones={tones} />
      <TopPlate tones={tones} />
      <g transform={`rotate(${rot} ${cx} ${fy})`}>
        {/* fillet: fat at the right, tapering to a tail on the left */}
        <path
          d={`M${cx - 116},${fy - 4} Q${cx - 102},${fy - 26} ${cx - 58},${fy - 42} Q${cx - 6},${fy - 58} ${cx + 54},${fy - 52} Q${cx + 108},${fy - 42} ${cx + 112},${fy - 2} Q${cx + 110},${fy + 38} ${cx + 50},${fy + 48} Q${cx - 12},${fy + 56} ${cx - 62},${fy + 38} Q${cx - 104},${fy + 20} ${cx - 116},${fy - 4} Z`}
          fill={FLESH_CREAM} stroke={INK} strokeWidth={SW.macro} strokeLinejoin="round"
        />
        {flakes}
        {/* crisped skin band along the bottom edge */}
        <path d={`M${cx - 90},${fy + 22} Q${cx - 14},${fy + 50} ${cx + 68},${fy + 34}`} fill="none" stroke={SKIN_TAN} strokeWidth={10} strokeLinecap="round" />
        {/* spoon of sauce/salsa lying flat over the middle */}
        <path d={blob(slug + ':salsa', cx + 22, fy - 10, 52, 0.16, 8, 0.52)} fill={tones.food} stroke={INK} strokeWidth={SW.topping} strokeLinejoin="round" />
        <Gloss cx={cx + 14} cy={fy - 16} rx={34} ry={16} tint={tones.tint} />
      </g>
      <Bean x={cx - 62} y={cy + 94} rot={Math.floor(rnd() * 30) - 15} />
      {!simplified && <Bean x={cx + 54} y={cy + 98} rot={Math.floor(rnd() * 30) - 40} />}
      <ToppingScatter slug={slug} ids={toppingIds} cx={cx + 20} cy={fy - 10} clipR={38} rimR={134} size={25} simplified={simplified} />
      {!simplified && <Steam x={cx + 10} y={52} scale={0.7} />}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* roast-chicken — the whole golden bird: breast, wings, drumsticks.   */
/* ------------------------------------------------------------------ */
export function RoastChook({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':chook');
  const simplified = size < SIMPLIFY_BELOW;
  const cx = 200, cy = 202;
  const rot = -5 + rnd() * 10;
  // only rim toppings (lemon) — spuds around the bird are drawn by hand
  const rimIds = toppingIds.filter((id) => stampFor(id)?.kind === 'rim');
  return (
    <>
      <CardWash tones={tones} />
      <TopPlate tones={tones} />
      <Spud seedKey={slug + ':sp1'} x={cx - 106} y={cy + 30} r={26} />
      <Spud seedKey={slug + ':sp2'} x={cx + 104} y={cy + 42} r={24} />
      {!simplified && <Spud seedKey={slug + ':sp3'} x={cx + 96} y={cy - 58} r={22} />}
      <g transform={`translate(${cx} ${cy - 10}) rotate(${rot})`}>
        {/* body */}
        <ellipse cx={0} cy={-6} rx={70} ry={86} fill={tones.food} stroke={INK} strokeWidth={SW.macro} />
        {/* wings tucked over the shoulders — drawn ON the body so they read */}
        <ellipse cx={-52} cy={-38} rx={19} ry={42} fill={tones.food} stroke={INK} strokeWidth={SW.topping} transform="rotate(30 -52 -38)" />
        <ellipse cx={52} cy={-38} rx={19} ry={42} fill={tones.food} stroke={INK} strokeWidth={SW.topping} transform="rotate(-30 52 -38)" />
        <ellipse cx={-56} cy={-52} rx={8} ry={16} fill={tones.tint} opacity={0.85} transform="rotate(30 -56 -52)" />
        <ellipse cx={56} cy={-52} rx={8} ry={16} fill={tones.tint} opacity={0.85} transform="rotate(-30 56 -52)" />
        {/* drumsticks over the lower body, knobs splayed out */}
        <g transform="rotate(30 -34 44)">
          <rect x={-49} y={36} width={30} height={74} rx={15} fill={tones.food} stroke={INK} strokeWidth={SW.topping} />
          <circle cx={-34} cy={116} r={14} fill={CREAM_FOOD} stroke={INK} strokeWidth={SW.topping} />
        </g>
        <g transform="rotate(-30 34 44)">
          <rect x={19} y={36} width={30} height={74} rx={15} fill={tones.food} stroke={INK} strokeWidth={SW.topping} />
          <circle cx={34} cy={116} r={14} fill={CREAM_FOOD} stroke={INK} strokeWidth={SW.topping} />
        </g>
        {/* cavity hint between the legs */}
        <path d="M-16,66 Q0,78 16,66" fill="none" stroke={tones.shade} strokeWidth={5} strokeLinecap="round" />
        {/* breast highlight + centre line */}
        <ellipse cx={-20} cy={-36} rx={22} ry={38} fill={tones.tint} opacity={0.85} transform="rotate(10 -20 -36)" />
        {!simplified && <path d="M0,-82 Q6,-26 0,22" fill="none" stroke={tones.shade} strokeWidth={SW.micro} strokeLinecap="round" opacity={0.7} />}
        {!simplified && <circle cx={-26} cy={-52} r={5} fill="#ffffff" opacity={0.65} />}
      </g>
      {!simplified && <CrumbScatter seedKey={slug + ':herb'} cx={cx} cy={cy + 96} rx={90} ry={28} n={5} color={LEAF_DARK} rMax={3.5} />}
      <ToppingScatter slug={slug} ids={rimIds} cx={cx} cy={cy} clipR={60} rimR={136} size={34} simplified={simplified} />
      {!simplified && <Steam x={cx + 4} y={48} scale={0.8} />}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* fish-chips — craggy battered fillet + crisscross chip pile + lemon. */
/* ------------------------------------------------------------------ */
export function FishChips({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':fishchips');
  const simplified = size < SIMPLIFY_BELOW;
  const cx = 200, cy = 202;
  const rot = -20 + rnd() * 10;
  const fx = cx - 22, fyy = cy - 54;
  const nChips = simplified ? 5 : 8;
  const chips: ReactNode[] = [];
  for (let i = 0; i < nChips; i++) {
    chips.push(
      <ChipRod
        key={i}
        x={cx + 30 + (rnd() - 0.5) * 88}
        y={cy + 74 + (rnd() - 0.5) * 48}
        len={92 + rnd() * 28}
        rot={Math.floor(rnd() * 76) - 38}
        w={22}
      />
    );
  }
  return (
    <>
      <CardWash tones={tones} />
      <TopPlate tones={tones} />
      <g transform={`rotate(${rot} ${fx} ${fyy})`}>
        {/* craggy battered fillet */}
        <path
          d={`M${fx - 104},${fyy - 12} Q${fx - 106},${fyy - 38} ${fx - 74},${fyy - 32} Q${fx - 62},${fyy - 52} ${fx - 32},${fyy - 40} Q${fx - 4},${fyy - 54} ${fx + 24},${fyy - 40} Q${fx + 56},${fyy - 50} ${fx + 78},${fyy - 30} Q${fx + 108},${fyy - 26} ${fx + 102},${fyy - 2} Q${fx + 110},${fyy + 24} ${fx + 78},${fyy + 28} Q${fx + 60},${fyy + 46} ${fx + 28},${fyy + 34} Q${fx},${fyy + 48} ${fx - 30},${fyy + 34} Q${fx - 64},${fyy + 44} ${fx - 84},${fyy + 26} Q${fx - 110},${fyy + 22} ${fx - 104},${fyy - 12} Z`}
          fill={tones.food} stroke={INK} strokeWidth={SW.macro} strokeLinejoin="round"
        />
        <path d={`M${fx - 78},${fyy - 20} Q${fx - 20},${fyy - 38} ${fx + 56},${fyy - 24}`} fill="none" stroke={tones.highlight} strokeWidth={9} strokeLinecap="round" />
        {!simplified && <CrumbScatter seedKey={slug + ':batter'} cx={fx} cy={fyy + 2} rx={84} ry={28} n={8} color={tones.shade} rMax={3.5} />}
      </g>
      {chips}
      {!simplified && <CrumbScatter seedKey={slug + ':crumbs'} cx={cx + 30} cy={cy + 74} rx={92} ry={54} n={6} color="#d9a05c" rMax={3.5} />}
      <ToppingScatter slug={slug} ids={toppingIds} cx={fx} cy={fyy + 4} clipR={56} rimR={134} size={32} simplified={simplified} />
      {!simplified && <Steam x={cx - 20} y={54} scale={0.7} />}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* egg-brunch — fried eggs on toast + sides.                           */
/* ------------------------------------------------------------------ */
export function EggBrunch({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':brunch');
  const simplified = size < SIMPLIFY_BELOW;
  const cx = 200, cy = 202;
  const toastRot = -10 + rnd() * 10;
  const twoToast = !simplified && rnd() > 0.4;
  const eggN = simplified ? 1 : 2;
  const toast = (x: number, y: number, s: number, r: number, key: string) => (
    <g key={key} transform={`rotate(${r} ${x} ${y})`}>
      <rect x={x - s / 2} y={y - s / 2} width={s} height={s} rx={18} fill={BREAD_CRUST} stroke={INK} strokeWidth={SW.macro} />
      <rect x={x - s / 2 + 13} y={y - s / 2 + 13} width={s - 26} height={s - 26} rx={11} fill={BREAD_CRUMB} />
    </g>
  );
  return (
    <>
      <CardWash tones={tones} />
      <TopPlate tones={tones} />
      {twoToast && toast(cx + 10, cy - 50, 132, toastRot + 12, 't2')}
      {toast(cx - 42, cy - 24, 140, toastRot, 't1')}
      <FriedEgg seedKey={slug + ':egg1'} cx={cx + 38} cy={cy + 34} s={46} />
      {eggN > 1 && <FriedEgg seedKey={slug + ':egg2'} cx={cx - 46} cy={cy + 58} s={40} />}
      <ToppingScatter slug={slug} ids={toppingIds} cx={cx - 8} cy={cy + 8} clipR={86} rimR={134} size={34} simplified={simplified} />
      {!simplified && <CrumbScatter seedKey={slug + ':pepper'} cx={cx + 10} cy={cy + 40} rx={60} ry={34} n={4} color={INK} rMax={2.4} />}
      {!simplified && <Steam x={cx + 16} y={54} scale={0.65} />}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* shakshuka — iron pan, red sauce, nestled eggs.                      */
/* ------------------------------------------------------------------ */
export function Shakshuka({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':shak');
  const simplified = size < SIMPLIFY_BELOW;
  const cx = 190, cy = 202;
  const handleA = -14 + rnd() * 28;
  const eggN = simplified ? 2 : 3;
  const start = rnd() * Math.PI * 2;
  const eggs: ReactNode[] = [];
  for (let i = 0; i < eggN; i++) {
    const a = start + (i / eggN) * Math.PI * 2 + (rnd() - 0.5) * 0.5;
    const rr = 46 + rnd() * 16;
    eggs.push(
      <FriedEgg key={i} seedKey={`${slug}:egg${i}`} cx={cx + Math.cos(a) * rr} cy={cy + Math.sin(a) * rr * 0.92} s={30 + rnd() * 6} />
    );
  }
  return (
    <>
      <CardWash tones={tones} />
      <PanIron tones={tones} cx={cx} cy={cy} handleAngle={handleA} />
      <path d={blob(slug + ':sauce', cx, cy, 106, 0.08, 9)} fill={tones.food} stroke={INK} strokeWidth={SW.macro} strokeLinejoin="round" />
      <Gloss cx={cx - 4} cy={cy - 6} rx={82} ry={68} tint={tones.tint} />
      {eggs}
      <ToppingScatter slug={slug} ids={toppingIds} cx={cx} cy={cy} clipR={84} rimR={124} size={32} simplified={simplified} />
      {!simplified && <Steam x={cx + 6} y={50} scale={0.8} />}
    </>
  );
}

export const PLATES_FORMS: Record<string, DishTemplate> = {
  'salad-plate': (p) => <SaladPlate {...p} />,
  'roast-plate': (p) => <RoastPlate {...p} />,
  'roast-plate-steak': (p) => <RoastPlateSteak {...p} />,
  'roast-plate-chicken': (p) => <RoastPlateChicken {...p} />,
  'roast-plate-lamb': (p) => <RoastPlateLamb {...p} />,
  'roast-plate-fish': (p) => <RoastPlateFish {...p} />,
  'roast-chicken': (p) => <RoastChook {...p} />,
  'fish-chips': (p) => <FishChips {...p} />,
  'egg-brunch': (p) => <EggBrunch {...p} />,
  'shakshuka': (p) => <Shakshuka {...p} />,
};
