import { describe, it, expect } from 'vitest';
import { scaleAmount } from './scaleAmount';

describe('scaleAmount', () => {
  it('returns the amount unchanged at factor 1', () => {
    expect(scaleAmount('400g', 1)).toBe('400g');
    expect(scaleAmount('1/2 cup', 1)).toBe('1/2 cup');
  });

  it('handles null/undefined/empty', () => {
    expect(scaleAmount(null, 2)).toBe('');
    expect(scaleAmount(undefined, 2)).toBe('');
    expect(scaleAmount('', 2)).toBe('');
  });

  it('scales integers with units, preserving the unit text', () => {
    expect(scaleAmount('400g', 2)).toBe('800g');
    expect(scaleAmount('200 g', 1.5)).toBe('300 g');
    expect(scaleAmount('2 cloves', 2)).toBe('4 cloves');
    expect(scaleAmount('1 tbsp', 3)).toBe('3 tbsp');
  });

  it('scales decimals (rendering recipe-idiomatic mixed fractions)', () => {
    expect(scaleAmount('1.5 cups', 2)).toBe('3 cups');
    expect(scaleAmount('1.25 cups', 2)).toBe('2 1/2 cups');
  });

  it('scales simple fractions, up to a whole and down to a smaller fraction', () => {
    expect(scaleAmount('1/2 cup', 2)).toBe('1 cup');
    expect(scaleAmount('1/2 cup', 0.5)).toBe('1/4 cup');
    expect(scaleAmount('1/3 cup', 3)).toBe('1 cup');
    expect(scaleAmount('3/4 cup', 2)).toBe('1 1/2 cup');
  });

  it('scales ranges, keeping the separator and trailing text', () => {
    expect(scaleAmount('2-3', 2)).toBe('4-6');
    expect(scaleAmount('2–3 sprigs', 2)).toBe('4–6 sprigs');
  });

  it('passes non-numeric amounts through untouched', () => {
    expect(scaleAmount('a pinch', 2)).toBe('a pinch');
    expect(scaleAmount('handful', 3)).toBe('handful');
    expect(scaleAmount('to taste', 4)).toBe('to taste');
  });

  it('preserves trailing descriptors and parentheticals', () => {
    expect(scaleAmount('200 g sirloin', 2)).toBe('400 g sirloin');
    expect(scaleAmount('30 g (optional)', 2)).toBe('60 g (optional)');
  });

  it('only scales the leading token of a compound amount', () => {
    expect(scaleAmount('4 + 1 yolk', 1.5)).toBe('6 + 1 yolk');
    expect(scaleAmount('1/2 cup + more', 2)).toBe('1 cup + more');
  });

  it('guards against non-positive / non-finite factors', () => {
    expect(scaleAmount('400g', 0)).toBe('400g');
    expect(scaleAmount('400g', -2)).toBe('400g');
    expect(scaleAmount('400g', NaN)).toBe('400g');
    expect(scaleAmount('400g', Infinity)).toBe('400g');
  });

  it('renders a clean fraction rather than a long decimal when halving', () => {
    // 1 cup halved → 1/2 cup
    expect(scaleAmount('1 cup', 0.5)).toBe('1/2 cup');
    // 2 tbsp scaled by 0.75 → 1 1/2 tbsp
    expect(scaleAmount('2 tbsp', 0.75)).toBe('1 1/2 tbsp');
  });

  it('renders metric weights/volumes as plain numbers, never vulgar fractions', () => {
    // grams / ml → whole numbers
    expect(scaleAmount('500 g', 1 / 3)).toBe('167 g');
    expect(scaleAmount('200 g', 1 / 3)).toBe('67 g');
    expect(scaleAmount('400g', 2)).toBe('800g');
    expect(scaleAmount('250 ml', 1.5)).toBe('375 ml');
    // kg / L → up to 2 dp, no silent fraction-rounding error
    expect(scaleAmount('1.2 kg', 0.5)).toBe('0.6 kg');
    expect(scaleAmount('1.6 kg', 1.5)).toBe('2.4 kg'); // not "2 3/8 kg"
    expect(scaleAmount('1.2 L', 1 / 3)).toBe('0.4 L');
  });

  it('scales mixed fractions (whole + fraction), not just the integer part', () => {
    expect(scaleAmount('1 1/2 cups', 2)).toBe('3 cups');
    expect(scaleAmount('2 1/2 tbsp', 2)).toBe('5 tbsp');
    expect(scaleAmount('1 1/2 cups', 1.5)).toBe('2 1/4 cups');
  });
});
