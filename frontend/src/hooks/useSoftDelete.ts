import { useQueryClient } from '@tanstack/react-query';
import { useUi } from '../store/ui';
import { ApiError } from '../lib/api';

interface SoftDeleteOpts {
  /** react-query key whose cached data holds the item */
  queryKey: unknown[];
  /** return a copy of the cached value with the item removed */
  optimistic: (old: any) => any;
  /** re-insert the item into the CURRENT cached value (mirror of optimistic) */
  restore: (old: any) => any;
  /** the real API delete, run only after the grace window elapses */
  commit: () => Promise<unknown>;
  /** toast text, e.g. "Removed eggs" */
  text: string;
  /** extra query keys to invalidate after a successful commit (e.g. derived stats) */
  invalidateKeys?: unknown[][];
  graceMs?: number;
}

/**
 * Deferred-commit delete: drop the item from the cache immediately, show an "Undo"
 * toast, and hold the actual API call until the grace window passes. Undo (and a
 * commit failure) re-insert the item into the CURRENT cache via a targeted updater
 * — NOT a stale whole-query snapshot — so any sibling edit made during the grace
 * window (e.g. ticking another item bought) is preserved.
 */
export function useSoftDelete() {
  const qc = useQueryClient();
  const toast = useUi((s) => s.toast);

  return function softDelete(opts: SoftDeleteOpts) {
    const grace = opts.graceMs ?? 5000;
    qc.setQueryData(opts.queryKey, (old: any) => (old ? opts.optimistic(old) : old));
    const restore = () => qc.setQueryData(opts.queryKey, (old: any) => (old ? opts.restore(old) : old));

    let undone = false;
    const timer = setTimeout(async () => {
      if (undone) return;
      try {
        await opts.commit();
        qc.invalidateQueries({ queryKey: opts.queryKey });
        for (const k of opts.invalidateKeys ?? []) qc.invalidateQueries({ queryKey: k });
      } catch (e) {
        restore();
        if (!(e instanceof ApiError && e.status === 401)) toast('Could not delete — restored it.');
      }
    }, grace);

    toast(
      opts.text,
      {
        label: 'Undo',
        run: () => {
          undone = true;
          clearTimeout(timer);
          restore();
        },
      },
      grace
    );
  };
}
