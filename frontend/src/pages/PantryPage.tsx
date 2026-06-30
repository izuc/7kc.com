import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { daysUntil, fmtExpiry, SECTIONS } from '../lib/format';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';
import { OcrModal } from '../components/OcrModal';
import { useIngredients, displayFor, sectionFor } from '../hooks/useIngredients';
import { useSoftDelete } from '../hooks/useSoftDelete';
import { useUi } from '../store/ui';
import { trackEvent } from '../lib/analytics';
import { SkeletonGrid } from '../components/Skeleton';
import { IngredientIcon } from '../lib/ingredientIcons';
import { mutateWithOutbox } from '../lib/offlineSync';
import type { PantryItem, ParsedItem } from '../types/models';

type HydratedItem = PantryItem & { display: string; section: string; daysLeft: number | null };

export function PantryPage() {
  const qc = useQueryClient();
  const toast = useUi((s) => s.toast);
  const [view, setView] = useState<'section' | 'expiry' | 'alpha'>('section');
  const [showAdd, setShowAdd] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [scanText, setScanText] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const { data: cfg } = useQuery({ queryKey: ['config'], queryFn: () => api.config(), staleTime: 5 * 60 * 1000 });
  const canScan = cfg?.features?.ai_scan ?? false;
  const scanTiles = cfg?.features?.ai_scan_tiles ?? 1;

  const { data, isLoading } = useQuery({ queryKey: ['pantry'], queryFn: () => api.pantry() });
  const { data: statsData } = useQuery({ queryKey: ['stats'], queryFn: () => api.stats() });
  const stats = statsData?.stats;
  const { byId } = useIngredients();

  const items: HydratedItem[] = useMemo(() => {
    const raw = data?.items ?? [];
    return raw.map((p) => ({
      ...p,
      display: displayFor(byId, p.ingredient_id, p.custom_name),
      section: sectionFor(byId, p.ingredient_id, 'other'),
      daysLeft: p.expires_at != null ? daysUntil(p.expires_at * 1000) : null,
    }));
  }, [data, byId]);

  const expiringSoon = items.filter((i) => i.daysLeft != null && i.daysLeft >= 0 && i.daysLeft <= 3);
  const expired = items.filter((i) => i.daysLeft != null && i.daysLeft < 0);
  const low = items.filter((i) => i.running_low);

  const sortedForGridView = (() => {
    if (view === 'expiry')
      return [...items].sort((a, b) => (a.daysLeft ?? 9999) - (b.daysLeft ?? 9999));
    if (view === 'alpha') return [...items].sort((a, b) => a.display.localeCompare(b.display));
    return items;
  })();

  const invalidate = () => qc.invalidateQueries({ queryKey: ['pantry'] });

  if (isLoading) {
    return (
      <div className="screen">
        <div className="screen-head">
          <div className="screen-head-left">
            <div className="eyebrow">Pantry</div>
            <h1 className="screen-title">What you've got</h1>
          </div>
        </div>
        <SkeletonGrid count={8} />
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="screen-head">
        <div className="screen-head-left">
          <div className="eyebrow">
            Pantry<span className="dot-sep">·</span>
            <span className="mono">{items.length} items</span>
          </div>
          <h1 className="screen-title">What you've got</h1>
        </div>
        <div className="screen-head-right">
          <div className="segmented" role="group" aria-label="Sort pantry by">
            <button className={view === 'section' ? 'active' : ''} aria-pressed={view === 'section'} onClick={() => setView('section')}>
              By section
            </button>
            <button className={view === 'expiry' ? 'active' : ''} aria-pressed={view === 'expiry'} onClick={() => setView('expiry')}>
              By expiry
            </button>
            <button className={view === 'alpha' ? 'active' : ''} aria-pressed={view === 'alpha'} onClick={() => setView('alpha')}>
              A–Z
            </button>
          </div>
          {canScan && (
            <button className="btn btn-ghost" onClick={() => setShowScan(true)}>
              <Icon name="camera" size={14} /> Scan photo
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Icon name="plus" size={14} /> Add
          </button>
        </div>
      </div>

      <div className="pantry-stats">
        <div className="stat">
          <div className="stat-num">{items.length}</div>
          <div className="stat-label">in stock</div>
        </div>
        <div className={`stat ${expiringSoon.length ? 'warn' : ''}`}>
          <div className="stat-num">{expiringSoon.length}</div>
          <div className="stat-label">expiring soon</div>
        </div>
        <div className={`stat ${expired.length ? 'danger' : ''}`}>
          <div className="stat-num">{expired.length}</div>
          <div className="stat-label">expired</div>
        </div>
        <div className="stat">
          <div className="stat-num">{low.length}</div>
          <div className="stat-label">running low</div>
        </div>
      </div>

      {stats && (stats.rescued > 0 || stats.tossed > 0) && (
        <div className="waste-card">
          <div className="eyebrow sage">Waste &amp; savings · this month</div>
          <div className="waste-stats">
            <div className="stat">
              <div className="stat-num">{stats.rescued}</div>
              <div className="stat-label">rescued</div>
            </div>
            <div className="stat">
              <div className="stat-num">{stats.tossed}</div>
              <div className="stat-label">tossed</div>
            </div>
            <div className="stat">
              <div className="stat-num">
                {stats.rescue_rate ?? '–'}
                {stats.rescue_rate != null ? '%' : ''}
              </div>
              <div className="stat-label">rescue rate</div>
            </div>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty">
          <Icon name="pantry" size={26} />
          <p>Your pantry's empty — stock a few staples and recipes start ranking themselves.</p>
          <div className="row-inline" style={{ gap: 10 }}>
            <button
              className="btn btn-primary"
              disabled={seeding}
              onClick={async () => {
                setSeeding(true);
                try {
                  const r = await api.seedStaples();
                  invalidate();
                  qc.invalidateQueries({ queryKey: ['recipe-suggestions'] });
                  toast(`Stocked ${r.added} staple${r.added === 1 ? '' : 's'}`);
                } catch {
                  toast('Could not stock staples — try again.');
                } finally {
                  setSeeding(false);
                }
              }}
            >
              <Icon name="sparkle" size={14} /> {seeding ? 'Stocking…' : 'Stock common staples'}
            </button>
            <button className="btn btn-ghost" onClick={() => setShowAdd(true)}>
              Add my own
            </button>
          </div>
        </div>
      ) : view === 'section' ? (
        <div className="sections">
          {SECTIONS.map((s) => {
            const group = items.filter((i) => i.section === s.id);
            if (group.length === 0) return null;
            return (
              <div key={s.id} className="section">
                <div className="section-head">
                  <span>{s.label}</span>
                  <span className="mono muted">{group.length}</span>
                </div>
                <div className="pantry-grid stagger-in">
                  {group.map((i) => (
                    <PantryCard key={i.id} item={i} onChanged={invalidate} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="pantry-grid stagger-in">
          {sortedForGridView.map((i) => (
            <PantryCard key={i.id} item={i} onChanged={invalidate} />
          ))}
        </div>
      )}

      {showAdd && <AddPantryModal onClose={() => setShowAdd(false)} onAdded={invalidate} />}
      {showScan && (
        <OcrModal
          scanMode="pantry"
          tiles={scanTiles}
          onClose={() => setShowScan(false)}
          onText={(text) => {
            setShowScan(false);
            setScanText(text);
          }}
        />
      )}
      {scanText !== null && (
        <PantryScanConfirm text={scanText} onClose={() => setScanText(null)} onAdded={invalidate} />
      )}
    </div>
  );
}

/** Confirm + add the items detected in a fridge/pantry photo. The scanned text is
 * run through the parser so items map to known ingredients; the user reviews first. */
function PantryScanConfirm({ text, onClose, onAdded }: { text: string; onClose: () => void; onAdded: () => void }) {
  const toast = useUi((s) => s.toast);
  const { data, isLoading } = useQuery({ queryKey: ['parse', text], queryFn: () => api.parse(text), staleTime: Infinity });
  const items: ParsedItem[] = data?.items ?? [];
  const [checked, setChecked] = useState<boolean[]>([]);
  const [saving, setSaving] = useState(false);

  // default every recognised item to ticked once parsing returns
  useEffect(() => {
    setChecked(items.map(() => true));
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedCount = checked.filter(Boolean).length;

  const addAll = async () => {
    setSaving(true);
    let added = 0;
    for (let i = 0; i < items.length; i++) {
      if (!checked[i]) continue;
      const it = items[i];
      try {
        await api.addPantryItem(it.match ? { ingredient_id: it.match.id } : { custom_name: it.clean || it.raw });
        added++;
      } catch {
        /* skip failures, keep going */
      }
    }
    setSaving(false);
    trackEvent('pantry_scan_added');
    toast(added ? `Added ${added} item${added === 1 ? '' : 's'} to your pantry.` : 'Nothing was added.');
    onAdded();
    onClose();
  };

  return (
    <Modal onClose={onClose} eyebrow="Photo to pantry" title="Add what we spotted">
      {isLoading ? (
        <p className="muted small">Matching items…</p>
      ) : items.length === 0 ? (
        <p className="muted small">No items recognised — try a clearer photo or better lighting.</p>
      ) : (
        <>
          <p className="muted small">Untick anything that’s wrong, then add the rest to your pantry.</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0', maxHeight: '46vh', overflowY: 'auto' }}>
            {items.map((it, i) => (
              <li key={i}>
                <label className="row-inline" style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '6px 0' }}>
                  <input
                    type="checkbox"
                    checked={checked[i] ?? false}
                    onChange={() => setChecked((c) => c.map((v, j) => (j === i ? !v : v)))}
                  />
                  <span>{it.match ? it.match.display : it.clean || it.raw}</span>
                  {!it.match && <span className="chip" style={{ fontSize: 11 }}>new</span>}
                  {it.match?.confidence === 'maybe' && <span className="chip" style={{ fontSize: 11 }}>maybe</span>}
                </label>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onClose} disabled={saving}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={addAll} disabled={saving || selectedCount === 0}>
          {saving ? 'Adding…' : `Add ${selectedCount} to pantry`}
        </button>
      </div>
    </Modal>
  );
}

function PantryCard({ item, onChanged }: { item: HydratedItem; onChanged: () => void }) {
  const softDelete = useSoftDelete();
  const qc = useQueryClient();
  const warn = item.daysLeft != null && item.daysLeft >= 0 && item.daysLeft <= 3;
  const danger = item.daysLeft != null && item.daysLeft < 0;

  // "Running low" is a common in-the-kitchen toggle that should work offline too.
  const toggleLow = () => {
    const target = !item.running_low;
    mutateWithOutbox({
      qc,
      optimistic: () =>
        qc.setQueryData(['pantry'], (old: any) =>
          old
            ? { ...old, items: old.items.map((x: any) => (x.id === item.id ? { ...x, running_low: target } : x)) }
            : old
        ),
      op: { kind: 'updatePantryItem', id: item.id, payload: { running_low: target } },
      run: () => api.updatePantryItem(item.id, { running_low: target }),
      reconcileKey: ['pantry'],
    }).catch(() => {});
  };
  return (
    <div className={`pantry-card ${danger ? 'danger ' : warn ? 'warn ' : ''}${item.running_low ? 'low' : ''}`}>
      <div className="pantry-card-head">
        {item.ingredient_id ? (
          <IngredientIcon id={item.ingredient_id} section={item.section} size={32} title={item.display} />
        ) : (
          <div className={`section-dot section-dot-${item.section}`} />
        )}
        <span className="pantry-name">{item.display}</span>
        <button
          className="x"
          aria-label={`Remove ${item.display}`}
          onClick={() =>
            softDelete({
              queryKey: ['pantry'],
              optimistic: (old) => ({ ...old, items: old.items.filter((x: any) => x.id !== item.id) }),
              restore: (old) =>
                old.items.some((x: any) => x.id === item.id) ? old : { ...old, items: [...old.items, item] },
              commit: () => api.deletePantryItem(item.id),
              text: `Removed ${item.display}`,
            })
          }
        >
          <Icon name="x" size={12} />
        </button>
      </div>
      <div className="pantry-meta">
        <span className="mono small">{item.expires_at ? fmtExpiry(item.expires_at) : 'No expiry'}</span>
        {item.running_low && (
          <span className="tag tag-amber">
            <Icon name="low" size={10} /> low
          </span>
        )}
      </div>
      <div className="pantry-actions">
        <button className="chip" onClick={toggleLow}>
          {item.running_low ? 'Not low' : 'Running low'}
        </button>
        {danger && (
          <button
            className="chip chip-danger"
            onClick={() =>
              softDelete({
                queryKey: ['pantry'],
                optimistic: (old) => ({ ...old, items: old.items.filter((x: any) => x.id !== item.id) }),
                restore: (old) =>
                  old.items.some((x: any) => x.id === item.id) ? old : { ...old, items: [...old.items, item] },
                commit: () => api.deletePantryItem(item.id, 'tossed'),
                invalidateKeys: [['stats']],
                text: `Tossed ${item.display}`,
              })
            }
          >
            Toss it
          </button>
        )}
      </div>
    </div>
  );
}

function AddPantryModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [q, setQ] = useState('');
  const toast = useUi((s) => s.toast);
  const { data } = useQuery({
    queryKey: ['ingredients', q],
    queryFn: () => api.ingredients(q),
    staleTime: 60_000,
  });
  const matches = data?.items ?? [];

  const add = async (payload: { ingredient_id?: string; custom_name?: string }) => {
    try {
      await api.addPantryItem(payload);
      trackEvent('pantry_item_added');
      onAdded();
      onClose();
    } catch {
      toast("Couldn't add that — please try again.");
    }
  };

  return (
    <Modal small title="Add to pantry" onClose={onClose}>
      <input
        autoFocus
        className="text-input"
        placeholder="Search ingredients…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && matches[0]) void add({ ingredient_id: matches[0].id });
        }}
      />
      <ul className="typeahead inline">
        {matches.slice(0, 20).map((i) => (
          <li key={i.id}>
            <button type="button" className="typeahead-row" onClick={() => void add({ ingredient_id: i.id })}>
              <IngredientIcon id={i.id} section={i.section} size={28} title={i.display} />
              {i.display}
              <span className="mono muted small">{i.shelf_life_days}d shelf</span>
            </button>
          </li>
        ))}
        {q.trim() && !matches.some((m) => m.display.toLowerCase() === q.toLowerCase()) && (
          <li className="custom">
            <button type="button" className="typeahead-row" onClick={() => void add({ custom_name: q.trim() })}>
              <Icon name="plus" size={12} /> Add as custom: <b>"{q}"</b>
            </button>
          </li>
        )}
      </ul>
    </Modal>
  );
}
