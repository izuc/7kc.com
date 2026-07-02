/**
 * Deterministic per-recipe variation. Everything that "scatters" derives from a
 * hash of the recipe slug — the same recipe renders identically forever, but no
 * two recipes sharing a dish form look the same. NEVER use Math.random here.
 */

function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

/** A seeded PRNG in [0,1) for the given key (usually `${slug}:${purpose}`). */
export function rngFor(key: string): () => number {
  const seed = xmur3(key)();
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface ScatterPoint {
  x: number;
  y: number;
  /** rotation in degrees */
  rot: number;
  /** an extra stable random in [0,1) for per-point choices (size, variant) */
  r01: number;
}

/**
 * n points scattered on a golden-angle ring between rMin..rMax around (cx,cy) —
 * even coverage with organic jitter, stable for a given key.
 */
export function scatter(
  key: string,
  n: number,
  { cx = 200, cy = 200, rMin = 30, rMax = 100, squashY = 1 }: { cx?: number; cy?: number; rMin?: number; rMax?: number; squashY?: number } = {}
): ScatterPoint[] {
  const rnd = rngFor(key);
  const golden = 2.399963; // radians
  const start = rnd() * Math.PI * 2;
  const out: ScatterPoint[] = [];
  for (let i = 0; i < n; i++) {
    const a = start + i * golden + (rnd() - 0.5) * 0.5;
    // sqrt spread biases outward for even area coverage
    const t = Math.sqrt((i + 0.5) / n);
    const r = rMin + (rMax - rMin) * (t * 0.85 + rnd() * 0.15);
    out.push({
      x: cx + Math.cos(a) * r,
      y: cy + Math.sin(a) * r * squashY,
      rot: Math.floor(rnd() * 360),
      r01: rnd(),
    });
  }
  return out;
}
