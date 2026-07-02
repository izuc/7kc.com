import { ReactNode } from 'react';
import { INK, SW, PLATE_FACE, PLATE_RIM, CHAR, SIMPLIFY_BELOW } from '../tokens';
import { CardWash, SidePlate, TopBowl, Gloss, CrumbScatter } from '../primitives';
import { stampFor } from '../toppings';
import { rngFor } from '../seed';
import { mix } from '../palette';
import { DishProps, DishTemplate } from '../types';

/**
 * Sweets-family dish templates (Ink & Cream language): ramekin desserts,
 * pavlova cloud, poached pears, smoothie bowl and layered oats jar. Reference
 * geometry: docs/art-exploration/direction-svgs.json (dirA) + dirB gloss.
 */

// ---- tiny local helpers ----

/** Relative luminance of a hex colour (0..1) — picks brûlée vs mousse styling. */
function luma(hex: string): number {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/** Point on a circle (degrees). */
function pol(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
}

function arcPath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const [x0, y0] = pol(cx, cy, r, a0);
  const [x1, y1] = pol(cx, cy, r, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1}`;
}

/** Hand-place one topping stamp (100-box) at (x,y) scaled to s px. */
function stampAt(id: string, x: number, y: number, s: number, v: number, rot = 0, key?: string): ReactNode {
  const st = stampFor(id);
  if (!st) return null;
  return (
    <g key={key ?? `${id}-${Math.round(x)}-${Math.round(y)}`} transform={`translate(${x - s / 2} ${y - s / 2}) rotate(${rot} ${s / 2} ${s / 2}) scale(${s / 100})`}>
      {st.draw(v)}
    </g>
  );
}

const isRim = (id: string) => stampFor(id)?.kind === 'rim';
/** Raw-only ingredients that never sit visibly on a finished dessert. */
const HIDDEN = new Set(['eggs', 'yoghurt', 'sour_cream']);
const visibleToppings = (ids: string[]) => ids.filter((id) => !HIDDEN.has(id) && stampFor(id));

// ---------------------------------------------------------------------------
// ramekin — side-view fluted ramekin on a saucer. Light food tone → brûlée
// (caramelised top, crack lines, hard gloss); dark → piped rosette swirl.
// ---------------------------------------------------------------------------
export function Ramekin({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':ramekin');
  const simplified = size < SIMPLIFY_BELOW;
  const brulee = luma(tones.food) > 0.6;
  const surfY = 167;

  // fluting lines between the lip and the base
  const flutes = (simplified ? [1, 3, 5] : [1, 2, 3, 4, 5, 6]).map((i) => {
    const t = i / 7;
    const xt = 88 + (312 - 88) * t;
    const xb = 116 + (284 - 116) * t;
    return <line key={i} x1={xt} y1={186} x2={xb} y2={290} stroke={PLATE_RIM} strokeWidth={5} />;
  });

  // piped mousse dome (dark variant): smooth dome + swirl grooves + cream dollop
  const domeJx = Math.floor((rnd() - 0.5) * 14);
  const dome = (
    <>
      <path d="M118,168 Q116,130 162,118 Q198,96 240,118 Q286,128 282,168 Z" fill={tones.food} stroke={INK} strokeWidth={SW.macro} strokeLinejoin="round" />
      <g fill="none" stroke={tones.tint} strokeWidth={4.5} strokeLinecap="round" opacity={0.95}>
        <path d="M134,152 Q198,134 264,154" />
        <path d="M154,132 Q202,114 248,134" />
      </g>
      <ellipse cx={160} cy={134} rx={13} ry={18} fill={tones.highlight} opacity={0.6} transform="rotate(24 160 134)" />
      <ellipse cx={200 + domeJx} cy={110} rx={20} ry={11} fill="#fffdf8" stroke={INK} strokeWidth={4} />
      <path d={`M${194 + domeJx},104 Q${198 + domeJx},93 ${208 + domeJx},97 Q${211 + domeJx},104 ${205 + domeJx},106`} fill="#fffdf8" stroke={INK} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
    </>
  );

  const caramel = mix(tones.food, '#b45309', 0.52);
  const crackJx = (rnd() - 0.5) * 16;
  const bruleeTop = (
    <>
      <ellipse cx={200} cy={surfY} rx={110} ry={14} fill={caramel} stroke={INK} strokeWidth={SW.topping} />
      <path d={`M${118 + crackJx},166 L${148 + crackJx},161 L${182 + crackJx},170 L${218 + crackJx},162 L${250 + crackJx},169 L${276 + crackJx},164`} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" opacity={0.55} />
      {!simplified && (
        <path d={`M${162 - crackJx},173 L${196 - crackJx},176 L${228 - crackJx},171`} fill="none" stroke={INK} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.4} />
      )}
      <path d="M126,163 Q168,153 224,156" fill="none" stroke="#ffffff" strokeWidth={7} strokeLinecap="round" opacity={0.55} />
      <circle cx={244} cy={160} r={4} fill="#ffffff" opacity={0.6} />
    </>
  );

  // hand-placed surface toppings (chocolate shards on mousse, raisins on rice pudding…)
  const ids = visibleToppings(toppingIds).filter((id) => !isRim(id)).slice(0, 2);
  const stamps: ReactNode[] = [];
  ids.forEach((id, i) => {
    const copies = simplified ? 1 : 2;
    for (let c = 0; c < copies; c++) {
      const side = (i + c) % 2 === 0 ? -1 : 1;
      const x = 200 + side * (46 + rnd() * 38);
      const y = brulee ? 160 + rnd() * 12 : 140 + rnd() * 18;
      stamps.push(stampAt(id, x, y, 31 + rnd() * 8, rnd(), rnd() * 40 - 20, `${id}-${i}-${c}`));
    }
  });

  return (
    <>
      <CardWash tones={tones} />
      <SidePlate tones={tones} cx={200} cy={308} rx={140} ry={26} />
      <path d="M86,172 L114,288 Q117,300 130,300 L270,300 Q283,300 286,288 L314,172 Z" fill={PLATE_FACE} stroke={INK} strokeWidth={SW.macro} strokeLinejoin="round" />
      {flutes}
      <rect x={76} y={152} width={248} height={30} rx={15} fill={PLATE_FACE} stroke={INK} strokeWidth={SW.macro} />
      {brulee ? bruleeTop : (
        <>
          <ellipse cx={200} cy={surfY} rx={110} ry={14} fill={tones.food} stroke={INK} strokeWidth={SW.topping} />
          {dome}
        </>
      )}
      {stamps}
      {!simplified && (
        <g fill={tones.shade} opacity={0.7}>
          <circle cx={166 + rnd() * 10} cy={172} r={2} />
          <circle cx={236 + rnd() * 10} cy={174} r={2} />
          <circle cx={206 + rnd() * 10} cy={163} r={1.8} />
        </g>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// pavlova-cloud — lobed meringue mound on a plate, cream layer, fruit
// cascading down the front, coulis drips in tones.food.
// ---------------------------------------------------------------------------
export function PavlovaCloud({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':pav');
  const simplified = size < SIMPLIFY_BELOW;
  const j = () => (rnd() - 0.5) * 12;

  const cloud = [
    `M${80 + j()},288`,
    `C58,246 ${66 + j()},204 98,192`,
    `C${88 + j()},158 120,140 ${150 + j()},150`,
    `C160,120 ${206 + j()},116 224,138`,
    `C${252 + j()},118 286,142 ${288 + j()},168`,
    'C320,178 330,214 316,252',
    'C334,270 326,288 306,290',
    'Q268,302 232,292 Q196,304 160,292 Q120,302 80,288 Z',
  ].join(' ');

  const ids = visibleToppings(toppingIds);
  const rimIds = ids.filter(isRim);
  const cascadeIds = ids.filter((id) => !isRim(id));
  const spots: Array<[number, number, number]> = [
    [202, 148, 46], [246, 168, 42], [164, 166, 42], [224, 190, 35], [148, 190, 32],
  ];
  const stamps = spots.slice(0, simplified ? 3 : 5).map(([x, y, s], i) => {
    if (!cascadeIds.length) return null;
    const id = cascadeIds[i % cascadeIds.length];
    return stampAt(id, x + (rnd() - 0.5) * 12, y + (rnd() - 0.5) * 8, s, rnd(), rnd() * 44 - 22, `casc-${i}`);
  });

  // coulis splash under the fruit anchors the recipe colour; drips fall from it
  const cjx = j();
  const coulis = (
    <path
      d={`M${148 + cjx},164 Q${156 + cjx},146 ${186 + cjx},150 Q${208 + cjx},140 ${232 + cjx},150 Q${262 + cjx},148 ${258 + cjx},166 Q${244 + cjx},180 ${212 + cjx},175 Q${180 + cjx},184 ${148 + cjx},164 Z`}
      fill={tones.food} stroke={INK} strokeWidth={4} strokeLinejoin="round" opacity={0.95}
    />
  );

  const drips = [
    [230 + cjx, 178], [186 + cjx, 181], [256 + cjx, 168],
  ].map(([x, y], i) => (
    <path key={i} d={`M${x},${y} q${i % 2 ? -4 : 5},${12 + rnd() * 6} ${i % 2 ? 2 : -2},${20 + rnd() * 6}`} fill="none" stroke={tones.food} strokeWidth={7} strokeLinecap="round" opacity={0.92} />
  ));

  return (
    <>
      <CardWash tones={tones} />
      <SidePlate tones={tones} cx={200} cy={312} rx={150} ry={28} />
      <path d={cloud} fill="#faf1da" stroke={INK} strokeWidth={SW.macro} strokeLinejoin="round" />
      <path d="M96,246 Q84,210 104,182" fill="none" stroke="#ffffff" strokeWidth={8} strokeLinecap="round" opacity={0.6} />
      {!simplified && (
        <g fill="none" stroke="#ecd9ae" strokeWidth={5} strokeLinecap="round">
          <path d="M124,244 Q138,216 130,196" />
          <path d="M290,242 Q276,218 284,198" />
        </g>
      )}
      <path d="M118,178 C126,150 168,138 200,142 C238,134 272,152 278,176 Q262,192 236,184 Q222,196 200,188 Q178,198 158,186 Q134,194 118,178 Z" fill="#fffdf8" stroke={INK} strokeWidth={SW.topping} strokeLinejoin="round" />
      {coulis}
      {!simplified && drips}
      {stamps}
      {rimIds.length > 0 && stampAt(rimIds[0], 306, 298, 42, rnd(), 0, 'rim')}
      {!simplified && <CrumbScatter seedKey={slug + ':pav'} cx={200} cy={302} rx={112} ry={9} n={5} color="#eadcba" />}
    </>
  );
}

// ---------------------------------------------------------------------------
// poached-fruit — two glossy poached pears standing in a syrup pool.
// ---------------------------------------------------------------------------
function pearPath(cx: number, baseY: number, w: number, h: number, lean: number): string {
  const tipX = cx + lean, tipY = baseY - h;
  return [
    `M${cx},${baseY}`,
    `C${cx - w * 0.62},${baseY} ${cx - w * 0.6},${baseY - w * 0.8} ${cx - w * 0.24},${baseY - w * 0.92}`,
    `C${tipX - w * 0.11},${tipY + h * 0.32} ${tipX - w * 0.09},${tipY + h * 0.09} ${tipX},${tipY}`,
    `C${tipX + w * 0.09},${tipY + h * 0.09} ${tipX + w * 0.11},${tipY + h * 0.32} ${cx + w * 0.24},${baseY - w * 0.92}`,
    `C${cx + w * 0.6},${baseY - w * 0.8} ${cx + w * 0.62},${baseY} ${cx},${baseY} Z`,
  ].join(' ');
}

function Pear({ cx, baseY, w, h, lean, tones }: { cx: number; baseY: number; w: number; h: number; lean: number; tones: DishProps['tones'] }) {
  const tipX = cx + lean, tipY = baseY - h;
  return (
    <>
      <path d={pearPath(cx, baseY, w, h, lean)} fill={tones.food} stroke={INK} strokeWidth={SW.macro} strokeLinejoin="round" />
      <ellipse cx={cx - w * 0.17} cy={baseY - w * 0.55} rx={w * 0.15} ry={w * 0.27} fill={tones.tint} opacity={0.85} transform={`rotate(-16 ${cx - w * 0.17} ${baseY - w * 0.55})`} />
      <circle cx={cx - w * 0.2} cy={baseY - w * 0.78} r={5} fill="#ffffff" opacity={0.65} />
      <path d={`M${tipX},${tipY} q7,-17 18,-23`} fill="none" stroke={INK} strokeWidth={5.5} strokeLinecap="round" />
    </>
  );
}

function StarAnise({ x, y }: { x: number; y: number }) {
  const spokes: ReactNode[] = [];
  for (let i = 0; i < 8; i++) {
    const [dx, dy] = pol(0, 0, 13, i * 45 + 22);
    spokes.push(<line key={i} x1={x} y1={y} x2={x + dx} y2={y + dy * 0.6} stroke={CHAR} strokeWidth={4.5} strokeLinecap="round" />);
  }
  return <g>{spokes}<circle cx={x} cy={y} r={3.2} fill={INK} /></g>;
}

export function PoachedFruit({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':pears');
  const simplified = size < SIMPLIFY_BELOW;
  const lean1 = (rnd() - 0.5) * 16;
  const lean2 = (rnd() - 0.5) * 20;
  const ids = visibleToppings(toppingIds).filter((id) => id !== 'pear');
  const rimIds = ids.filter(isRim);
  const nutId = ids.find((id) => !isRim(id));

  const nuts = nutId
    ? [[118, 306], [208, 318], [298, 298]].slice(0, simplified ? 2 : 3).map(([x, y], i) =>
        stampAt(nutId, x + (rnd() - 0.5) * 12, y + (rnd() - 0.5) * 6, 25 + rnd() * 6, rnd(), rnd() * 50 - 25, `nut-${i}`))
    : null;

  return (
    <>
      <CardWash tones={tones} />
      <SidePlate tones={tones} cx={200} cy={306} rx={146} ry={28} />
      <ellipse cx={200} cy={296} rx={116} ry={20} fill={tones.food} stroke={INK} strokeWidth={SW.macro} />
      <Pear cx={160} baseY={298} w={98} h={150 + rnd() * 10} lean={lean1} tones={tones} />
      <Pear cx={254} baseY={295} w={80} h={114 + rnd() * 10} lean={lean2} tones={tones} />
      <path d="M84,296 A116,20 0 0 0 316,296 Z" fill={tones.food} />
      <path d="M84,296 A116,20 0 0 0 316,296" fill="none" stroke={INK} strokeWidth={SW.macro} />
      <Gloss cx={200} cy={303} rx={84} ry={9} tint={tones.tint} rot={-6} />
      {!simplified && <StarAnise x={142 + (rnd() - 0.5) * 24} y={321} />}
      {nuts}
      {rimIds.length > 0 && stampAt(rimIds[0], 318, 286, 44, rnd(), 0, 'rim')}
    </>
  );
}

// ---------------------------------------------------------------------------
// smoothie-bowl — top-down bowl, thick swirled base, toppings in neat arc ROWS
// (the one form where toppings arrange, not scatter).
// ---------------------------------------------------------------------------
export function SmoothieBowl({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':smoothie');
  const simplified = size < SIMPLIFY_BELOW;
  const cx = 200, cy = 202;
  const A0 = rnd() * 360;

  const ids = visibleToppings(toppingIds).filter((id) => !isRim(id));
  const rows = ids.slice(0, simplified ? 2 : 4);
  const radii = [96, 68, 42, 18];
  const gaps = [26, 32, 44, 70];
  const sizes = [40, 35, 31, 26];
  const rowStamps = rows.map((id, k) => {
    const n = Math.max(2, (simplified ? 4 : 5) - k);
    const rowJ = (rnd() - 0.5) * 8;
    const items: ReactNode[] = [];
    for (let i = 0; i < n; i++) {
      const a = A0 + rowJ + (i - (n - 1) / 2) * gaps[k];
      const [x, y] = pol(cx, cy, radii[k], a);
      items.push(stampAt(id, x, y, sizes[k] * (0.92 + rnd() * 0.16), rnd(), rnd() * 36 - 18, `${id}-${k}-${i}`));
    }
    return <g key={id + k}>{items}</g>;
  });

  // exposed swirl crescents on the opposite side of the rows + chia sprinkle
  const SA = A0 + 180;
  const [dotX, dotY] = pol(cx, cy, 42, SA - 8);
  const seeds: ReactNode[] = [];
  if (!simplified) {
    for (let i = 0; i < 9; i++) {
      const a = SA - 62 + i * 15 + (rnd() - 0.5) * 7;
      const [x, y] = pol(cx, cy, 96 + (rnd() - 0.5) * 14, a);
      seeds.push(<circle key={i} cx={x} cy={y} r={2} fill="#3a2b20" opacity={0.75} />);
    }
  }

  return (
    <>
      <CardWash tones={tones} />
      <TopBowl tones={tones} foodR={118} foodFill={tones.food} />
      <path d={arcPath(cx, cy, 58, SA - 74, SA + 72)} fill="none" stroke={tones.tint} strokeWidth={13} strokeLinecap="round" />
      <path d={arcPath(cx, cy, 31, SA - 52, SA + 56)} fill="none" stroke={tones.highlight} strokeWidth={9} strokeLinecap="round" />
      <circle cx={dotX} cy={dotY} r={5.5} fill="#ffffff" opacity={0.6} />
      {seeds}
      {rowStamps}
    </>
  );
}

// ---------------------------------------------------------------------------
// oats-jar — side-view glass jar with visible layers: oats, yoghurt band,
// fruit compote top with stamped fruit.
// ---------------------------------------------------------------------------
export function OatsJar({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':jar');
  const simplified = size < SIMPLIFY_BELOW;
  const j = () => (rnd() - 0.5) * 8;

  const fruitTop = `M109,${150 + j()} Q142,138 178,${146 + j()} Q216,153 252,${144 + j()} Q276,140 291,148 L291,330 L109,330 Z`;
  const yog = `M109,${202 + j()} Q148,192 188,${201 + j()} Q230,210 264,${200 + j()} Q280,197 291,202 L291,330 L109,330 Z`;
  const oats = `M109,${256 + j()} Q144,247 182,${255 + j()} Q224,263 258,${253 + j()} Q278,249 291,256 L291,302 Q291,326 265,326 L135,326 Q109,326 109,302 Z`;

  const flecks = !simplified && (
    <g fill="#c69a58">
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const x = 122 + rnd() * 152, y = 266 + rnd() * 50, a = rnd() * 60 - 30;
        return <rect key={i} x={x} y={y} width={13} height={5.5} rx={2.7} transform={`rotate(${a} ${x + 6} ${y + 3})`} />;
      })}
    </g>
  );

  const ids = visibleToppings(toppingIds).filter((id) => !isRim(id));
  const slots = simplified ? 2 : 3;
  const stamps = ids.length
    ? Array.from({ length: slots }, (_, i) =>
        stampAt(ids[i % ids.length], 152 + i * 50 + rnd() * 10, 154 + (rnd() - 0.5) * 10, 37 + rnd() * 8, rnd(), rnd() * 24 - 12, `top-${i}`))
    : null;

  return (
    <>
      <CardWash tones={tones} />
      <ellipse cx={207} cy={336} rx={118} ry={16} fill={tones.shadow} />
      <rect x={104} y={124} width={192} height={206} rx={24} fill="#f7f0e0" stroke={INK} strokeWidth={SW.macro} />
      <path d={fruitTop} fill={tones.food} />
      <Gloss cx={200} cy={172} rx={64} ry={16} tint={tones.tint} rot={-8} />
      <path d={yog} fill="#fffdf6" />
      <path d={oats} fill="#e9c98c" />
      {flecks}
      <path d="M126,158 Q120,222 126,296" fill="none" stroke="#ffffff" strokeWidth={7} strokeLinecap="round" opacity={0.38} />
      {!simplified && <path d="M140,146 Q138,168 140,190" fill="none" stroke="#ffffff" strokeWidth={5} strokeLinecap="round" opacity={0.3} />}
      <rect x={104} y={124} width={192} height={206} rx={24} fill="none" stroke={INK} strokeWidth={SW.macro} />
      <rect x={94} y={106} width={212} height={26} rx={13} fill={PLATE_FACE} stroke={INK} strokeWidth={SW.macro} />
      {stamps}
      {!simplified && <CrumbScatter seedKey={slug + ':jar'} cx={202} cy={344} rx={130} ry={9} n={5} color="#c69a58" />}
    </>
  );
}

export const SWEETS_FORMS: Record<string, DishTemplate> = {
  'ramekin': (p) => <Ramekin {...p} />,
  'pavlova-cloud': (p) => <PavlovaCloud {...p} />,
  'poached-fruit': (p) => <PoachedFruit {...p} />,
  'smoothie-bowl': (p) => <SmoothieBowl {...p} />,
  'oats-jar': (p) => <OatsJar {...p} />,
};
