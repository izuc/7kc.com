import { useMemo, useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import { SECTIONS } from '../lib/format';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';
import { useUi } from '../store/ui';
import { useIngredients, displayFor } from '../hooks/useIngredients';
import { OcrModal } from '../components/OcrModal';
import { AffiliateButtons } from '../components/AffiliateButtons';
import { SkeletonList } from '../components/Skeleton';
import { IngredientIcon } from '../lib/ingredientIcons';
import { trackEvent } from '../lib/analytics';
import type { ListItem, ParsedItem, Ingredient } from '../types/models';

export function ListsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const params = useParams();
  const toast = useUi((s) => s.toast);

  const [showPaste, setShowPaste] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [showOcr, setShowOcr] = useState(false);
  const [ocrSeedText, setOcrSeedText] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ['lists'], queryFn: () => api.lists() });
  const lists = data?.lists ?? [];
  const activeLists = lists.filter((l) => !l.archived_at);
  const list =
    lists.find((l) => l.id === params.id) ?? activeLists[0] ?? null;

  useEffect(() => {
    if (list && params.id && list.id !== params.id) {
      navigate(`/lists/${list.id}`, { replace: true });
    }
  }, [list, params.id, navigate]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['lists'] });

  // Surface failures instead of silently no-opping (401 is handled globally → login).
  const guard = async (fn: () => Promise<void>) => {
    try {
      await fn();
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 401)) {
        toast("Couldn't update the list — please try again.");
      }
    }
  };

  const createList = useMutation({
    mutationFn: (name: string) => api.createList(name),
    onSuccess: (r) => {
      setShowNew(false);
      setNewName('');
      invalidate();
      navigate(`/lists/${r.list.id}`);
    },
    onError: () => toast("Couldn't create the list — please try again."),
  });

  if (isLoading) {
    return (
      <div className="screen">
        <div className="screen-head">
          <div className="screen-head-left">
            <div className="eyebrow">Shopping list</div>
            <span className="skeleton skeleton-line tall" style={{ width: 220 }} />
          </div>
        </div>
        <SkeletonList rows={6} />
      </div>
    );
  }

  if (!list) {
    return (
      <div className="screen">
        <div className="empty">
          <p>No lists yet.</p>
          <button
            className="btn btn-primary"
            onClick={() => createList.mutate('Weekly shop')}
            disabled={createList.isPending}
          >
            Create one
          </button>
        </div>
      </div>
    );
  }

  const unbought = list.items.filter((i) => !i.is_bought);
  const bought = list.items.filter((i) => i.is_bought);
  const boughtToMove = bought.filter((i) => !i.moved_to_pantry);
  const progress = list.items.length ? bought.length / list.items.length : 0;

  return (
    <div className="screen">
      <div className="screen-head">
        <div className="screen-head-left">
          <div className="eyebrow">
            Shopping list<span className="dot-sep">·</span>
            <span className="mono">{list.items.length} items</span>
          </div>
          <h1 className="screen-title">{list.name}</h1>
          <div className="lists-tabs">
            {activeLists.map((l) => (
              <button
                key={l.id}
                className={`list-tab ${l.id === list.id ? 'active' : ''}`}
                onClick={() => navigate(`/lists/${l.id}`)}
              >
                {l.name}
                <span className="mono muted small">
                  {l.items.filter((i) => i.is_bought).length}/{l.items.length}
                </span>
              </button>
            ))}
            <button className="list-tab add" onClick={() => setShowNew(true)}>
              <Icon name="plus" size={14} /> New
            </button>
          </div>
        </div>
        <div className="screen-head-right">
          <button
            className="btn btn-ghost"
            disabled={list.items.length === 0}
            onClick={() =>
              guard(async () => {
                await api.markAllBought(list.id);
                invalidate();
                toast('Marked all bought');
              })
            }
          >
            <Icon name="check" size={14} /> Mark all bought
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => {
              setShowOcr(true);
              trackEvent('ocr_open');
            }}
            title="Scan a handwritten list"
          >
            <Icon name="sparkle" size={14} /> Scan photo
          </button>
          <button className="btn btn-primary" onClick={() => setShowPaste(true)}>
            <Icon name="sparkle" size={14} /> Paste list
          </button>
        </div>
      </div>

      <div className="progress-row">
        <div className="progress">
          <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>
        <span className="mono small muted">
          {bought.length}/{list.items.length} · {Math.round(progress * 100)}%
        </span>
      </div>

      <QuickAdd listId={list.id} onAdded={invalidate} />

      <ShoppingAffiliateRow items={unbought} />

      <SectionGroup
        items={unbought}
        renderItem={(it) => (
          <ItemRow
            key={it.id}
            item={it}
            onToggle={() =>
              guard(async () => {
                await api.toggleBought(list.id, it.id);
                invalidate();
              })
            }
            onRemove={() =>
              guard(async () => {
                await api.deleteListItem(list.id, it.id);
                invalidate();
              })
            }
          />
        )}
        emptyHint={
          <div className="empty">
            <Icon name="cart" size={26} />
            <p>Nothing on the list yet.</p>
            <button className="btn btn-primary" onClick={() => setShowPaste(true)}>
              Paste something in
            </button>
          </div>
        }
      />

      {bought.length > 0 && (
        <div className="bought-block">
          <div className="bought-head">
            <h3>In the trolley</h3>
            <span className="mono muted">{bought.length}</span>
            {boughtToMove.length > 0 && (
              <button
                className="btn btn-sage"
                onClick={() =>
                  guard(async () => {
                    const r = await api.moveBoughtToPantry(list.id);
                    invalidate();
                    qc.invalidateQueries({ queryKey: ['pantry'] });
                    toast(`${r.moved} moved to pantry`);
                  })
                }
              >
                <Icon name="pantry" size={14} /> Move {boughtToMove.length} to pantry
              </button>
            )}
          </div>
          <ul className="items bought-items">
            {bought.map((it) => (
              <ItemRow
                key={it.id}
                item={it}
                onToggle={() =>
                  guard(async () => {
                    await api.toggleBought(list.id, it.id);
                    invalidate();
                  })
                }
                onRemove={() =>
                  guard(async () => {
                    await api.deleteListItem(list.id, it.id);
                    invalidate();
                  })
                }
              />
            ))}
          </ul>
        </div>
      )}

      {showPaste && (
        <PasteParseModal
          listId={list.id}
          seedText={ocrSeedText}
          onClose={() => {
            setShowPaste(false);
            setOcrSeedText(null);
            invalidate();
          }}
        />
      )}

      {showOcr && (
        <OcrModal
          onClose={() => setShowOcr(false)}
          onText={(text) => {
            setShowOcr(false);
            setOcrSeedText(text);
            setShowPaste(true);
            trackEvent('ocr_success', { chars: text.length });
          }}
        />
      )}

      {showNew && (
        <Modal small title="New list" onClose={() => setShowNew(false)}>
          <input
            className="text-input"
            placeholder="e.g. Weekend BBQ"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newName.trim()) createList.mutate(newName.trim());
            }}
          />
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setShowNew(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              disabled={!newName.trim() || createList.isPending}
              onClick={() => createList.mutate(newName.trim())}
            >
              Create
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function SectionGroup({
  items,
  renderItem,
  emptyHint,
}: {
  items: ListItem[];
  renderItem: (i: ListItem) => React.ReactNode;
  emptyHint: React.ReactNode;
}) {
  const grouped = useMemo(() => {
    const g: Record<string, ListItem[]> = {};
    for (const s of SECTIONS) g[s.id] = [];
    for (const it of items) (g[it.section] || g.other).push(it);
    return g;
  }, [items]);

  return (
    <div className="sections">
      {SECTIONS.map((s) =>
        grouped[s.id].length ? (
          <div key={s.id} className="section">
            <div className="section-head">
              <span>{s.label}</span>
              <span className="mono muted">{grouped[s.id].length}</span>
            </div>
            <ul className="items">{grouped[s.id].map(renderItem)}</ul>
          </div>
        ) : null
      )}
      {items.length === 0 && emptyHint}
    </div>
  );
}

function ItemRow({
  item,
  onToggle,
  onRemove,
}: {
  item: ListItem;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const { byId } = useIngredients();
  const name = displayFor(byId, item.ingredient_id, item.custom_name);
  const section = item.ingredient_id ? byId[item.ingredient_id]?.section : item.section;
  return (
    <li className={`item ${item.is_bought ? 'bought' : ''}`}>
      <button
        className="tick"
        onClick={onToggle}
        aria-pressed={item.is_bought}
        aria-label={item.is_bought ? `Mark ${name} as not bought` : `Mark ${name} as bought`}
      >
        {item.is_bought ? <Icon name="check" size={14} /> : null}
      </button>
      {item.ingredient_id ? (
        <IngredientIcon id={item.ingredient_id} section={section} size={26} title={name} />
      ) : (
        <span className={`section-dot section-dot-${section}`} />
      )}
      <span className="item-name">{name}</span>
      {item.moved_to_pantry && (
        <span className="tag tag-sage">
          <Icon name="pantry" size={11} /> in pantry
        </span>
      )}
      <button className="x" onClick={onRemove} aria-label={`Remove ${name}`}>
        <Icon name="x" size={14} />
      </button>
    </li>
  );
}

function ShoppingAffiliateRow({ items }: { items: ListItem[] }) {
  const { byId } = useIngredients();
  const names = items
    .map((it) => displayFor(byId, it.ingredient_id, it.custom_name))
    .filter(Boolean)
    .slice(0, 8);
  const query = names.join(', ');
  return <AffiliateButtons query={query} unboughtCount={items.length} />;
}

function QuickAdd({ listId, onAdded }: { listId: string; onAdded: () => void }) {
  const toast = useUi((s) => s.toast);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const { data } = useQuery({
    queryKey: ['ingredients', q],
    queryFn: () => api.ingredients(q),
    enabled: q.length >= 1,
    staleTime: 30_000,
  });
  const matches = data?.items ?? [];

  const add = async (ing: Ingredient | null) => {
    if (!ing && !q.trim()) return;
    try {
      await api.addListItems(listId, [
        ing
          ? { ingredient_id: ing.id, section: ing.section }
          : { custom_name: q.trim(), section: 'other' },
      ]);
      setQ('');
      setOpen(false);
      onAdded();
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 401)) toast("Couldn't add that item — please try again.");
    }
  };

  return (
    <div className={`quickadd ${open ? 'open' : ''}`}>
      <div className="quickadd-row">
        <Icon name="plus" size={16} />
        <input
          placeholder="Add an item…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void add(matches[0] ?? null);
          }}
        />
      </div>
      {open && q && (
        <ul className="typeahead">
          {matches.slice(0, 6).map((i) => (
            <li key={i.id} onMouseDown={() => void add(i)}>
              <IngredientIcon id={i.id} section={i.section} size={28} title={i.display} />
              {i.display}
              <span className="muted small">{i.section}</span>
            </li>
          ))}
          <li className="custom" onMouseDown={() => void add(null)}>
            <Icon name="plus" size={12} /> Add as custom: <b>"{q}"</b>
          </li>
        </ul>
      )}
    </div>
  );
}

