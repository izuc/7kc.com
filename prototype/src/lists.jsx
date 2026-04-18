// Shopping Lists screen
const { useState: lsS, useMemo: lsM, useRef: lsR } = React;

function SectionGroup({ items, renderItem, emptyHint }) {
  const grouped = lsM(() => {
    const g = {};
    for (const s of window.SECTIONS) g[s.id] = [];
    for (const it of items) (g[it.section] || g.other).push(it);
    return g;
  }, [items]);

  return (
    <div className="sections">
      {window.SECTIONS.map((s) => grouped[s.id].length ? (
        <div key={s.id} className="section">
          <div className="section-head">
            <span>{s.label}</span>
            <span className="mono muted">{grouped[s.id].length}</span>
          </div>
          <ul className="items">
            {grouped[s.id].map(renderItem)}
          </ul>
        </div>
      ) : null)}
      {items.length === 0 && emptyHint}
    </div>
  );
}

function ListItemRow({ item, onToggle, onRemove, showWho }) {
  const ing = item.ingId ? window.SEED.byId[item.ingId] : null;
  const name = ing ? ing.display : item.custom;
  return (
    <li className={"item " + (item.bought ? 'bought' : '')}>
      <button className="tick" onClick={onToggle} aria-label="toggle">
        {item.bought ? <Icon name="check" size={14} /> : null}
      </button>
      <span className="item-name">{name}</span>
      {item.moved && <span className="tag tag-sage"><Icon name="pantry" size={11}/> in pantry</span>}
      {showWho && item.boughtBy && item.boughtBy !== 'u-you' && (
        <Avatar user={userById(item.boughtBy)} size={18} />
      )}
      <button className="x" onClick={onRemove} aria-label="remove"><Icon name="x" size={14} /></button>
    </li>
  );
}

