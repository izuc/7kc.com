import { describe, it, expect } from 'vitest';
import { planFlush, type OutboxEntry } from './outbox';

const e = (seq: number, op: OutboxEntry['op']): OutboxEntry => ({ seq, op });

describe('planFlush', () => {
  it('collapses repeated bought-toggles on the same item to the latest target', () => {
    const plan = planFlush([
      e(1, { kind: 'setBought', listId: 'L', itemId: 'A', value: true }),
      e(2, { kind: 'setBought', listId: 'L', itemId: 'A', value: false }),
      e(3, { kind: 'setBought', listId: 'L', itemId: 'A', value: true }),
    ]);
    expect(plan).toHaveLength(1);
    expect(plan[0].op).toEqual({ kind: 'setBought', listId: 'L', itemId: 'A', value: true });
    // every consumed row is purged together
    expect(plan[0].seqs.sort()).toEqual([1, 2, 3]);
  });

  it('keeps bought-toggles for different items independent', () => {
    const plan = planFlush([
      e(1, { kind: 'setBought', listId: 'L', itemId: 'A', value: true }),
      e(2, { kind: 'setBought', listId: 'L', itemId: 'B', value: true }),
    ]);
    expect(plan).toHaveLength(2);
  });

  it('a delete supersedes a pending toggle for the same item (no wasted flip)', () => {
    const plan = planFlush([
      e(1, { kind: 'setBought', listId: 'L', itemId: 'A', value: true }),
      e(2, { kind: 'deleteListItem', listId: 'L', itemId: 'A' }),
    ]);
    expect(plan).toHaveLength(1);
    expect(plan[0].op).toEqual({ kind: 'deleteListItem', listId: 'L', itemId: 'A' });
    expect(plan[0].seqs.sort()).toEqual([1, 2]); // both rows purged on the delete's success
  });

  it('cancels a pantry item added then deleted while offline (never hits the server)', () => {
    const plan = planFlush([
      e(1, { kind: 'addPantryItem', tempId: 'tmp1', payload: { ingredient_id: 'milk' } }),
      e(2, { kind: 'deletePantryItem', id: 'tmp1' }),
    ]);
    // op === null → purge rows, no network call
    expect(plan.every((p) => p.op === null)).toBe(true);
    expect(plan.flatMap((p) => p.seqs).sort()).toEqual([1, 2]);
  });

  it('merges successive pantry patches on the same id', () => {
    const plan = planFlush([
      e(1, { kind: 'updatePantryItem', id: 'X', payload: { running_low: true } }),
      e(2, { kind: 'updatePantryItem', id: 'X', payload: { expires_at: 999 } }),
    ]);
    expect(plan).toHaveLength(1);
    expect(plan[0].op).toEqual({
      kind: 'updatePantryItem',
      id: 'X',
      payload: { running_low: true, expires_at: 999 },
    });
    expect(plan[0].seqs.sort()).toEqual([1, 2]);
  });

  it('preserves order and independent ops', () => {
    const plan = planFlush([
      e(1, { kind: 'addListItems', listId: 'L', items: [{ ingredient_id: 'eggs' }] }),
      e(2, { kind: 'setBought', listId: 'L', itemId: 'A', value: true }),
      e(3, { kind: 'deletePantryItem', id: 'real-id' }),
    ]);
    expect(plan.map((p) => p.op?.kind)).toEqual(['addListItems', 'setBought', 'deletePantryItem']);
  });
});
