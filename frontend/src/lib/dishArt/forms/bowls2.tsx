import { ReactNode } from 'react';
import { INK, SW, PASTA_DARK, SIMPLIFY_BELOW } from '../tokens';
import { CardWash, TopBowl, TopPlate, PanIron, Gloss, Steam, wedge } from '../primitives';
import { ToppingScatter, stampFor } from '../toppings';
import { mix } from '../palette';
import { rngFor, scatter } from '../seed';
import { DishProps, DishTemplate } from '../types';

/**
 * Bowl-family templates, wave 2: curry, soup, risotto, fried rice, stir-fry and
 * grain bowls. Same "Ink & Cream" language as forms/bowls.tsx — flat ink-lined
 * silhouettes over the card wash, one lighter highlight per element (Gloss on
 * wet masses), all variation seeded from the slug, toppings stamped INTO the
 * food. Reference geometry: dirA in docs/art-exploration/direction-svgs.json.
 */

const RICE_CREAM = '#f3e8cb';
const RICE_WHITE = '#fffdf6';
const RICE_TAN = '#dcc59a';
const CHUNK_TAN = '#eccf9a';
const CHUNK_LIGHT = '#f8e4ba';

/** The exemplar's irregular organic sauce blob (9 anchors) centred on (cx,cy). */
function sauceBlob(cx: number, cy: number, r: number): string {
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

/** dirA's braised chunk (tender piece + one light arc), drawn around (0,0), ~52 wide. */
function chunkAt(key: number, x: number, y: number, rot: number, s: number, fill: string, light: string): ReactNode {
  return (
    <g key={key} transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path
        d="M-25,-7 C-21,-19 -5,-25 7,-19 C17,-13 19,1 11,9 C1,17 -17,15 -23,5 C-26,1 -27,-3 -25,-7 Z"
        fill={fill} stroke={INK} strokeWidth={SW.topping / s} strokeLinejoin="round"
      />
      <path d="M-17,-8 C-11,-14 -1,-16 5,-13" fill="none" stroke={light} strokeWidth={SW.topping / s} strokeLinecap="round" />
    </g>
  );
}

/** A single rice-grain dash. */
function grainAt(key: number | string, x: number, y: number, rot: number, len: number, color: string): ReactNode {
  return (
    <rect
      key={key} x={x - len / 2} y={y - 3.1} width={len} height={6.2} rx={3.1}
      fill={color} transform={`rotate(${rot} ${x} ${y})`}
    />
  );
}

/**
 * curry-bowl — cream rice crescent + offset curry pool (gloss + braised
 * chunks), the dirA curry made into the rice-and-curry bowl the recipes are.
 * Seeded: split angle, pool size, chunk count.
 */
export function CurryBowl({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':curry');
  const simplified = size < SIMPLIFY_BELOW;
  const cx = 200, cy = 202;
  const a = rnd() * Math.PI * 2; // direction the curry pool is pushed toward
  const curryR = 82 + rnd() * 8;
  const off = 106 - curryR; // bigger pool sits closer to centre — never clips the bowl
  const px = cx + Math.cos(a) * off;
  const py = cy + Math.sin(a) * off;
  const blobRot = Math.floor(rnd() * 360);

  // rice grains packed into the crescent left visible opposite the pool
  const grains: ReactNode[] = [];
  const nGrains = simplified ? 8 : 18;
  for (let i = 0; i < nGrains; i++) {
    const ga = a + Math.PI + (rnd() - 0.5) * 3.0;
    const d = ga - a;
    const edge = off * Math.cos(d) + Math.sqrt(Math.max(0, curryR * curryR - off * off * Math.sin(d) * Math.sin(d)));
    const lo = edge + 11, hi = 105;
    if (hi - lo < 8) continue;
    const gr = lo + (hi - lo) * rnd();
    grains.push(grainAt(
      i, cx + Math.cos(ga) * gr, cy + Math.sin(ga) * gr,
      Math.floor(rnd() * 180), 11 + rnd() * 4, rnd() < 0.55 ? RICE_WHITE : RICE_TAN
    ));
  }

  const nChunks = simplified ? 2 : 3 + Math.floor(rnd() * 3);
  const chunkPts = scatter(slug + ':curry-chunks', nChunks, { cx: px, cy: py, rMin: 10, rMax: curryR * 0.55 });
  const chunks = chunkPts.map((p, i) =>
    chunkAt(i, p.x, p.y, (p.rot % 70) - 35, 0.72 + p.r01 * 0.26, CHUNK_TAN, CHUNK_LIGHT)
  );

  // citrus docks on the BOWL rim; everything else stamps into the pool
  const rimIds = toppingIds.filter((id) => stampFor(id)?.kind === 'rim');
  const poolIds = toppingIds.filter((id) => stampFor(id)?.kind !== 'rim');

  return (
    <>
      <CardWash tones={tones} />
      <TopBowl tones={tones} foodR={116} foodFill={RICE_CREAM} />
      {grains}
      <path d={sauceBlob(px, py, curryR)} fill={tones.food} stroke={INK} strokeWidth={SW.macro} transform={`rotate(${blobRot} ${px} ${py})`} />
      <Gloss cx={px} cy={py} rx={curryR * 0.8} ry={curryR * 0.64} tint={tones.tint} />
      {chunks}
      <ToppingScatter slug={slug} ids={poolIds} cx={px} cy={py} clipR={curryR - 14} rimR={138} size={30} simplified={simplified} />
      {rimIds.length > 0 && <ToppingScatter slug={slug} ids={rimIds} cx={cx} cy={cy} rimR={136} size={30} simplified={simplified} />}
      {!simplified && <Steam x={cx + 6} y={52} scale={0.85} color="#ffffff" opacity={0.5} />}
    </>
  );
}

/**
 * soup-bowl — full broth disc, cream spiral swirl (the dirA coconut swirl),
 * floating chunks, big steam. Seeded: swirl rotation, chunk count/shapes.
 */
export function SoupBowl({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':soup');
  const simplified = size < SIMPLIFY_BELOW;
  const cx = 200, cy = 202;
  const swirlRot = Math.floor(rnd() * 360);

  const nChunks = simplified ? 3 : 4 + Math.floor(rnd() * 3);
  const pts = scatter(slug + ':soup-chunks', nChunks, { cx, cy, rMin: 34, rMax: 84 });
  const chunks = pts.map((p, i) => {
    const s = 9 + p.r01 * 5;
    return p.r01 < 0.5 ? (
      <rect
        key={i} x={p.x - s} y={p.y - s} width={s * 2} height={s * 2} rx={s * 0.4}
        fill={tones.tint} stroke={INK} strokeWidth={SW.micro} transform={`rotate(${(p.rot % 40) - 20} ${p.x} ${p.y})`}
      />
    ) : (
      <circle key={i} cx={p.x} cy={p.y} r={s} fill={tones.shade} stroke={INK} strokeWidth={SW.micro} />
    );
  });

  return (
    <>
      <CardWash tones={tones} />
      <TopBowl tones={tones} foodR={116} foodFill={tones.food} />
      <Gloss cx={cx} cy={cy} rx={92} ry={76} tint={tones.tint} />
      <g transform={`rotate(${swirlRot} ${cx} ${cy})`}>
        <path
          d={`M${cx + 6},${cy - 6} a10,10 0 1 0 -14,12 a26,26 0 1 0 34,-30 a46,46 0 1 0 -54,66`}
          fill="none" stroke="#fdf6e2" strokeWidth={10} strokeLinecap="round" opacity={0.92}
        />
      </g>
      {chunks}
      <ToppingScatter slug={slug} ids={toppingIds} cx={cx} cy={cy} clipR={88} rimR={138} size={33} simplified={simplified} />
      {!simplified && <Steam x={cx} y={54} scale={1} color="#ffffff" opacity={0.6} />}
    </>
  );
}

/**
 * risotto — wide-rim plate, creamy tinted mound speckled with seeded grain
 * flecks, garnish clustered dead centre. Seeded: mound rotation, fleck field.
 */
export function Risotto({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':risotto');
  const simplified = size < SIMPLIFY_BELOW;
  const cx = 200, cy = 202;
  const moundRot = Math.floor(rnd() * 360);
  const moundR = 100 + rnd() * 8;
  const base = mix(tones.tint, '#f7eed9', 0.5); // creamy rice with the recipe's cast
  const light = mix(base, '#ffffff', 0.55);

  const flecks: ReactNode[] = [];
  const nFlecks = simplified ? 10 : 24;
  const pts = scatter(slug + ':risotto-grains', nFlecks, { cx, cy, rMin: 10, rMax: moundR * 0.8 });
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const color = p.r01 < 0.5 ? tones.food : p.r01 < 0.75 ? tones.shade : RICE_WHITE;
    flecks.push(grainAt(i, p.x, p.y, (p.rot % 180), 10 + p.r01 * 4, color));
  }

  return (
    <>
      <CardWash tones={tones} />
      <TopPlate tones={tones} />
      <path d={sauceBlob(cx, cy, moundR)} fill={base} stroke={INK} strokeWidth={SW.macro} transform={`rotate(${moundRot} ${cx} ${cy})`} />
      <ellipse cx={cx - moundR * 0.3} cy={cy - moundR * 0.36} rx={moundR * 0.42} ry={moundR * 0.3} fill={light} opacity={0.9} />
      {flecks}
      <ToppingScatter slug={slug} ids={toppingIds} cx={cx} cy={cy} clipR={44} rimR={132} size={37} simplified={simplified} />
      {!simplified && <Steam x={cx + 10} y={58} scale={0.8} color="#ffffff" opacity={0.5} />}
    </>
  );
}