function PasteParseModal({ listId, onClose }) {
  const { dispatch } = useStore();
  const [text, setText] = lsS('');
  const [parsed, setParsed] = lsS(null);
  const textareaRef = lsR(null);

  const handleParse = () => {
    const results = window.Parser.parse(text);
    setParsed(results);
  };

  const handleConfirm = () => {
    const items = parsed
      .filter((p) => !p.skip)
      .map((p) => p.match ? {
        ingId: p.match.id, section: p.match.section,
      } : {
        custom: p.clean || p.raw, section: 'other',
      });
    dispatch({ type: 'ADD_LIST_ITEMS', listId, items });
    onClose();
  };

  const example = `2 chicken thighs
500g beef mince
bananas, milk, bread
- capsicum (red)
- 2x tinned tomatoes
coriander
snags for the bbq
weetbix
Tim Tams`;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="eyebrow">Paste or type</div>
            <h2>Add to shopping list</h2>
          </div>
          <button className="x" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>

        {!parsed ? (
          <>
            <p className="muted small">Dump a recipe, a scribbled list, a text from your housemate. We'll tokenise and match against the pantry dictionary — no AI required.</p>
            <textarea
              ref={textareaRef}
              className="paste"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={example}
              rows={10}
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setText(example)}>Try example</button>
              <button className="btn btn-primary" onClick={handleParse} disabled={!text.trim()}>
                Parse <Icon name="arrow" size={14} />
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="muted small">
              <b>{parsed.filter((p) => p.match).length} matched</b>,{' '}
              <span className="amber">{parsed.filter((p) => !p.match).length} unmatched</span>{' '}
              — untick any you don't want to add.
            </p>
            <ul className="parse-preview">
              {parsed.map((p, i) => (
                <li key={i} className={p.skip ? 'skip' : p.match ? 'matched' : 'unmatched'}>
                  <button className="tick" onClick={() => setParsed(parsed.map((x, j) => i === j ? { ...x, skip: !x.skip } : x))}>
                    {!p.skip ? <Icon name="check" size={14} /> : null}
                  </button>
                  <span className="raw">{p.raw}</span>
                  <span className="arrow">→</span>
                  {p.match ? (
                    <span className="match">
                      <span className={"section-dot section-dot-" + p.match.section} />
                      {p.match.display}
                    </span>
                  ) : (
                    <span className="unmatched-label">add as "{p.clean || p.raw}"</span>
                  )}
                </li>
              ))}
            </ul>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setParsed(null)}>Back</button>
              <button className="btn btn-primary" onClick={handleConfirm}>
                Add {parsed.filter((p) => !p.skip).length} item{parsed.filter((p) => !p.skip).length === 1 ? '' : 's'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function QuickAdd({ listId }) {
  const { dispatch } = useStore();
  const [q, setQ] = lsS('');
  const [open, setOpen] = lsS(false);

  const matches = lsM(() => {
    if (!q) return [];
    const n = q.toLowerCase();
    return window.SEED.ingredients
      .filter((i) => i.display.toLowerCase().includes(n) || (window.SEED.aliases[n] === i.id))
      .slice(0, 6);
  }, [q]);

  const add = (ing) => {
    dispatch({ type: 'ADD_LIST_ITEMS', listId, items: [ing ? { ingId: ing.id, section: ing.section } : { custom: q, section: 'other' }] });
    setQ('');
    setOpen(false);
  };

  return (
    <div className={"quickadd " + (open ? 'open' : '')}>
      <div className="quickadd-row">
        <Icon name="plus" size={16} />
        <input
          placeholder="Add an item…"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => { if (e.key === 'Enter') add(matches[0]); }}
        />
      </div>
      {open && q && (
        <ul className="typeahead">
          {matches.map((i) => (
            <li key={i.id} onClick={() => add(i)}>
              <span className={"section-dot section-dot-" + i.section} />
              {i.display}
              <span className="muted small">{i.section}</span>
            </li>
          ))}
          <li className="custom" onClick={() => add(null)}>
            <Icon name="plus" size={12} />
            Add as custom: <b>"{q}"</b>
          </li>
        </ul>
      )}
    </div>
  );
}

function ListsScreen() {
  const { state, dispatch } = useStore();
  const { tweaks } = useTweaks();
  const [showPaste, setShowPaste] = lsS(false);
  const [showNew, setShowNew] = lsS(false);
  const [newName, setNewName] = lsS('');

  const activeLists = state.lists.filter((l) => !l.archived);
  const list = state.lists.find((l) => l.id === state.activeListId) || activeLists[0];

  if (!list) return <div className="screen"><div className="empty">No lists yet. <button className="btn btn-primary" onClick={() => dispatch({ type: 'ADD_LIST', name: 'New list' })}>Create one</button></div></div>;

  const unbought = list.items.filter((i) => !i.bought);
  const bought = list.items.filter((i) => i.bought);
  const boughtToMove = bought.filter((i) => !i.moved);
  const progress = list.items.length ? bought.length / list.items.length : 0;

  return (
    <div className="screen">
      <div className="screen-head">
        <div className="screen-head-left">
          <div className="eyebrow">
            Shopping list
            <span className="dot-sep">·</span>
            <span className="mono">{list.items.length} items</span>
          </div>
          <div className="lists-tabs">
            {activeLists.map((l) => (
              <button
                key={l.id}
                className={"list-tab " + (l.id === list.id ? 'active' : '')}
                onClick={() => dispatch({ type: 'SET_ACTIVE_LIST', id: l.id })}
              >
                {l.name}
                <span className="mono muted small">
                  {l.items.filter((i) => i.bought).length}/{l.items.length}
                </span>
              </button>
            ))}
            <button className="list-tab add" onClick={() => setShowNew(true)}>
              <Icon name="plus" size={14} /> New
            </button>
          </div>
        </div>
        <div className="screen-head-right">
          <button className="btn btn-ghost" onClick={() => dispatch({ type: 'MARK_ALL_BOUGHT', listId: list.id })} disabled={list.items.length === 0}>
            <Icon name="check" size={14} /> Mark all bought
          </button>
          <button className="btn btn-primary" onClick={() => setShowPaste(true)}>
            <Icon name="sparkle" size={14} /> Paste list
          </button>
        </div>
      </div>

      <div className="progress-row">
        <div className="progress">
          <div className="progress-fill" style={{ width: (progress * 100) + '%' }} />
        </div>
        <span className="mono small muted">{bought.length}/{list.items.length} · {Math.round(progress * 100)}%</span>
      </div>

      <QuickAdd listId={list.id} />

      <SectionGroup
        items={unbought}
        renderItem={(it) => (
          <ListItemRow
            key={it.id}
            item={it}
            showWho={tweaks.groupMode}
            onToggle={() => dispatch({ type: 'TOGGLE_BOUGHT', listId: list.id, itemId: it.id })}
            onRemove={() => dispatch({ type: 'REMOVE_LIST_ITEM', listId: list.id, itemId: it.id })}
          />
        )}
        emptyHint={
          <div className="empty">
            <Icon name="cart" size={26} />
            <p>Nothing on the list yet.</p>
            <button className="btn btn-primary" onClick={() => setShowPaste(true)}>Paste something in</button>
          </div>
        }
      />

      {bought.length > 0 && (
        <div className="bought-block">
          <div className="bought-head">
            <h3>In the trolley</h3>
            <span className="mono muted">{bought.length}</span>
            {boughtToMove.length > 0 && (
              <button className="btn btn-sage" onClick={() => dispatch({ type: 'MOVE_BOUGHT_TO_PANTRY', listId: list.id })}>
                <Icon name="pantry" size={14} /> Move {boughtToMove.length} to pantry
              </button>
            )}
          </div>
          <ul className="items bought-items">
            {bought.map((it) => (
              <ListItemRow
                key={it.id}
                item={it}
                showWho={tweaks.groupMode}
                onToggle={() => dispatch({ type: 'TOGGLE_BOUGHT', listId: list.id, itemId: it.id })}
                onRemove={() => dispatch({ type: 'REMOVE_LIST_ITEM', listId: list.id, itemId: it.id })}
              />
            ))}
          </ul>
        </div>
      )}

      {showPaste && <PasteParseModal listId={list.id} onClose={() => setShowPaste(false)} />}

      {showNew && (
        <div className="modal-backdrop" onClick={() => setShowNew(false)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>New list</h2>
              <button className="x" onClick={() => setShowNew(false)}><Icon name="x" size={18} /></button>
            </div>
            <input
              className="text-input"
              placeholder="e.g. Weekend BBQ"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter' && newName.trim()) { dispatch({ type: 'ADD_LIST', name: newName }); setShowNew(false); setNewName(''); } }}
            />
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowNew(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={!newName.trim()} onClick={() => { dispatch({ type: 'ADD_LIST', name: newName }); setShowNew(false); setNewName(''); }}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.ListsScreen = ListsScreen;
