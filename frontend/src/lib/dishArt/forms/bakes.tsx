import { ReactNode } from 'react';
import { INK, SW, SIMPLIFY_BELOW, PLATE_FACE, CREAM_FOOD } from '../tokens';
import {
  CardWash, TopPlate, SidePlate, PanIron, BoardRound, BakingDishTop,
  Gloss, SheenArc, Steam, CrumbScatter, wedge, wedgeShift,
} from '../primitives';
import { ToppingScatter, stampFor } from '../toppings';
import { rngFor, scatter } from '../seed';
import { mix, lighten, darken } from '../palette';
import { DishProps, DishTemplate } from '../types';

/**
 * Bake-family templates: pizza, pies, tarts, cakes, loaves, traybakes, cookies,
 * scones, clafoutis, borek. Ink & Cream language (see docs/DISH-ART-PLAN.md):
 * flat food-first silhouettes, one lighter offset highlight per element, the
 * dirC pulled-slice wedge on discs and the dirD "one eaten" beat on traybakes.
 */

const PASTRY = '#e2ae62';
const PASTRY_HI = '#f7d69a';

/** Crimped/fluted circle: n scallop bumps of ~`depth` around radius r. */
function scallopPath(cx: number, cy: number, r: number, n: number, depth: number, start = 0): string {
  const A = (i: number) => start + (i / n) * Math.PI * 2;
  let d = `M${cx + Math.cos(A(0)) * r},${cy + Math.sin(A(0)) * r}`;
  for (let i = 1; i <= n; i++) {
    const m = A(i - 0.5), a = A(i);
    d += ` Q${cx + Math.cos(m) * (r + depth * 2)},${cy + Math.sin(m) * (r + depth * 2)} ${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`;
  }
  return d + ' Z';
}

/** Hand-place one topping stamp (same transform contract as ToppingScatter). */
function stampAt(id: string, x: number, y: number, s: number, v: number, rot = 0): ReactNode {
  const st = stampFor(id);
  if (!st) return null;
  return (
    <g transform={`translate(${x - s / 2} ${y - s / 2}) rotate(${rot} ${s / 2} ${s / 2}) scale(${s / 100})`}>
      {st.draw(v)}
    </g>
  );
}

const firstStampable = (ids: string[], excludeRim = true): string | undefined =>
  ids.find((id) => {
    const st = stampFor(id);
    return !!st && (!excludeRim || st.kind !== 'rim');
  });

/** Only small repeatable bits — for stamping INTO cookies/cakes/scones. */
const scatterOnly = (ids: string[]): string[] => ids.filter((id) => stampFor(id)?.kind === 'scatter');

