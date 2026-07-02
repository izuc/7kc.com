import { INK, SW, PASTA_GOLD, PASTA_DARK, PASTA_LIGHT, SIMPLIFY_BELOW } from '../tokens';
import { CardWash, TopBowl, Gloss, Steam } from '../primitives';
import { ToppingScatter } from '../toppings';
import { rngFor } from '../seed';
import { DishProps, DishTemplate } from '../types';

/**
 * Bowl-family dish templates. The reference art for this language lives in
 * docs/art-exploration/direction-svgs.json (direction dirA) — flat ink-outlined
 * food with one lighter highlight per element, toppings stamped into the dish.
 */

/** An irregular organic sauce blob (9 anchors) centred on (cx,cy). */
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

/**
 * pasta-bowl — golden noodle nest, saucy centre, strands drawn back OVER the
 * sauce edge (mandatory: kills the "tomato soup" misread), gloss, toppings.
 */
export function PastaBowl({ tones, slug, toppingIds, size }: DishProps) {
  const rnd = rngFor(slug + ':pasta');
  const simplified = size < SIMPLIFY_BELOW;
  const cx = 200, cy = 202;
  const baseRot = Math.floor(rnd() * 360);
  const sauceR = 76 + rnd() * 10;
  const sauceRot = Math.floor(rnd() * 40) - 20;

  // under-nest arcs: dark + light noodle ribbons at seeded rotations
  const nestArcs = (simplified ? [0, 1, 2, 3] : [0, 1, 2, 3, 4, 5, 6]).map((i) => {
    const rot = baseRot + i * 47 + Math.floor(rnd() * 18);
    const r = 62 + (i % 3) * 17 + rnd() * 8;
    const col = i % 2 === 0 ? PASTA_DARK : PASTA_LIGHT;
    return (
      <path
        key={i}
        d={`M${cx - r},${cy} A${r},${r * 0.62} 0 0 1 ${cx + r},${cy}`}
        fill="none" stroke={col} strokeWidth={7} strokeLinecap="round"
        transform={`rotate(${rot} ${cx} ${cy})`}
      />
    );
  });

  // strands drawn back OVER the sauce edge so noodles wrap the mound
  const overArcs = (simplified ? [0, 1] : [0, 1, 2, 3]).map((i) => {
    const rot = baseRot + 30 + i * 83 + Math.floor(rnd() * 24);
    const r = Math.min(100, sauceR + 12 + rnd() * 14);
    return (
      <path
        key={i}
        d={`M${cx - r * 0.9},${cy + r * 0.28} Q${cx - r * 0.2},${cy + r * 0.72} ${cx + r * 0.82},${cy + r * 0.3}`}
        fill="none" stroke="#f6d783" strokeWidth={8} strokeLinecap="round"
        transform={`rotate(${rot} ${cx} ${cy})`}
      />
    );
  });

  return (
    <>
      <CardWash tones={tones} />
      <TopBowl tones={tones} foodR={112} foodFill={PASTA_GOLD} />
      {nestArcs}
      <path d={sauceBlob(cx, cy, sauceR)} fill={tones.food} stroke={INK} strokeWidth={SW.macro} transform={`rotate(${sauceRot} ${cx} ${cy})`} />
      <Gloss cx={cx} cy={cy} rx={sauceR * 0.8} ry={sauceR * 0.62} tint={tones.tint} />
      {overArcs}
      <ToppingScatter slug={slug} ids={toppingIds} cx={cx} cy={cy} clipR={sauceR - 4} rimR={116} size={36} simplified={simplified} />
      {!simplified && <Steam x={cx + 8} y={54} scale={0.8} color="#ffffff" opacity={0.5} />}
    </>
  );
}

export const BOWLS_FORMS: Record<string, DishTemplate> = {
  'pasta-bowl': (p) => <PastaBowl {...p} />,
};
