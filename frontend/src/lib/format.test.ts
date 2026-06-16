import { describe, it, expect } from 'vitest';
import { daysUntil, fmtExpiry, fmtRelative } from './format';

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
});
