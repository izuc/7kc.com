// Scale the leading numeric quantity of a free-text amount string by `factor`,
// preserving everything after it verbatim. Display-only (the servings stepper) —
// never persisted, never fed back into shopping lists.
//
// Handles integers ("2"), decimals ("1.5"), units ("400g", "1 tbsp"), simple
// fractions ("1/2 cup"), mixed fractions ("1 1/2 cups"), ranges ("2-3"), and
// passes through non-numeric amounts ("a pinch", "to taste") untouched.
//
// Rendering adapts to the unit: metric weights/volumes (g, kg, ml, L…) render as
// plain numbers — no one writes "166 2/3 g" — while fraction-friendly units
// (cup, tbsp, tsp) and bare counts render tidy fractions ("1 1/2").

const CLEAN_FRACTIONS: [number, string][] = [
  [1 / 8, '1/8'],
  [1 / 4, '1/4'],
  [1 / 3, '1/3'],
  [3 / 8, '3/8'],
  [1 / 2, '1/2'],
  [5 / 8, '5/8'],
  [2 / 3, '2/3'],
  [3 / 4, '3/4'],
  [7 / 8, '7/8'],
];

/** Recipe-idiomatic fraction rendering: whole numbers plain, clean fractions as
 * a/b (mixed when > 1, e.g. "1 1/2"), otherwise a 2-dp decimal. For counts and
 * cup/tbsp/tsp-style units. */
function formatFraction(n: number): string {
  if (!isFinite(n) || n <= 0) return '0';
  const nearestInt = Math.round(n);
  if (Math.abs(n - nearestInt) < 0.02) return String(nearestInt);

  const whole = Math.floor(n);
  const frac = n - whole;
  for (const [value, label] of CLEAN_FRACTIONS) {
    if (Math.abs(frac - value) < 0.03) {
      return whole > 0 ? `${whole} ${label}` : label;
    }
  }
  return String(Math.round(n * 100) / 100);
}

/** Plain number to `dp` decimal places, trailing zeros stripped. For metric units
 * where vulgar fractions ("5/8 kg") would be nonsensical. */
function formatDecimal(n: number, dp: number): string {
  if (!isFinite(n) || n <= 0) return '0';
  const f = 10 ** dp;
  return String(Math.round(n * f) / f);
}

/** Pick a rendering style from the unit that immediately follows the number. */
function styleFor(rest: string): 'whole' | 'decimal' | 'fraction' {
  const m = rest.match(/^\s*(kg|mg|ml|cl|dl|g|l|L)\b/);
  if (!m) return 'fraction';
  const u = m[1];
  // grams / millilitres → whole units; kilograms / litres → 1–2 dp.
  return u === 'g' || u === 'mg' || u === 'ml' ? 'whole' : 'decimal';
}

function render(n: number, rest: string): string {
  switch (styleFor(rest)) {
    case 'whole':
      return formatDecimal(n, 0);
    case 'decimal':
      return formatDecimal(n, 2);
    default:
      return formatFraction(n);
  }
}

const RANGE_RE = /^\s*(\d+(?:\.\d+)?)\s*([-–])\s*(\d+(?:\.\d+)?)(.*)$/s;
const MIXED_RE = /^\s*(\d+)\s+(\d+)\s*\/\s*(\d+)(.*)$/s;
const FRACTION_RE = /^\s*(\d+)\s*\/\s*(\d+)(.*)$/s;
const NUMBER_RE = /^\s*(\d+(?:\.\d+)?)(.*)$/s;

export function scaleAmount(amount: string | null | undefined, factor: number): string {
  if (amount == null) return '';
  const text = amount;
  // No-op cases: identity factor, or anything that isn't a usable positive multiplier.
  if (!isFinite(factor) || factor <= 0 || factor === 1) return text;

  const range = text.match(RANGE_RE);
  if (range) {
    const [, lo, sep, hi, rest] = range;
    return `${render(parseFloat(lo) * factor, rest)}${sep}${render(parseFloat(hi) * factor, rest)}${rest}`;
  }

  // Mixed fraction ("1 1/2 cups") must be tried before the plain-number branch,
  // otherwise only the whole part scales and the fraction is left dangling.
  const mixed = text.match(MIXED_RE);
  if (mixed) {
    const [, whole, num, den, rest] = mixed;
    const denom = parseInt(den, 10);
    if (denom !== 0) {
      return `${render((parseInt(whole, 10) + parseInt(num, 10) / denom) * factor, rest)}${rest}`;
    }
  }

  const fraction = text.match(FRACTION_RE);
  if (fraction) {
    const [, num, den, rest] = fraction;
    const denom = parseInt(den, 10);
    if (denom !== 0) {
      return `${render((parseInt(num, 10) / denom) * factor, rest)}${rest}`;
    }
  }

  const number = text.match(NUMBER_RE);
  if (number) {
    const [, n, rest] = number;
    return `${render(parseFloat(n) * factor, rest)}${rest}`;
  }

  // No leading quantity ("a pinch", "to taste") → unchanged.
  return text;
}