/**
 * fried-rice — golden rice heaped in a bowl, dense seeded grain marks, egg
 * ribbons + recipe-veg bits folded through. Seeded: grain field, egg count.
 */
export function FriedRice({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':friedrice');
  const simplified = size < SIMPLIFY_BELOW;
  const cx = 200, cy = 202;

  const grains: ReactNode[] = [];
  const nGrains = simplified ? 14 : 30;
  const gPts = scatter(slug + ':fried-grains', nGrains, { cx, cy, rMin: 8, rMax: 100 });
  for (let i = 0; i < gPts.length; i++) {
    const p = gPts[i];
    const color = p.r01 < 0.4 ? PASTA_DARK : p.r01 < 0.75 ? '#fdf1cc' : tones.shade;
    grains.push(grainAt(i, p.x, p.y, p.rot % 180, 10 + p.r01 * 5, color));
  }

  const nEggs = simplified ? 2 : 3 + Math.floor(rnd() * 3);
  const ePts = scatter(slug + ':fried-egg', nEggs, { cx, cy, rMin: 24, rMax: 88 });
  const eggs = ePts.map((p, i) => (
    <rect
      key={i} x={p.x - 13} y={p.y - 8} width={26} height={16} rx={7}
      fill="#f7bb2e" stroke={INK} strokeWidth={SW.micro} transform={`rotate(${(p.rot % 60) - 30} ${p.x} ${p.y})`}
    />
  ));

  return (
    <>
      <CardWash tones={tones} />
      <TopBowl tones={tones} foodR={116} foodFill="#eec766" />
      <ellipse cx={cx - 30} cy={cy - 36} rx={52} ry={34} fill="#f8dfa0" opacity={0.95} />
      {grains}
      {eggs}
      <ToppingScatter slug={slug} ids={toppingIds} cx={cx} cy={cy} clipR={92} rimR={138} size={32} simplified={simplified} />
      {!simplified && <Steam x={cx + 4} y={54} scale={0.85} color="#ffffff" opacity={0.5} />}
    </>
  );
}

