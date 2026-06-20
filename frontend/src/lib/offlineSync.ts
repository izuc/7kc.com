import { create } from 'zustand';
import type { QueryClient, QueryKey } from '@tanstack/react-query';
import { api, ApiError } from './api';
import {
  type OutboxOp,
  outboxAdd,
  outboxAll,
  outboxCount,
  outboxDelete,
  planFlush,
} from './outbox';

interface SyncState {
  online: boolean;
  pending: number;
  syncing: boolean;
  /** Set when a flush stalls on a transient server error (5xx/429); cleared on a clean drain. */
  retrying: boolean;
}

/** Connectivity + pending-write state, surfaced in the nav as a small indicator. */
export const useSync = create<SyncState>(() => ({
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  pending: 0,
  syncing: false,
  retrying: false,
}));

async function refreshPending() {
  useSync.setState({ pending: await outboxCount() });
}

async function enqueue(op: OutboxOp) {
  await outboxAdd(op);
  await refreshPending();
}

/** Replay one semantic op against the live API. */
function replay(op: OutboxOp): Promise<unknown> {
  switch (op.kind) {
    case 'setBought':
      return api.toggleBought(op.listId, op.itemId, op.value);
    case 'addListItems':
      return api.addListItems(op.listId, op.items);
    case 'deleteListItem':
      return api.deleteListItem(op.listId, op.itemId);
    case 'addPantryItem':
      return api.addPantryItem(op.payload);
    case 'updatePantryItem':
      return api.updatePantryItem(op.id, op.payload);
    case 'deletePantryItem':
      return api.deletePantryItem(op.id, op.reason);
  }
}

let flushing = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let retryAttempt = 0;

/** Back off on transient failures: 5s, 15s, 45s, … capped at ~5 min. */
function scheduleRetry(qc?: QueryClient) {
  if (retryTimer) return; // one timer in flight at a time
  const delay = Math.min(5000 * 3 ** retryAttempt, 5 * 60 * 1000);
  retryAttempt += 1;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    flushOutbox(qc);
  }, delay);
}

function clearRetry() {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = null;
  retryAttempt = 0;
}

/**
 * Drain the outbox in order. Keeps the queue intact on transient failures —
 * still offline (fetch-level), auth-expired (401), or a busy/erroring server
 * (429/5xx) — and only drops a *server-rejected* op (4xx verdict) so one poison
 * entry can't wedge the queue. Transient stops schedule a backed-off retry.
 */
export async function flushOutbox(qc?: QueryClient): Promise<void> {
  if (flushing || (typeof navigator !== 'undefined' && !navigator.onLine)) return;
  const raw = await outboxAll();
  if (raw.length === 0) {
    clearRetry();
    useSync.setState({ retrying: false });
    return;
  }

  flushing = true;
  useSync.setState({ syncing: true });
  let stopped = false; // transient stop — leave the rest queued
  try {
    for (const item of planFlush(raw)) {
      if (item.op === null) {
        // collapsed to nothing (e.g. add+delete offline) — just purge the rows
        for (const seq of item.seqs) await outboxDelete(seq);
        continue;
      }
      try {
        await replay(item.op);
      } catch (e) {
        if (e instanceof ApiError) {
          if (e.status === 401) { stopped = true; break; } // auth expired — keep the queue, retry after re-login
          if (e.status === 429 || e.status >= 500) { stopped = true; break; } // server busy/erroring — keep the op, retry later
          // 400/404/409/422 etc: the server reached a verdict; dropping avoids a wedged queue
        } else {
          stopped = true; // fetch-level failure → still offline, leave the rest queued
          break;
        }
      }
      for (const seq of item.seqs) await outboxDelete(seq);
    }
  } finally {
    flushing = false;
    const left = await outboxCount();
    useSync.setState({ pending: left, syncing: false, retrying: stopped && left > 0 });
    if (stopped && left > 0) {
      // a transient stop with work still queued → retry with backoff
      if (navigator.onLine) scheduleRetry(qc);
    } else {
      clearRetry();
      if (qc) {
        qc.invalidateQueries({ queryKey: ['lists'] });
        qc.invalidateQueries({ queryKey: ['pantry'] });
      }
    }
  }
}

/**
 * Apply a mutation with offline durability: write the optimistic change to the
 * cache immediately, then try the network. A fetch-level failure (offline /
 * unreachable) queues the op for replay and resolves quietly — the optimistic
 * state stands. A server *rejection* (ApiError) re-syncs truth and rethrows so
 * the caller can surface it.
 */
export async function mutateWithOutbox(opts: {
  qc: QueryClient;
  optimistic?: () => void;
  op: OutboxOp;
  run: () => Promise<unknown>;
  reconcileKey?: QueryKey;
}): Promise<void> {
  opts.optimistic?.();

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    await enqueue(opts.op);
    return;
  }
  try {
    await opts.run();
    if (opts.reconcileKey) opts.qc.invalidateQueries({ queryKey: opts.reconcileKey });
  } catch (e) {
    if (e instanceof ApiError) {
      if (opts.reconcileKey) opts.qc.invalidateQueries({ queryKey: opts.reconcileKey });
      throw e;
    }
    // network-level failure → durable queue, keep the optimistic state
    await enqueue(opts.op);
  }
}

/** User-initiated retry (e.g. a "Retry" button) — reset backoff and flush now. */
export function retryNow(qc: QueryClient): void {
  clearRetry();
  flushOutbox(qc);
}

let wired = false;

/** Wire connectivity listeners + an initial flush. Safe to call once on app start. */
export function initOfflineSync(qc: QueryClient): void {
  if (wired || typeof window === 'undefined') return;
  wired = true;

  const goOnline = () => {
    useSync.setState({ online: true });
    clearRetry(); // reconnect → flush now, backoff starts fresh
    flushOutbox(qc);
  };
  window.addEventListener('online', goOnline);
  window.addEventListener('offline', () => useSync.setState({ online: false }));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && navigator.onLine) flushOutbox(qc);
  });

  refreshPending();
  if (navigator.onLine) flushOutbox(qc);
}
