import { useQueryClient } from '@tanstack/react-query';
import { useUi } from '../store/ui';
import { ApiError } from '../lib/api';

interface SoftDeleteOpts {
  /** react-query key whose cached data holds the item */
  queryKey: unknown[];
  /** return a copy of the cached value with the item removed */
  optimistic: (old: any) => any;
  /** the real API delete, run only after the grace window elapses */
  commit: () => Promise<unknown>;
  /** toast text, e.g. "Removed eggs" */
  text: string;
  graceMs?: number;
}

/**
 * Deferred-commit delete: drop the item from the cache immediately, show an "Undo"
 * toast, and hold the actual API call until the grace window passes. Undo restores
 * the exact snapshot (no lossy re-insert, and the server still has the row). On
 * commit failure the snapshot is restored too.
 */
export function useSoftDelete() {
  const qc = useQueryClient();
  const toast = useUi((s) => s.toast);

  return function softDelete(opts: SoftDeleteOpts) {
    const grace = opts.graceMs ?? 5000;
    const snapshot = qc.getQueryData(opts.queryKey);
    qc.setQueryData(opts.queryKey, (old: any) => (old ? opts.optimistic(old) : old));

    let undone = false;
    const timer = setTimeout(async () => {
      if (undone) return;
      try {
        await opts.commit();
        qc.invalidateQueries({ queryKey: opts.queryKey });
      } catch (e) {
        qc.setQueryData(opts.queryKey, snapshot);
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
          qc.setQueryData(opts.queryKey, snapshot);
        },
      },
      grace
    );
  };
}
