// Pantry screen with expiry countdown
function PantryScreen() {
  const { state, dispatch } = useStore();
  const [view, setView] = React.useState('section'); // section | expiry | alpha
  const [showAdd, setShowAdd] = React.useState(false);
  const [q, setQ] = React.useState('');

  const items = state.pantry.map((p) => {
    const ing = p.ingId ? window.SEED.byId[p.ingId] : null;
    return {
      ...p,
      name: ing ? ing.display : p.custom,
      section: ing ? ing.section : 'other',
      days: window.daysUntil(p.expires),
    };
  });

  const expiringSoon = items.filter((i) => i.days <= 3 && i.days >= 0);
  const expired = items.filter((i) => i.days < 0);
  const low = items.filter((i) => i.low);

  let sorted = items;
  if (view === 'expiry') sorted = [...items].sort((a, b) => a.days - b.days);
  if (view === 'alpha') sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="screen">
      <div className="screen-head">
        <div className="screen-head-left">
          <div className="eyebrow">
            Pantry
            <span className="dot-sep">·</span>
            <span className="mono">{items.length} items</span>
          </div>
          <h1 className="screen-title">What you've got</h1>
        </div>
        <div className="screen-head-right">
          <div className="segmented">
            <button className={view === 'section' ? 'active' : ''} onClick={() => setView('section')}>By section</button>
            <button className={view === 'expiry' ? 'active' : ''} onClick={() => setView('expiry')}>By expiry</button>
            <button className={view === 'alpha' ? 'active' : ''} onClick={() => setView('alpha')}>A–Z</button>
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
        <div className={"stat " + (expiringSoon.length ? 'warn' : '')}>
          <div className="stat-num">{expiringSoon.length}</div>
          <div className="stat-label">expiring soon</div>
        </div>
        <div className={"stat " + (expired.length ? 'danger' : '')}>
          <div className="stat-num">{expired.length}</div>
          <div className="stat-label">expired</div>
        </div>
        <div className="stat">
          <div className="stat-num">{low.length}</div>
          <div className="stat-label">running low</div>
        </div>
      </div>

      {view === 'section' ? (
        <div className="sections">
          {window.SECTIONS.map((s) => {
            const group = items.filter((i) => i.section === s.id);
            if (group.length === 0) return null;
            return (
              <div key={s.id} className="section">
                <div className="section-head">
                  <span>{s.label}</span>
                  <span className="mono muted">{group.length}</span>
                </div>
                <div className="pantry-grid">
                  {group.map((i) => <PantryCard key={i.id} item={i} />)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="pantry-grid">
          {sorted.map((i) => <PantryCard key={i.id} item={i} />)}
        </div>
      )}

      {showAdd && (
        <div className="modal-backdrop" onClick={() => setShowAdd(false)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Add to pantry</h2>
              <button className="x" onClick={() => setShowAdd(false)}><Icon name="x" size={18} /></button>
            </div>
            <input autoFocus className="text-input" placeholder="Search ingredients…" value={q} onChange={(e) => setQ(e.target.value)} />
            <ul className="typeahead inline">
              {window.SEED.ingredients.filter((i) => !q || i.display.toLowerCase().includes(q.toLowerCase())).slice(0, 12).map((i) => (
                <li key={i.id} onClick={() => { dispatch({ type: 'ADD_PANTRY_ITEM', ingId: i.id }); setShowAdd(false); setQ(''); }}>
                  <span className={"section-dot section-dot-" + i.section} />
                  {i.display}
                  <span className="mono muted small">{i.shelf}d shelf</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function PantryCard({ item }) {
  const { dispatch } = useStore();
  const warn = item.days >= 0 && item.days <= 3;
  const danger = item.days < 0;
  return (
    <div className={"pantry-card " + (danger ? 'danger ' : warn ? 'warn ' : '') + (item.low ? 'low' : '')}>
      <div className="pantry-card-head">
        <div className={"section-dot section-dot-" + item.section} />
        <span className="pantry-name">{item.name}</span>
        <button className="x" onClick={() => dispatch({ type: 'REMOVE_PANTRY_ITEM', id: item.id })}>
          <Icon name="x" size={12} />
        </button>
      </div>
      <div className="pantry-meta">
        <span className="mono small">{window.fmtExpiry(item.expires)}</span>
        {item.low && <span className="tag tag-amber"><Icon name="low" size={10}/> low</span>}
      </div>
      <div className="pantry-actions">
        <button className="chip" onClick={() => dispatch({ type: 'TOGGLE_LOW', id: item.id })}>
          {item.low ? 'Not low' : 'Running low'}
        </button>
        {danger && <button className="chip chip-danger">Toss it</button>}
      </div>
    </div>
  );
}

window.PantryScreen = PantryScreen;
