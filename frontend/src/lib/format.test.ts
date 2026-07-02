import { describe, it, expect } from 'vitest';
import { daysUntil, fmtExpiry, fmtRelative, numberToWords, numberToWordsSentence } from './format';

describe('format helpers', () => {
  const nowSec = Math.floor(Date.now() / 1000);

  it('daysUntil rounds ms to whole days', () => {
    expect(daysUntil(Date.now() + 3 * 86_400_000)).toBe(3);
    expect(daysUntil(Date.now() - 86_400_000)).toBe(-1);
  });

  it('fmtExpiry covers null and tenses', () => {
    expect(fmtExpiry(null)).toBe('No expiry');
    expect(fmtExpiry(nowSec + 86_400)).toBe('Expires tomorrow');
    expect(fmtExpiry(nowSec - 2 * 86_400)).toBe('Expired 2d ago');
  });

  it('fmtRelative formats recent timestamps', () => {
    expect(fmtRelative(nowSec - 120)).toBe('2m ago');
    expect(fmtRelative(nowSec - 5)).toBe('just now');
  });

  it('numberToWords spells Australian-English numbers', () => {
    expect(numberToWords(0)).toBe('zero');
    expect(numberToWords(14)).toBe('fourteen');
    expect(numberToWords(40)).toBe('forty');
    expect(numberToWords(87)).toBe('eighty-seven');
    expect(numberToWords(100)).toBe('one hundred');
    expect(numberToWords(204)).toBe('two hundred and four');
    expect(numberToWords(240)).toBe('two hundred and forty');
    expect(numberToWords(999)).toBe('nine hundred and ninety-nine');
    expect(numberToWords(1000)).toBe('one thousand');
    expect(numberToWords(1024)).toBe('one thousand and twenty-four');
    expect(numberToWords(2350)).toBe('two thousand, three hundred and fifty');
  });

  it('numberToWords falls back to digits outside its range', () => {
    expect(numberToWords(10000)).toBe('10000');
    expect(numberToWords(-3)).toBe('-3');
    expect(numberToWords(2.5)).toBe('2.5');
  });

  it('numberToWordsSentence capitalises the first letter', () => {
    expect(numberToWordsSentence(240)).toBe('Two hundred and forty');
  });
});
