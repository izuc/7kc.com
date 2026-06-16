// Offline write outbox: a durable, ordered queue of *semantic* mutations that
// could not reach the server (we were offline). On reconnect it's replayed in
// order. Operations are semantic (not raw HTTP) so we can safely collapse
// redundant ones — crucially, `setBought` carries a target state (not a flip),
// so replaying it is idempotent even if it lands twice.

export type OutboxOp =
  | { kind: 'setBought'; listId: string; itemId: string; value: boolean }
  | { kind: 'addListItems'; listId: string; items: AddListItem[] }
  | { kind: 'deleteListItem'; listId: string; itemId: string }
  | { kind: 'addPantryItem'; tempId: string; payload: PantryPayload }
  | { kind: 'updatePantryItem'; id: string; payload: PantryPatch }
  | { kind: 'deletePantryItem'; id: string; reason?: string };

export interface AddListItem {
  ingredient_id?: string | null;
  custom_name?: string | null;
  section?: string;
}
export interface PantryPayload {
  ingredient_id?: string | null;
  custom_name?: string | null;
  expires_at?: number | null;
  running_low?: boolean;
}
export interface PantryPatch {
  expires_at?: number | null;
  running_low?: boolean;
  notes?: string | null;
}

export interface OutboxEntry {
  seq: number;
  op: OutboxOp;
}

/** One step of a flush: replay `op` (or, when null, just purge the stored rows), then delete all `seqs`. */
export interface PlanItem {
  op: OutboxOp | null;
  seqs: number[];
}

const DB_NAME = '7kc-outbox';
const STORE = 'ops';

/**
 * Build an ordered flush plan from the raw queue, collapsing redundant ops while
 * preserving the net effect (each plan item records every stored `seq` it consumes,
 * so storage cleanup stays correct after merges):
 *  - multiple `setBought` on the same item → one replay with the latest target;
 *  - a `deleteListItem` supersedes any earlier `setBought` for that item;
 *  - `deletePantryItem` cancels an earlier `addPantryItem` with the same tempId
 *    (added then removed while offline → never touches the server: op = null);
 *  - `updatePantryItem` patches on the same id merge into one.
 * Pure + deterministic so it's unit-testable without IndexedDB.
 */
export function planFlush(entries: OutboxEntry[]): PlanItem[] {
  const plan: PlanItem[] = [];
  const boughtIdx = new Map<string, number>(); // listId|itemId → index in plan
  const pantryUpdIdx = new Map<string, number>(); // id → index in plan
  const pantryAddIdx = new Map<string, number>(); // tempId → index in plan

  for (const { seq, op } of entries) {
    switch (op.kind) {
      case 'setBought': {
        const key = `${op.listId}|${op.itemId}`;
        const prev = boughtIdx.get(key);
        if (prev !== undefined) {
          plan[prev] = { op, seqs: [...plan[prev].seqs, seq] };
        } else {
          boughtIdx.set(key, plan.length);
          plan.push({ op, seqs: [seq] });
        }
        break;
      }
      case 'deleteListItem': {
        const key = `${op.listId}|${op.itemId}`;
        const prev = boughtIdx.get(key);
        const seqs = [seq];
        if (prev !== undefined) {
          seqs.unshift(...plan[prev].seqs); // void the toggle; purge its row alongside the delete
          plan[prev] = { op: null, seqs: [] };
          boughtIdx.delete(key);
        }
        plan.push({ op, seqs });
        break;
      }
      case 'addPantryItem': {
        pantryAddIdx.set(op.tempId, plan.length);
        plan.push({ op, seqs: [seq] });
        break;
      }
      case 'updatePantryItem': {
        const prev = pantryUpdIdx.get(op.id);
        if (prev !== undefined) {
          const merged = { ...(plan[prev].op as { payload: PantryPatch }).payload, ...op.payload };
          plan[prev] = { op: { ...op, payload: merged }, seqs: [...plan[prev].seqs, seq] };
        } else {
          pantryUpdIdx.set(op.id, plan.length);
          plan.push({ op, seqs: [seq] });
        }
        break;
      }
      case 'deletePantryItem': {
        const addAt = pantryAddIdx.get(op.id);
        if (addAt !== undefined) {
          // added then deleted offline → cancel both; purge their rows, no network call
          const seqs = [...plan[addAt].seqs, seq];
          plan[addAt] = { op: null, seqs: [] };
          pantryAddIdx.delete(op.id);
          plan.push({ op: null, seqs });
          break;
        }
        plan.push({ op, seqs: [seq] });
        break;
      }
      default:
        plan.push({ op, seqs: [seq] });
    }
  }
  return plan.filter((p) => p.seqs.length > 0);
}

// ---- IndexedDB persistence (thin; falls back to in-memory when unavailable) ----

let memSeq = 0;
const mem: OutboxEntry[] = [];
const hasIDB = typeof indexedDB !== 'undefined';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: 'seq', autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function outboxAdd(op: OutboxOp): Promise<void> {
  if (!hasIDB) {
    mem.push({ seq: ++memSeq, op });
    return;
  }
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).add({ op });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function outboxAll(): Promise<OutboxEntry[]> {
  if (!hasIDB) return [...mem];
  const db = await openDb();
  const rows = await new Promise<OutboxEntry[]>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as OutboxEntry[]);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return rows.sort((a, b) => a.seq - b.seq);
}

export async function outboxDelete(seq: number): Promise<void> {
  if (!hasIDB) {
    const i = mem.findIndex((e) => e.seq === seq);
    if (i >= 0) mem.splice(i, 1);
    return;
  }
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(seq);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function outboxCount(): Promise<number> {
  return (await outboxAll()).length;
}