// ---------------------------------------------------------------------------
// pizza-whole — board, blond crust ring, red sauce disc, melted mozzarella
// blobs, toppings stamped in, and THE pulled-slice wedge (dirA geometry).
// ---------------------------------------------------------------------------
export function PizzaWhole({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':pizza');
  const simplified = size < SIMPLIFY_BELOW;
  const cx = 200, cy = 202;
  const crustR = 118;
  const sauceR = 86 + rnd() * 5;
  const a0 = 18 + rnd() * 70, a1 = a0 + 46;
  const CRUST = '#e9b566', CHEESE = '#fbf3e0', BOARD = '#e0b174';
  const blobD = 'M-20,-13 C-8,-24 12,-21 19,-8 C24,6 13,18 -3,18 C-19,18 -27,-2 -20,-13 Z';

  const char = simplified ? null : (
    <g fill="#c98a3c">
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = rnd() * Math.PI * 2;
        const rr = crustR - 13 - rnd() * 6;
        return <ellipse key={i} cx={cx + Math.cos(a) * rr} cy={cy + Math.sin(a) * rr} rx={7.5} ry={5} transform={`rotate(${Math.floor(rnd() * 180)} ${cx + Math.cos(a) * rr} ${cy + Math.sin(a) * rr})`} />;
      })}
    </g>
  );

  const blobs = scatter(slug + ':cheese', simplified ? 3 : 5, { cx, cy, rMin: 14, rMax: sauceR - 30 }).map((p, i) => (
    <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${p.rot}) scale(${0.85 + p.r01 * 0.35})`}>
      <path d={blobD} fill={CHEESE} stroke={INK} strokeWidth={SW.topping} strokeLinejoin="round" />
    </g>
  ));

  const mid = ((a0 + a1) / 2) * (Math.PI / 180);
  const oil = simplified ? null : (
    <g fill="#f8b64a" opacity={0.9}>
      {[0, 1, 2].map((i) => {
        const a = rnd() * Math.PI * 2, rr = rnd() * (sauceR - 24);
        return <circle key={i} cx={cx + Math.cos(a) * rr} cy={cy + Math.sin(a) * rr} r={3.5 + rnd() * 1.5} />;
      })}
    </g>
  );

  return (
    <>
      <CardWash tones={tones} />
      <BoardRound tones={tones} r={154} />
      <circle cx={cx} cy={cy} r={crustR} fill={CRUST} stroke={INK} strokeWidth={SW.macro} />
      <SheenArc cx={cx} cy={cy} r={crustR * 0.87} from={198} to={262} color={PASTRY_HI} width={11} opacity={1} />
      {char}
      <circle cx={cx} cy={cy} r={sauceR} fill={tones.food} stroke={INK} strokeWidth={SW.macro} />
      <SheenArc cx={cx} cy={cy} r={sauceR * 0.76} from={202} to={258} color={tones.tint} width={11} opacity={0.95} />
      {blobs}
      {oil}
      <ToppingScatter slug={slug} ids={toppingIds} cx={cx} cy={cy} clipR={sauceR - 18} rimR={crustR + 14} size={34} simplified={simplified} />
      {/* the pulled slice: cover the gap with board, slide the wedge out */}
      <path d={wedge(cx, cy, crustR + 4, a0, a1)} fill={BOARD} stroke={INK} strokeWidth={SW.topping} strokeLinejoin="round" />
      <g transform={wedgeShift(a0, a1, 32)}>
        <path d={wedge(cx, cy, crustR, a0 + 4, a1 - 4)} fill={CRUST} stroke={INK} strokeWidth={SW.macro} strokeLinejoin="round" />
        <path d={wedge(cx, cy, crustR - 24, a0 + 9, a1 - 9)} fill={tones.food} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <g transform={`translate(${cx + Math.cos(mid) * crustR * 0.55} ${cy + Math.sin(mid) * crustR * 0.55}) rotate(${Math.floor(rnd() * 90)}) scale(0.75)`}>
          <path d={blobD} fill={CHEESE} stroke={INK} strokeWidth={SW.topping} strokeLinejoin="round" />
        </g>
      </g>
    </>
  );
}

// ---------------------------------------------------------------------------
// pie-whole — golden crimped lid, steam vents, one cut slot showing the
// filling in tones.food, the slice pulled onto the plate.
// ---------------------------------------------------------------------------
export function PieWhole({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':pie');
  const simplified = size < SIMPLIFY_BELOW;
  const cx = 200, cy = 202, pieR = 100;
  const lid = mix(tones.food, '#eebc72', 0.6);
  const lidHi = lighten(lid, 0.13);
  const crustEdge = darken(lid, 0.14);
  const n = 18 + Math.floor(rnd() * 5);
  const a0 = 22 + rnd() * 50, a1 = a0 + 54;
  const ventRot = Math.floor(rnd() * 90);
  const mid = ((a0 + a1) / 2) * (Math.PI / 180);
  const fillId = firstStampable(toppingIds);

  return (
    <>
      <CardWash tones={tones} />
      <TopPlate tones={tones} r={148} />
      <path d={scallopPath(cx, cy, pieR, n, 9, rnd() * Math.PI)} fill={lid} stroke={INK} strokeWidth={SW.macro} strokeLinejoin="round" />
      <ellipse cx={cx - 26} cy={cy - 30} rx={36} ry={26} fill={lidHi} opacity={0.75} />
      <SheenArc cx={cx} cy={cy} r={pieR * 0.84} from={200} to={252} color={lidHi} width={9} opacity={0.9} />
      <g transform={`rotate(${ventRot} ${cx} ${cy})`} stroke={INK} strokeWidth={4.5} strokeLinecap="round">
        {[0, 90, 180, 270].map((a) => (
          <line key={a} x1={cx + Math.cos((a * Math.PI) / 180) * 18} y1={cy + Math.sin((a * Math.PI) / 180) * 18} x2={cx + Math.cos((a * Math.PI) / 180) * 44} y2={cy + Math.sin((a * Math.PI) / 180) * 44} />
        ))}
      </g>
      {/* the cut slot: filling revealed, darker toward the centre for depth */}
      <path d={wedge(cx, cy, pieR + 12, a0, a1)} fill={tones.food} stroke={INK} strokeWidth={SW.macro} strokeLinejoin="round" />
      <path d={wedge(cx, cy, pieR * 0.5, a0 + 2, a1 - 2)} fill={tones.shade} opacity={0.6} />
      <Gloss cx={cx + Math.cos(mid) * pieR * 0.62} cy={cy + Math.sin(mid) * pieR * 0.62} rx={22} ry={14} tint={tones.tint} />
      {!simplified && fillId && stampAt(fillId, cx + Math.cos(mid) * pieR * 0.68, cy + Math.sin(mid) * pieR * 0.68, 30, rnd(), Math.floor(rnd() * 40) - 20)}
      {/* the pulled slice — shifted out AND gently swung so it never reads as an arrow */}
      <g transform={`${wedgeShift(a0, a1, 52)} rotate(8 ${cx} ${cy})`}>
        <path d={wedge(cx, cy, pieR, a0 + 10, a1 - 10)} fill={lid} stroke={INK} strokeWidth={SW.macro} strokeLinejoin="round" />
        <path d={`M${cx + Math.cos(((a0 + 10) * Math.PI) / 180) * (pieR - 8)},${cy + Math.sin(((a0 + 10) * Math.PI) / 180) * (pieR - 8)} A${pieR - 8},${pieR - 8} 0 0 1 ${cx + Math.cos(((a1 - 10) * Math.PI) / 180) * (pieR - 8)},${cy + Math.sin(((a1 - 10) * Math.PI) / 180) * (pieR - 8)}`} fill="none" stroke={crustEdge} strokeWidth={6} strokeLinecap="round" />
      </g>
      {!simplified && <Steam x={cx + 4} y={64} scale={0.7} />}
    </>
  );
}

// ---------------------------------------------------------------------------
// tart-slice — open coloured filling in a fluted pastry shell, one slice
// pulled out revealing the plate.
// ---------------------------------------------------------------------------
export function TartSlice({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':tart');
  const simplified = size < SIMPLIFY_BELOW;
  const cx = 200, cy = 202, shellR = 106, fillR = 87;
  const n = 24 + Math.floor(rnd() * 6);
  const a0 = 20 + rnd() * 55, a1 = a0 + 44;

  return (
    <>
      <CardWash tones={tones} />
      <TopPlate tones={tones} r={146} />
      <path d={scallopPath(cx, cy, shellR, n, 5.5, rnd() * Math.PI)} fill={PASTRY} stroke={INK} strokeWidth={SW.macro} strokeLinejoin="round" />
      <circle cx={cx} cy={cy} r={fillR} fill={tones.food} stroke={INK} strokeWidth={SW.topping} />
      <Gloss cx={cx} cy={cy} rx={fillR * 0.82} ry={fillR * 0.68} tint={tones.tint} />
      <ToppingScatter slug={slug} ids={toppingIds} cx={cx} cy={cy} clipR={fillR - 18} rimR={128} size={32} simplified={simplified} />
      {/* pulled slice: plate shows through the slot */}
      <path d={wedge(cx, cy, shellR + 8, a0, a1)} fill={PLATE_FACE} stroke={INK} strokeWidth={SW.macro} strokeLinejoin="round" />
      <g transform={wedgeShift(a0, a1, 32)}>
        <path d={wedge(cx, cy, shellR, a0 + 7, a1 - 7)} fill={PASTRY} stroke={INK} strokeWidth={SW.macro} strokeLinejoin="round" />
        <path d={wedge(cx, cy, shellR - 14, a0 + 12, a1 - 12)} fill={tones.food} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      </g>
    </>
  );
}

// ---------------------------------------------------------------------------
// cake-slice — side-view layer-cake slice on a plate, frosting cap, one bite
// missing from the top edge, crumbs on the plate (the fork-bite story).
// ---------------------------------------------------------------------------
export function CakeSlice({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':cake');
  const simplified = size < SIMPLIFY_BELOW;
  const layers = 2 + (rnd() > 0.5 ? 1 : 0);
  const topY = 122 + rnd() * 12;
  const baseY = 284;
  const L = 138, Rr = 266; // body left/right at the base
  const tilt = (rnd() - 0.5) * 4;
  const frost = '#fffaf0';
  const spongeHi = lighten(tones.food, 0.12);
  const h = baseY - topY;
  const frostH = 22;
  const gap = 12;
  const ts = (h - frostH - (layers - 1) * gap - 8) / layers;
  const topId = scatterOnly(toppingIds)[0];

  const bands: ReactNode[] = [];
  for (let i = 0; i < layers; i++) {
    const by = topY + frostH + i * (ts + gap);
    bands.push(
      <g key={i}>
        <rect x={L + 10} y={by} width={Rr - L - 20} height={ts} rx={5} fill={tones.food} />
        <rect x={L + 18} y={by + 4} width={34} height={Math.max(6, ts - 12)} rx={4} fill={spongeHi} opacity={0.8} />
      </g>
    );
  }

  // frosting drips over the first sponge layer
  const drips = simplified ? null : (
    <g fill={frost}>
      {[0, 1, 2].map((i) => {
        const dx = L + 26 + rnd() * (Rr - L - 60);
        const dh = 12 + rnd() * 14;
        return <path key={i} d={`M${dx},${topY + frostH - 2} L${dx},${topY + frostH + dh - 8} Q${dx + 5},${topY + frostH + dh} ${dx + 10},${topY + frostH + dh - 8} L${dx + 10},${topY + frostH - 2} Z`} />;
      })}
    </g>
  );

  const biteX = Rr - 34, biteR = 16;

  return (
    <>
      <CardWash tones={tones} />
      <SidePlate tones={tones} cy={294} />
      <g transform={`rotate(${tilt} 200 240)`}>
        <path
          d={`M${L + 6},${topY} L${L},${baseY} L${Rr},${baseY} L${Rr - 6},${topY} Q${Rr - 6},${topY - 8} ${Rr - 16},${topY - 8} L${L + 16},${topY - 8} Q${L + 6},${topY - 8} ${L + 6},${topY} Z`}
          fill={frost} stroke={INK} strokeWidth={SW.macro} strokeLinejoin="round"
        />
        {bands}
        {drips}
        {/* the bite: card halo shows through, ink arc closes the wound */}
        <circle cx={biteX} cy={topY - 6} r={biteR} fill={tones.halo} />
        <path d={`M${biteX - biteR},${topY - 6} A${biteR},${biteR} 0 0 0 ${biteX + biteR},${topY - 6}`} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
        {!simplified && topId && stampAt(topId, L + 52, topY - 18, 32, rnd(), Math.floor(rnd() * 30) - 15)}
        {!simplified && !topId && (
          <g fill={tones.food} opacity={0.8}>
            <circle cx={L + 40} cy={topY - 2} r={3.5} /><circle cx={L + 62} cy={topY + 3} r={3} /><circle cx={L + 82} cy={topY - 3} r={2.5} />
          </g>
        )}
      </g>
      <CrumbScatter seedKey={slug + ':cake'} cx={Rr + 24} cy={292} rx={30} ry={10} n={simplified ? 3 : 6} color={tones.shade} />
    </>
  );
}

// ---------------------------------------------------------------------------
// loaf-slice — side-view loaf with a cut face and two slices leaning against
// it, crumbs on the plate.
// ---------------------------------------------------------------------------
export function LoafSlice({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':loaf');
  const simplified = size < SIMPLIFY_BELOW;
  const crust = mix(tones.food, '#a5682c', 0.92);
  const crumbC = mix(tones.food, '#f7e8c8', 0.8);
  const crustHi = lighten(crust, 0.15);
  const speck = darken(crumbC, 0.18);
  const domeY = 158 + rnd() * 16;
  const lean1 = 10 + rnd() * 6, lean2 = 22 + rnd() * 6;

  const sliceShape = (
    <path d="M-26,50 L-26,-28 Q-26,-50 0,-50 Q26,-50 26,-28 L26,50 Z" fill={crumbC} stroke={INK} strokeWidth={SW.topping} strokeLinejoin="round" />
  );
  const sliceRim = <path d="M-26,-24 Q-26,-45 0,-45 Q26,-45 26,-24" fill="none" stroke={crust} strokeWidth={6} strokeLinecap="round" />;
  const specks = (key: string, n: number) => {
    const r = rngFor(slug + key);
    return (
      <g fill={speck}>
        {Array.from({ length: n }, (_, i) => (
          <circle key={i} cx={-14 + r() * 28} cy={-30 + r() * 66} r={2 + r() * 1.6} />
        ))}
      </g>
    );
  };

  return (
    <>
      <CardWash tones={tones} />
      <SidePlate tones={tones} cy={292} rx={150} />
      {/* loaf body */}
      <path d={`M92,274 L92,216 Q94,${domeY} 164,${domeY - 2} Q234,${domeY} 238,214 L238,274 Z`} fill={crust} stroke={INK} strokeWidth={SW.macro} strokeLinejoin="round" />
      <path d={`M108,198 Q116,${domeY + 12} 158,${domeY + 9}`} fill="none" stroke={crustHi} strokeWidth={8} strokeLinecap="round" />
      {!simplified && rnd() > 0.4 && (
        <path d={`M132,${domeY + 6} Q168,${domeY - 4} 204,${domeY + 8}`} fill="none" stroke={darken(crust, 0.14)} strokeWidth={4.5} strokeLinecap="round" />
      )}
      {/* cut face at the right end */}
      <path d="M202,274 L202,196 Q202,172 221,172 Q240,172 240,196 L240,274 Z" fill={crumbC} stroke={INK} strokeWidth={SW.topping} strokeLinejoin="round" />
      <path d="M206,194 Q206,177 221,177 Q236,177 236,194" fill="none" stroke={crust} strokeWidth={6} strokeLinecap="round" />
      {/* two slices leaning */}
      <g transform={`translate(282 232) rotate(${lean1})`}>
        {sliceShape}{sliceRim}{!simplified && specks(':sp1', 3)}
      </g>
      <g transform={`translate(316 242) rotate(${lean2})`}>
        {sliceShape}{sliceRim}{!simplified && specks(':sp2', 3)}
      </g>
      <ToppingScatter slug={slug} ids={toppingIds} cx={165} cy={192} clipR={52} rimR={120} size={28} simplified={simplified} />
      <CrumbScatter seedKey={slug + ':loaf'} cx={290} cy={296} rx={44} ry={10} n={simplified ? 3 : 7} color={crust} />
    </>
  );
}

// ---------------------------------------------------------------------------
// bake-dish — top-down baking dish, golden gratin top, ONE SCOOPED CORNER
// showing the interior in tones.food (9 recipes; seed + toppings vary it).
// ---------------------------------------------------------------------------
export function BakeDish({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':bake');
  const simplified = size < SIMPLIFY_BELOW;
  const x = 52, y = 82, w = 296, h = 240;
  const top = mix(tones.food, '#e9b96a', 0.66);
  const topHi = lighten(top, 0.12);
  const charC = darken(top, 0.22);
  const sy = y + h - 98 + rnd() * 12; // scoop entry on the right edge
  const bx = x + w - 118 - rnd() * 16; // scoop exit on the bottom edge
  const R = x + w - 14, B = y + h - 14;

  const mottle = simplified ? null : scatter(slug + ':mottle', 5, { cx: 180, cy: 188, rMin: 26, rMax: 86, squashY: 0.72 }).map((p, i) => (
    <ellipse key={i} cx={p.x} cy={p.y} rx={13 + p.r01 * 10} ry={8 + p.r01 * 6} fill={topHi} opacity={0.55} transform={`rotate(${(p.rot % 60) - 30} ${p.x} ${p.y})`} />
  ));
  const scorch = simplified ? null : scatter(slug + ':scorch', 4, { cx: 190, cy: 195, rMin: 46, rMax: 100, squashY: 0.7 }).map((p, i) => (
    <ellipse key={i} cx={p.x} cy={p.y} rx={7.5} ry={4.5} fill={charC} opacity={0.85} transform={`rotate(${(p.rot % 90) - 45} ${p.x} ${p.y})`} />
  ));

  return (
    <>
      <CardWash tones={tones} />
      <BakingDishTop tones={tones} x={x} y={y} w={w} h={h} />
      <rect x={x + 14} y={y + 14} width={w - 28} height={h - 28} rx={16} fill={top} stroke={INK} strokeWidth={SW.topping} />
      <ellipse cx={x + 92} cy={y + 66} rx={62} ry={34} fill={topHi} opacity={0.65} transform={`rotate(-12 ${x + 92} ${y + 66})`} />
      {mottle}
      {scorch}
      <ToppingScatter slug={slug} ids={toppingIds.filter((id) => stampFor(id)?.kind !== 'rim')} cx={182} cy={188} clipR={80} rimR={0} size={34} simplified={simplified} />
      {/* the scooped corner: interior revealed */}
      <path
        d={`M${R},${sy} C${R - 28},${sy + 4} ${bx + 34},${sy + 16} ${bx + 20},${B - sy > 60 ? sy + 42 : B - 22} C${bx + 8},${B - 14} ${bx + 2},${B - 4} ${bx},${B} L${R - 16},${B} Q${R},${B} ${R},${B - 16} Z`}
        fill={tones.food} stroke={INK} strokeWidth={SW.topping} strokeLinejoin="round"
      />
      <path
        d={`M${R - 6},${sy + 6} C${R - 26},${sy + 10} ${bx + 34},${sy + 20} ${bx + 24},${B - 20}`}
        fill="none" stroke={tones.shade} strokeWidth={7} strokeLinecap="round" opacity={0.8}
      />
      <Gloss cx={(R + bx) / 2 + 12} cy={(sy + B) / 2 + 10} rx={22} ry={15} tint={tones.tint} />
      <CrumbScatter seedKey={slug + ':bake'} cx={R + 22} cy={B + 34} rx={22} ry={12} n={simplified ? 3 : 6} color={top} />
      {!simplified && <Steam x={150} y={52} scale={0.65} />}
    </>
  );
}

// ---------------------------------------------------------------------------
// cookie-scatter — 5–7 cookies (round) or brownie-prism squares on a board,
// one missing with a crumb scatter (the dirD "one eaten" steal).
// ---------------------------------------------------------------------------
export function CookieScatter({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':cookies');
  const simplified = size < SIMPLIFY_BELOW;
  const roundCookies = /cookie|biscuit|anzac|snap|shortbread/.test(slug);
  const face = mix(tones.food, '#eabc6e', 0.62);
  const faceHi = lighten(face, 0.14);
  const crack = darken(face, 0.16);
  const topFace = lighten(tones.food, 0.1);
  const sideFace = darken(tones.food, 0.1);
  const drizzle = tones.highlight;
  const stampIds = scatterOnly(toppingIds);

  const startA = rnd() * Math.PI * 2;
  const slots: { x: number; y: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const a = startA + (i / 6) * Math.PI * 2;
    slots.push({ x: 200 + Math.cos(a) * 84 + (rnd() - 0.5) * 14, y: 204 + Math.sin(a) * 84 + (rnd() - 0.5) * 14 });
  }
  const seven = rnd() > 0.45;
  if (seven) slots.push({ x: 200 + (rnd() - 0.5) * 10, y: 204 + (rnd() - 0.5) * 10 });
  const missing = Math.floor(rnd() * slots.length);

  const items = slots.map((s, i) => {
    const v = rnd();
    if (i === missing) {
      return (
        <g key={i}>
          <CrumbScatter seedKey={`${slug}:gone${i}`} cx={s.x} cy={s.y} rx={30} ry={22} n={simplified ? 4 : 8} color={sideFace} rMax={5} />
          <ellipse cx={s.x - 8} cy={s.y + 6} rx={9} ry={5.5} fill={tones.food} transform={`rotate(${Math.floor(v * 90)} ${s.x - 8} ${s.y + 6})`} />
          <ellipse cx={s.x + 12} cy={s.y - 6} rx={7} ry={4.5} fill={sideFace} transform={`rotate(${Math.floor(v * 160)} ${s.x + 12} ${s.y - 6})`} />
        </g>
      );
    }
    const stampId = stampIds.length ? stampIds[i % stampIds.length] : undefined;
    if (roundCookies) {
      const r = 34 + v * 6;
      return (
        <g key={i}>
          <circle cx={s.x} cy={s.y} r={r} fill={face} stroke={INK} strokeWidth={SW.topping} />
          <SheenArc cx={s.x} cy={s.y} r={r * 0.66} from={200} to={255} color={faceHi} width={7} opacity={1} />
          {!simplified && !stampId && (
            <g fill={crack}>
              <circle cx={s.x - r * 0.28} cy={s.y + r * 0.2} r={2.6} />
              <circle cx={s.x + r * 0.3} cy={s.y + r * 0.34} r={2.2} />
              <circle cx={s.x + r * 0.12} cy={s.y - r * 0.3} r={2.4} />
            </g>
          )}
          {stampId && stampAt(stampId, s.x, s.y + 2, r * 1.35, v, Math.floor(v * 60) - 30)}
        </g>
      );
    }
    const rot = (v - 0.5) * 14;
    return (
      <g key={i} transform={`translate(${s.x} ${s.y}) rotate(${rot})`}>
        <g stroke={INK} strokeWidth={SW.topping} strokeLinejoin="round">
          <path d="M-28,-12 L-28,30 L28,30 L28,-12 Z" fill={tones.food} />
          <path d="M-28,-12 L-15,-27 L41,-27 L28,-12 Z" fill={topFace} />
          <path d="M28,-12 L41,-27 L41,15 L28,30 Z" fill={sideFace} />
        </g>
        {!simplified && (
          <g stroke={drizzle} strokeWidth={3.5} strokeLinecap="round" fill="none" opacity={0.9}>
            <path d="M-18,-20 L2,-22" /><path d="M8,-18 L26,-21" />
          </g>
        )}
        {stampId && stampAt(stampId, 5, -20, 36, v, Math.floor(v * 40) - 20)}
      </g>
    );
  });

  return (
    <>
      <CardWash tones={tones} />
      <BoardRound tones={tones} r={154} />
      {items}
    </>
  );
}

// ---------------------------------------------------------------------------
// scones-plate — cluster of golden domes (scones, yorkshire puddings) on a
// plate; puddings get the sunken well, scones the split + flour dust.
// ---------------------------------------------------------------------------
export function SconesPlate({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':scones');
  const simplified = size < SIMPLIFY_BELOW;
  const crater = /pudding|yorkshire|popover/.test(slug);
  const dome = mix(tones.food, '#f6dfae', 0.42);
  const domeHi = lighten(dome, 0.14);
  const domeShade = darken(dome, 0.13);
  const count = 5 + (rnd() > 0.55 ? 1 : 0);
  const startA = rnd() * Math.PI * 2;
  const ringN = count - 1;
  const pos: { x: number; y: number; r: number }[] = [{ x: 200 + (rnd() - 0.5) * 8, y: 202 + (rnd() - 0.5) * 8, r: 42 + rnd() * 4 }];
  for (let i = 0; i < ringN; i++) {
    const a = startA + (i / ringN) * Math.PI * 2;
    pos.push({ x: 200 + Math.cos(a) * 76, y: 202 + Math.sin(a) * 76, r: 39 + rnd() * 6 });
  }

  const scatterIds = toppingIds.filter((id) => stampFor(id)?.kind === 'scatter');

  const domes = pos.map((p, i) => {
    const v = rngFor(`${slug}:dome${i}`)();
    return (
      <g key={i}>
        <ellipse cx={p.x + 4} cy={p.y + 7} rx={p.r} ry={p.r * 0.9} fill={tones.shadow} opacity={0.55} />
        <circle cx={p.x} cy={p.y} r={p.r} fill={dome} stroke={INK} strokeWidth={SW.topping} />
        {crater ? (
          <>
            <circle cx={p.x} cy={p.y + 2} r={p.r * 0.52} fill={domeShade} />
            <ellipse cx={p.x - p.r * 0.14} cy={p.y - p.r * 0.1} rx={p.r * 0.3} ry={p.r * 0.2} fill={darken(dome, 0.2)} opacity={0.7} />
          </>
        ) : (
          !simplified && (
            <path d={`M${p.x - p.r * 0.6},${p.y + 4} q${p.r * 0.36},${6 + v * 6} ${p.r * 1.2},0`} fill="none" stroke={domeShade} strokeWidth={4} strokeLinecap="round" />
          )
        )}
        <SheenArc cx={p.x} cy={p.y} r={p.r * 0.62} from={200} to={252} color={domeHi} width={7} opacity={1} />
      </g>
    );
  });

  const flour = simplified || crater ? null : (
    <g fill="#ffffff" opacity={0.75}>
      {[0, 1, 2, 3].map((i) => {
        const a = rnd() * Math.PI * 2, rr = 30 + rnd() * 80;
        return <circle key={i} cx={200 + Math.cos(a) * rr} cy={202 + Math.sin(a) * rr * 0.9} r={2.4 + rnd() * 1.4} />;
      })}
    </g>
  );

  return (
    <>
      <CardWash tones={tones} />
      <TopPlate tones={tones} r={148} />
      {domes}
      {flour}
      <ToppingScatter slug={slug} ids={scatterIds} cx={200} cy={202} clipR={92} rimR={130} size={28} simplified={simplified} />
      {!simplified && <Steam x={208} y={56} scale={0.65} />}
    </>
  );
}

// ---------------------------------------------------------------------------
// clafoutis-pan — cast-iron pan, baked custard, sunken cherries in tones.food,
// a dusting of sugar.
// ---------------------------------------------------------------------------
export function ClafoutisPan({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':clafoutis');
  const simplified = size < SIMPLIFY_BELOW;
  const cx = 190, cy = 202;
  const CUSTARD = '#f4e2b6';
  const dimple = darken(CUSTARD, 0.09);
  const n = simplified ? 5 : 7 + Math.floor(rnd() * 3);

  const cherries = scatter(slug + ':cherries', n, { cx, cy, rMin: 16, rMax: 72 }).map((p, i) => {
    const cr = 12 + p.r01 * 5;
    return (
      <g key={i}>
        <circle cx={p.x} cy={p.y + 2} r={cr + 6} fill={dimple} />
        <circle cx={p.x} cy={p.y} r={cr} fill={tones.food} stroke={INK} strokeWidth={SW.topping} />
        <circle cx={p.x - cr * 0.3} cy={p.y - cr * 0.32} r={cr * 0.26} fill={tones.tint} />
      </g>
    );
  });

  const dust = simplified ? null : (
    <g fill="#ffffff" opacity={0.8}>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = rnd() * Math.PI * 2, rr = rnd() * 88;
        return <circle key={i} cx={cx + Math.cos(a) * rr} cy={cy + Math.sin(a) * rr} r={2 + rnd() * 1.5} />;
      })}
    </g>
  );

  return (
    <>
      <CardWash tones={tones} />
      <PanIron tones={tones} cx={cx} cy={cy} r={136} />
      <circle cx={cx} cy={cy} r={104} fill={CUSTARD} stroke={INK} strokeWidth={SW.topping} />
      <circle cx={cx} cy={cy} r={95} fill="none" stroke="#e3bd7e" strokeWidth={7} opacity={0.9} />
      <Gloss cx={cx} cy={cy} rx={78} ry={62} tint={lighten(CUSTARD, 0.1)} />
      {cherries}
      <ToppingScatter slug={slug} ids={toppingIds.filter((id) => id !== 'cherry' && stampFor(id)?.kind !== 'rim')} cx={cx} cy={cy} clipR={70} rimR={0} size={28} simplified={simplified} />
      {dust}
      {!simplified && <Steam x={cx + 6} y={54} scale={0.7} />}
    </>
  );
}

// ---------------------------------------------------------------------------
// borek-coil — golden filo spiral on a plate, sesame seeds, char kisses.
// ---------------------------------------------------------------------------
export function BorekCoil({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':borek');
  const simplified = size < SIMPLIFY_BELOW;
  const cx = 200, cy = 202;
  const turns = 3.0 + rnd() * 0.35;
  const spacing = 33, r0 = 12;
  const start = rnd() * Math.PI * 2;
  const thetaMax = turns * Math.PI * 2;
  const at = (t: number): [number, number] => {
    const r = r0 + (spacing * t) / (Math.PI * 2);
    return [cx + Math.cos(start + t) * r, cy + Math.sin(start + t) * r];
  };
  let d = `M${at(0)[0]},${at(0)[1]}`;
  for (let t = 0.22; t <= thetaMax; t += 0.22) {
    const [px, py] = at(t);
    d += ` L${px},${py}`;
  }
  const hi = lighten(tones.food, 0.16);
  const charC = darken(tones.food, 0.16);

  const seeds: ReactNode[] = [];
  const seedN = simplified ? 5 : 12;
  for (let i = 0; i < seedN; i++) {
    const t = 2 + rnd() * (thetaMax - 2.4);
    const [px, py] = at(t);
    const deg = ((start + t) * 180) / Math.PI + 90 + (rnd() - 0.5) * 40;
    seeds.push(
      i % 3 === 2
        ? <circle key={i} cx={px} cy={py} r={2.6} fill={charC} />
        : <ellipse key={i} cx={px} cy={py} rx={3.6} ry={2.2} fill="#fdf3da" transform={`rotate(${deg} ${px} ${py})`} />
    );
  }

  const chars = simplified ? null : [0, 1, 2, 3].map((i) => {
    const t = 3 + rnd() * (thetaMax - 3.5);
    const [px, py] = at(t);
    const deg = ((start + t) * 180) / Math.PI + 90;
    return <ellipse key={i} cx={px} cy={py} rx={9} ry={4.5} fill={charC} opacity={0.85} transform={`rotate(${deg} ${px} ${py})`} />;
  });

  return (
    <>
      <CardWash tones={tones} />
      <TopPlate tones={tones} r={148} />
      <path d={d} fill="none" stroke={INK} strokeWidth={31} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={tones.food} strokeWidth={23} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={hi} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" opacity={0.75} transform="translate(-3 -4)" />
      {chars}
      {seeds}
      <ToppingScatter slug={slug} ids={toppingIds} cx={cx} cy={cy} clipR={84} rimR={130} size={27} simplified={simplified} />
      {!simplified && <Steam x={cx + 10} y={56} scale={0.65} />}
    </>
  );
}

export const BAKES_FORMS: Record<string, DishTemplate> = {
  'pizza-whole': (p) => <PizzaWhole {...p} />,
  'pie-whole': (p) => <PieWhole {...p} />,
  'tart-slice': (p) => <TartSlice {...p} />,
  'cake-slice': (p) => <CakeSlice {...p} />,
  'loaf-slice': (p) => <LoafSlice {...p} />,
  'bake-dish': (p) => <BakeDish {...p} />,
  'cookie-scatter': (p) => <CookieScatter {...p} />,
  'scones-plate': (p) => <SconesPlate {...p} />,
  'clafoutis-pan': (p) => <ClafoutisPan {...p} />,
  'borek-coil': (p) => <BorekCoil {...p} />,
};