/** Hand-cut wok veg: capsicum strips, onion crescents, carrot coins. */
function wokVeg(key: number, x: number, y: number, rot: number, kind: number): ReactNode {
  if (kind === 0 || kind === 1) {
    const fill = kind === 0 ? '#cf3a22' : '#4c7d24';
    return (
      <rect
        key={key} x={x - 17} y={y - 5.5} width={34} height={11} rx={5.5}
        fill={fill} stroke={INK} strokeWidth={SW.micro} transform={`rotate(${rot} ${x} ${y})`}
      />
    );
  }
  if (kind === 2) {
    return (
      <path
        key={key} d={`M${x - 14},${y + 6} Q${x},${y - 11} ${x + 14},${y + 6}`}
        fill="none" stroke="#f3e6c8" strokeWidth={7.5} strokeLinecap="round" transform={`rotate(${rot} ${x} ${y})`}
      />
    );
  }
  return <circle key={key} cx={x} cy={y} r={8.5} fill="#e08a2e" stroke={INK} strokeWidth={SW.micro} />;
}

/**
 * stir-fry — cast-iron pan, glossy dark-sauce base, LOTS of seeded veg slices
 * plus protein pieces in the recipe colour. Seeded: handle angle, veg mix.
 */
export function StirFry({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':stirfry');
  const simplified = size < SIMPLIFY_BELOW;
  const cx = 190, cy = 202;
  const handleAngle = Math.floor(rnd() * 50) - 25;
  const sauceRot = Math.floor(rnd() * 360);

  const nVeg = simplified ? 6 : 10 + Math.floor(rnd() * 4);
  const vPts = scatter(slug + ':wok-veg', nVeg, { cx, cy, rMin: 18, rMax: 86 });
  const veg = vPts.map((p, i) => wokVeg(i, p.x, p.y, (p.rot % 90) - 45, (i + Math.floor(p.r01 * 4)) % 4));

  const nProt = simplified ? 2 : 2 + Math.floor(rnd() * 2);
  const pPts = scatter(slug + ':wok-protein', nProt, { cx, cy, rMin: 14, rMax: 62 });
  const protein = pPts.map((p, i) =>
    chunkAt(i, p.x, p.y, (p.rot % 70) - 35, 0.8 + p.r01 * 0.3, tones.shade, tones.tint)
  );

  return (
    <>
      <CardWash tones={tones} />
      <PanIron tones={tones} cx={cx} cy={cy} r={136} handleAngle={handleAngle} />
      <path d={sauceBlob(cx, cy, 104)} fill={tones.food} stroke={INK} strokeWidth={SW.macro} transform={`rotate(${sauceRot} ${cx} ${cy})`} />
      <Gloss cx={cx} cy={cy} rx={84} ry={68} tint={tones.tint} />
      {protein}
      {veg}
      <ToppingScatter slug={slug} ids={toppingIds} cx={cx} cy={cy} clipR={88} rimR={124} size={31} simplified={simplified} />
      {!simplified && <Steam x={cx} y={50} scale={0.9} color="#ffffff" opacity={0.55} />}
    </>
  );
}

