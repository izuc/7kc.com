// Main app shell
function App() {
  const { state, dispatch } = useStore();
  const { tweaks, update } = useTweaks();

  // Auto-switch to lists if group tab is disabled mid-session
  React.useEffect(() => {
    if (state.tab === 'group' && !tweaks.groupMode) dispatch({ type: 'SET_TAB', tab: 'lists' });
  }, [tweaks.groupMode, state.tab]);

  const screen = {
    lists: <ListsScreen />,
    pantry: <PantryScreen />,
    recipes: <RecipesScreen />,
    group: <GroupScreen />,
  }[state.tab];

  const totalPantry = state.pantry.length;
  const expiringCount = state.pantry.filter((p) => { const d = window.daysUntil(p.expires); return d >= 0 && d <= 3; }).length;
  const activeItemsCount = state.lists.filter((l) => !l.archived).reduce((s, l) => s + l.items.filter((i) => !i.bought).length, 0);

  return (
    <div className={"app accent-" + tweaks.accent + " density-" + tweaks.density}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <svg viewBox="0 0 28 28" width="28" height="28" aria-hidden>
              <rect x="1" y="1" width="26" height="26" rx="7" fill="var(--accent)"/>
              <text x="14" y="19" textAnchor="middle" fontFamily="var(--serif)" fontWeight="400" fontSize="14" fill="var(--cream)">7</text>
            </svg>
          </div>
          <div>
            <div className="brand-name">7 Day Kitchen</div>
            <div className="brand-tag mono small">7kc.com</div>
          </div>
        </div>

        <nav className="nav">
          <button className={"nav-btn " + (state.tab === 'lists' ? 'active' : '')} onClick={() => dispatch({ type: 'SET_TAB', tab: 'lists' })}>
            <Icon name="list"/> <span>Shopping</span>
            {activeItemsCount > 0 && <span className="badge">{activeItemsCount}</span>}
          </button>
          <button className={"nav-btn " + (state.tab === 'pantry' ? 'active' : '')} onClick={() => dispatch({ type: 'SET_TAB', tab: 'pantry' })}>
            <Icon name="pantry"/> <span>Pantry</span>
            <span className="badge ghost mono">{totalPantry}</span>
          </button>
          <button className={"nav-btn " + (state.tab === 'recipes' ? 'active' : '')} onClick={() => dispatch({ type: 'SET_TAB', tab: 'recipes' })}>
            <Icon name="chef"/> <span>Recipes</span>
            {expiringCount > 0 && <span className="badge amber">{expiringCount}</span>}
          </button>
          {tweaks.groupMode && (
            <button className={"nav-btn " + (state.tab === 'group' ? 'active' : '')} onClick={() => dispatch({ type: 'SET_TAB', tab: 'group' })}>
              <Icon name="group"/> <span>Group</span>
            </button>
          )}
        </nav>

        <div className="sidebar-foot">
          {!tweaks.groupMode ? (
            <div className="invite-card">
              <div className="eyebrow sage">Solo mode</div>
              <p>Cook with housemates or a partner? Share your pantry.</p>
              <button className="btn btn-sage full" onClick={() => update({ groupMode: true })}>
                <Icon name="group" size={14}/> Invite to your kitchen
              </button>
            </div>
          ) : (
            <div className="invite-card">
              <div className="eyebrow sage">Group mode</div>
              <div className="member-row">
                {window.SEED.group.members.map((m) => <Avatar key={m.id} user={m} size={22}/>)}
              </div>
              <button className="btn btn-ghost full" onClick={() => update({ groupMode: false })}>
                Leave group
              </button>
            </div>
          )}

          <div className="principle mono small muted">
            <div>Use what you've got.</div>
            <div>Eat what you love.</div>
            <div>Waste nothing.</div>
          </div>
        </div>
      </aside>

      <main className="main">
        {screen}
      </main>

      {tweaks.showTweaks && <TweaksPanel />}

      {/* Mobile bottom bar */}
      <nav className="mobile-nav">
        <button className={state.tab === 'lists' ? 'active' : ''} onClick={() => dispatch({ type: 'SET_TAB', tab: 'lists' })}>
          <Icon name="list"/><span>Shopping</span>
        </button>
        <button className={state.tab === 'pantry' ? 'active' : ''} onClick={() => dispatch({ type: 'SET_TAB', tab: 'pantry' })}>
          <Icon name="pantry"/><span>Pantry</span>
        </button>
        <button className={state.tab === 'recipes' ? 'active' : ''} onClick={() => dispatch({ type: 'SET_TAB', tab: 'recipes' })}>
          <Icon name="chef"/><span>Recipes</span>
        </button>
        {tweaks.groupMode && (
          <button className={state.tab === 'group' ? 'active' : ''} onClick={() => dispatch({ type: 'SET_TAB', tab: 'group' })}>
            <Icon name="group"/><span>Group</span>
          </button>
        )}
      </nav>
    </div>
  );
}

function TweaksPanel() {
  const { tweaks, update } = useTweaks();
  const { dispatch } = useStore();
  return (
    <div className="tweaks-panel">
      <div className="tweaks-head">
        <h3>Tweaks</h3>
        <span className="mono small muted">live</span>
      </div>
      <div className="tweak-row">
        <label>Mode</label>
        <div className="segmented">
          <button className={!tweaks.groupMode ? 'active' : ''} onClick={() => update({ groupMode: false })}>Solo</button>
          <button className={tweaks.groupMode ? 'active' : ''} onClick={() => update({ groupMode: true })}>Group</button>
        </div>
      </div>
      <p className="muted small">Solo hides the Group tab, likes, comments and the social feed entirely — the spec is strict about this.</p>

      <div className="tweak-row">
        <label>Accent</label>
        <div className="swatches">
          {['terracotta','sage','ink','plum'].map((a) => (
            <button key={a} className={"swatch-btn swatch-" + a + (tweaks.accent === a ? ' active' : '')} onClick={() => update({ accent: a })} aria-label={a}/>
          ))}
        </div>
      </div>

      <div className="tweak-row">
        <label>Density</label>
        <div className="segmented">
          <button className={tweaks.density === 'compact' ? 'active' : ''} onClick={() => update({ density: 'compact' })}>Compact</button>
          <button className={tweaks.density === 'roomy' ? 'active' : ''} onClick={() => update({ density: 'roomy' })}>Roomy</button>
        </div>
      </div>

      <hr/>
      <button className="btn btn-ghost full" onClick={() => { if (confirm('Reset all demo data?')) dispatch({ type: 'RESET' }); }}>
        <Icon name="refresh" size={14}/> Reset demo data
      </button>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <TweaksProvider>
    <StoreProvider>
      <App />
    </StoreProvider>
  </TweaksProvider>
);
