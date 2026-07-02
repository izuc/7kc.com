import { INK } from './tokens';

/**
 * Derive a consistent 4-tone food ramp (plus card-wash colours) from a recipe's
 * palette pair, so the 54 distinct palette[0] colours across recipes.json all
 * produce harmonious shade/main/tint/highlight sets without hand-tuning.
 */
export interface Tones {
  /** darker version of the food colour — crumbs, depths, undersides */
  shade: string;
  /** recipe.palette[0] — the raw brand colour (may be non-edible, e.g. tin blue) */
  main: string;
  /** food-safe version of main — USE THIS for any edible mass */
  food: string;
  /** lighter — inner highlight blobs, sauce sheen bases */
  tint: string;
  /** lightest — specular sheens, top-face light */
  highlight: string;
  /** recipe.palette[1] — the card wash behind the dish */
  bg: string;
  /** lighter halo disc behind the vessel */
  halo: string;
  /** soft shadow tone under the vessel (bg mixed toward ink) */
  shadow: string;
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const s = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h / 6, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
}

/** Shift lightness by `amt` (-1..1), gently desaturating when lightening. */
export function shiftL(hex: string, amt: number): string {
  const [h, s, l] = rgbToHsl(...hexToRgb(hex));
  const s2 = amt > 0 ? clamp01(s - amt * 0.25) : clamp01(s + amt * -0.1);
  return rgbToHex(...hslToRgb(h, s2, clamp01(l + amt)));
}

export const lighten = (hex: string, amt: number) => shiftL(hex, Math.abs(amt));
export const darken = (hex: string, amt: number) => shiftL(hex, -Math.abs(amt));

/** Linear RGB mix: t=0 → a, t=1 → b. */
export function mix(a: string, b: string, t: number): string {
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
}

/**
 * No dish is navy: a handful of recipes carry a cold "brand" palette[0]
 * (tuna-tin cyan, ocean blue) that must never colour an edible mass. Blues in
 * ~175–258° get pulled hard toward a warm tan; purples (eggplant, grape) pass.
 */
export function foodSafe(hex: string): string {
  const [h, s, l] = rgbToHsl(...hexToRgb(hex));
  const deg = h * 360;
  // cold blues (tuna-tin cyan, ocean navy) → warm tan, hard
  if (deg > 175 && deg < 258 && s > 0.18) return mix(hex, '#d9a05c', 0.85);
  // blue-violets (vivid eggplant brand hues) → plummy brown, softer;
  // magentas/berries (>292°) pass — they are real food colours
  if (deg >= 258 && deg < 292 && s > 0.25) return mix(hex, '#9a5a38', 0.72);
  // near-greys (mushroom slate, dip grey) → warm taupe so nothing reads as concrete
  if (s < 0.14 && l > 0.25 && l < 0.75) return mix(hex, '#b08d64', 0.5);
  return hex;
}

export function tonesFor(palette: [string, string] | undefined): Tones {
  const main = palette?.[0] ?? '#c89e6b';
  const bg = palette?.[1] ?? '#f6e8d4';
  const food = foodSafe(main);
  return {
    shade: darken(food, 0.14),
    main,
    food,
    tint: lighten(food, 0.12),
    highlight: lighten(food, 0.26),
    bg,
    halo: mix(bg, '#ffffff', 0.45),
    shadow: mix(bg, INK, 0.16),
  };
}