function PasteParseModal({
  listId,
  onClose,
  seedText,
}: {
  listId: string;
  onClose: () => void;
  seedText?: string | null;
}) {
  const toast = useUi((s) => s.toast);
  const [text, setText] = useState(seedText ?? '');
  const [parsed, setParsed] = useState<(ParsedItem & { skip?: boolean })[] | null>(null);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  const example = `2 chicken thighs
500g beef mince
bananas, milk, bread
- capsicum (red)
- 2x tinned tomatoes
coriander
snags for the bbq`;

  const doParse = async () => {
    setBusy(true);
    try {
      const r = await api.parse(text);
      setParsed(r.items.map((i) => ({ ...i, skip: false })));
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 401)) toast("Couldn't parse that — please try again.");
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!parsed) return;
    const items = parsed
      .filter((p) => !p.skip)
      .map((p) =>
        p.match
          ? { ingredient_id: p.match.id, section: p.match.section }
          : { custom_name: p.clean || p.raw, section: 'other' }
      );
    try {
      await api.addListItems(listId, items);
      onClose();
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 401)) toast("Couldn't add those items — please try again.");
    }
  };

  return (
    <Modal onClose={onClose} eyebrow="Paste or type" title="Add to shopping list">
      {!parsed ? (
        <>
          <p className="muted small">
            Dump a recipe, a scribbled list, a text from your housemate. We'll tokenise and match against
            the pantry dictionary — no AI required.
          </p>
          <textarea
            ref={ref}
            className="paste"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={example}
            rows={10}
            autoFocus
          />
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setText(example)}>
              Try example
            </button>
            <button
              className="btn btn-primary"
              onClick={doParse}
              disabled={!text.trim() || busy}
            >
              Parse <Icon name="arrow" size={14} />
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="muted small">
            <b>{parsed.filter((p) => p.match).length} matched</b>,{' '}
            <span className="amber">{parsed.filter((p) => !p.match).length} unmatched</span> — untick any
            you don't want.
          </p>
          <ul className="parse-preview">
            {parsed.map((p, i) => (
              <li key={i} className={p.skip ? 'skip' : p.match ? 'matched' : 'unmatched'}>
                <button
                  className="tick"
                  aria-pressed={!p.skip}
                  aria-label={p.skip ? `Include ${p.raw}` : `Exclude ${p.raw}`}
                  onClick={() =>
                    setParsed(parsed.map((x, j) => (i === j ? { ...x, skip: !x.skip } : x)))
                  }
                >
                  {!p.skip ? <Icon name="check" size={14} /> : null}
                </button>
                <span className="raw">{p.raw}</span>
                <span className="arrow">→</span>
                {p.match ? (
                  <span className="match">
                    <IngredientIcon id={p.match.id} section={p.match.section} size={22} title={p.match.display} />
                    <span className={`section-dot section-dot-${p.match.section}`} />
                    {p.match.display}
                  </span>
                ) : (
                  <span className="unmatched-label">add as "{p.clean || p.raw}"</span>
                )}
              </li>
            ))}
          </ul>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setParsed(null)}>
              Back
            </button>
            <button className="btn btn-primary" onClick={confirm}>
              Add {parsed.filter((p) => !p.skip).length} item
              {parsed.filter((p) => !p.skip).length === 1 ? '' : 's'}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