/**
 * grain-bowl — bibimbap/poke wheel: 3–4 contrasting base wedges around a cream
 * centre dollop. Seeded: segment count, boundary angles, palette rotation.
 */
export function GrainBowl({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':grain');
  const simplified = size < SIMPLIFY_BELOW;
  const cx = 200, cy = 202;
  const nSeg = rnd() < 0.45 ? 3 : 4;
  const start = rnd() * 360;
  const cycle = [RICE_CREAM, tones.food, '#7fae54', '#e6b95c'];
  const shift = Math.floor(rnd() * 4);

  const bounds: number[] = [start];
  for (let i = 1; i <= nSeg; i++) {
    bounds.push(start + (360 / nSeg) * i + (i === nSeg ? 0 : (rnd() - 0.5) * 22));
  }

  const wedges: ReactNode[] = [];
  const marks: ReactNode[] = [];
  for (let i = 0; i < nSeg; i++) {
    const fill = cycle[(i + shift) % 4];
    wedges.push(
      <path key={i} d={wedge(cx, cy, 116, bounds[i], bounds[i + 1])} fill={fill} stroke={INK} strokeWidth={SW.macro} strokeLinejoin="round" />
    );
    if (simplified) continue;
    // two quiet texture marks per wedge, matched to its base
    const mid = ((bounds[i] + bounds[i + 1]) / 2) * (Math.PI / 180);
    const span = Math.abs(bounds[i + 1] - bounds[i]) * (Math.PI / 180);
    for (let m = 0; m < 2; m++) {
      const ma = mid + (rnd() - 0.5) * span * 0.5;
      const mr = 56 + rnd() * 42;
      const mx = cx + Math.cos(ma) * mr, my = cy + Math.sin(ma) * mr;
      if (fill === RICE_CREAM) marks.push(grainAt(`${i}-${m}`, mx, my, Math.floor(rnd() * 180), 11, RICE_WHITE));
      else if (fill === '#7fae54') marks.push(grainAt(`${i}-${m}`, mx, my, Math.floor(rnd() * 180), 12, '#4c7d24'));
      else if (fill === '#e6b95c') marks.push(grainAt(`${i}-${m}`, mx, my, Math.floor(rnd() * 180), 11, '#c9922e'));
      else marks.push(<circle key={`${i}-${m}`} cx={mx} cy={my} r={5} fill={tones.shade} />);
    }
  }

  return (
    <>
      <CardWash tones={tones} />
      <TopBowl tones={tones} foodR={116} foodFill={cycle[shift]} />
      {wedges}
      {marks}
      <circle cx={cx} cy={cy} r={33} fill="#f8f0dc" stroke={INK} strokeWidth={SW.macro} />
      <ellipse cx={cx - 9} cy={cy - 10} rx={14} ry={9} fill="#ffffff" opacity={0.85} />
      <ToppingScatter slug={slug} ids={toppingIds} cx={cx} cy={cy} clipR={94} rimR={138} size={33} simplified={simplified} />
    </>
  );
}

export const BOWLS2_FORMS: Record<string, DishTemplate> = {
  'curry-bowl': (p) => <CurryBowl {...p} />,
  'soup-bowl': (p) => <SoupBowl {...p} />,
  'risotto': (p) => <Risotto {...p} />,
  'fried-rice': (p) => <FriedRice {...p} />,
  'stir-fry': (p) => <StirFry {...p} />,
  'grain-bowl': (p) => <GrainBowl {...p} />,
};
