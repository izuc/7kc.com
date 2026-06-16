import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { daysUntil, fmtExpiry, SECTIONS } from '../lib/format';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';
import { useIngredients, displayFor, sectionFor } from '../hooks/useIngredients';
import { useSoftDelete } from '../hooks/useSoftDelete';
import { useUi } from '../store/ui';
import { SkeletonGrid } from '../components/Skeleton';
import { IngredientIcon } from '../lib/ingredientIcons';
import type { PantryItem } from '../types/models';

type HydratedItem = PantryItem & { display: string; section: string; daysLeft: number | null };

export function PantryPage() {
  const qc = useQueryClient();
  const toast = useUi((s) => s.toast);
  const [view, setView] = useState<'section' | 'expiry' | 'alpha'>('section');
  const [showAdd, setShowAdd] = useState(false);
  const [seeding, setSeeding] = useState(false);

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
          <div className="segmented">
            <button className={view === 'section' ? 'active' : ''} onClick={() => setView('section')}>
              By section
            </button>
            <button className={view === 'expiry' ? 'active' : ''} onClick={() => setView('expiry')}>
              By expiry
            </button>
            <button className={view === 'alpha' ? 'active' : ''} onClick={() => setView('alpha')}>
              A–Z
            </button>
          </div>
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
    </div>
  );
}

function PantryCard({ item, onChanged }: { item: HydratedItem; onChanged: () => void }) {
  const softDelete = useSoftDelete();
  const warn = item.daysLeft != null && item.daysLeft >= 0 && item.daysLeft <= 3;
  const danger = item.daysLeft != null && item.daysLeft < 0;
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
        <button
          className="chip"
          onClick={async () => {
            await api.updatePantryItem(item.id, { running_low: !item.running_low });
            onChanged();
          }}
        >
          {item.running_low ? 'Not low' : 'Running low'}
        </button>
        {danger && (
          <button
            className="chip chip-danger"
            onClick={() =>
              softDelete({
                queryKey: ['pantry'],
                optimistic: (old) => ({ ...old, items: old.items.filter((x: any) => x.id !== item.id) }),
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
  const { data } = useQuery({
    queryKey: ['ingredients', q],
    queryFn: () => api.ingredients(q),
    staleTime: 60_000,
  });
  const matches = data?.items ?? [];
  return (
    <Modal small title="Add to pantry" onClose={onClose}>
      <input
        autoFocus
        className="text-input"
        placeholder="Search ingredients…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <ul className="typeahead inline">
        {matches.slice(0, 20).map((i) => (
          <li
            key={i.id}
            onClick={async () => {
              await api.addPantryItem({ ingredient_id: i.id });
              onAdded();
              onClose();
            }}
          >
            <IngredientIcon id={i.id} section={i.section} size={28} title={i.display} />
            {i.display}
            <span className="mono muted small">{i.shelf_life_days}d shelf</span>
          </li>
        ))}
        {q.trim() && !matches.some((m) => m.display.toLowerCase() === q.toLowerCase()) && (
          <li
            className="custom"
            onClick={async () => {
              await api.addPantryItem({ custom_name: q.trim() });
              onAdded();
              onClose();
            }}
          >
            <Icon name="plus" size={12} /> Add as custom: <b>"{q}"</b>
          </li>
        )}
      </ul>
    </Modal>
  );
}
