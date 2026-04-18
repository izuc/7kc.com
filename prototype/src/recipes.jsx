// Recipes screen with ranking by pantry match
function RecipesScreen() {
  const { state, dispatch } = useStore();
  const { tweaks } = useTweaks();
  const [filter, setFilter] = React.useState('all'); // all | can-make | quick | expiring | veg
  const [q, setQ] = React.useState('');
  const [cooking, setCooking] = React.useState(null); // recipe idx
  const [viewing, setViewing] = React.useState(null);
  const [suggestFor, setSuggestFor] = React.useState(null); // recipe idx for group suggest

  const pantryIds = new Set(state.pantry.map((p) => p.ingId).filter(Boolean));
  const expiringIds = new Set(state.pantry.filter((p) => {
    const d = window.daysUntil(p.expires);
    return d >= 0 && d <= 3;
  }).map((p) => p.ingId).filter(Boolean));

  const ranked = React.useMemo(() => {
    return window.SEED.recipes.map((r, idx) => {
      const have = r.ingredients.filter((i) => pantryIds.has(i.id));
      const missing = r.ingredients.filter((i) => !pantryIds.has(i.id));
      const pct = r.ingredients.length ? have.length / r.ingredients.length : 0;
      const expiringHits = r.ingredients.filter((i) => expiringIds.has(i.id)).length;
      const score = pct * 100 + expiringHits * 20;
      return { r, idx, have, missing, pct, score, expiringHits };
    }).sort((a, b) => b.score - a.score);
  }, [pantryIds, expiringIds]);

  const filtered = ranked.filter(({ r, pct, expiringHits }) => {
    if (q && !r.title.toLowerCase().includes(q.toLowerCase()) && !r.tags.some((t) => t.includes(q.toLowerCase()))) return false;
    if (filter === 'can-make') return pct === 1;
    if (filter === 'quick') return r.prep + r.cook <= 25;
    if (filter === 'expiring') return expiringHits > 0;
    if (filter === 'veg') return r.tags.includes('vegetarian') || r.tags.includes('vegan');
    return true;
  });

  if (cooking !== null) {
    return <CookFlow recipeIdx={cooking} onClose={() => setCooking(null)} onDone={() => setCooking(null)} />;
  }
  if (viewing !== null) {
    const entry = ranked.find((e) => e.idx === viewing);
    return (
      <RecipeDetail
        entry={entry}
        onClose={() => setViewing(null)}
        onCook={() => { setViewing(null); setCooking(entry.idx); }}
        onAddMissing={() => {
          const items = entry.missing.map((m) => ({ ingId: m.id, section: window.SEED.byId[m.id].section }));
          dispatch({ type: 'ADD_LIST_ITEMS', listId: state.activeListId, items });
        }}
        onSuggest={tweaks.groupMode ? () => { setSuggestFor(entry.idx); } : null}
      />
    );
  }

  const topPick = ranked[0];

  return (
    <div className="screen">
      <div className="screen-head">
        <div className="screen-head-left">
          <div className="eyebrow">Recipes <span className="dot-sep">·</span> <span className="mono">{window.SEED.recipes.length}</span></div>
          <h1 className="screen-title">What can I make?</h1>
        </div>
        <div className="screen-head-right">
          <div className="search-input">
            <Icon name="search" size={14} />
            <input placeholder="Search recipes or tags…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
      </div>

      {topPick && topPick.pct >= 0.7 && (
        <div className="hero-pick" onClick={() => setViewing(topPick.idx)}>
          <Swatch palette={topPick.r.palette} label={topPick.r.title} size="lg" rounded />
          <div className="hero-pick-body">
            <div className="eyebrow sage">Top pick for your pantry</div>
            <h2>{topPick.r.title}</h2>
            <p className="muted">{topPick.r.description}</p>
            <div className="hero-pick-meta">
              <span className="mono">{Math.round(topPick.pct * 100)}% pantry match</span>
              <span className="mono muted">·</span>
              <span className="mono">{topPick.r.prep + topPick.r.cook} min</span>
              <span className="mono muted">·</span>
              <span className="mono">{topPick.r.serves} serves</span>
              {topPick.expiringHits > 0 && (
                <span className="tag tag-amber"><Icon name="clock" size={11}/> uses {topPick.expiringHits} expiring</span>
              )}
            </div>
            <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); setCooking(topPick.idx); }}>
              <Icon name="chef" size={14}/> Cook this
            </button>
          </div>
        </div>
      )}

      <div className="filter-row">
        {[['all','All'],['can-make','I have everything'],['expiring','Use what\'s expiring'],['quick','Under 25 min'],['veg','Vegetarian']].map(([id, label]) => (
          <button key={id} className={"filter-chip " + (filter === id ? 'active' : '')} onClick={() => setFilter(id)}>
            {label}
            {id !== 'all' && (
              <span className="mono small">
                {id === 'can-make' ? ranked.filter((r) => r.pct === 1).length :
                 id === 'quick' ? ranked.filter((r) => r.r.prep + r.r.cook <= 25).length :
                 id === 'expiring' ? ranked.filter((r) => r.expiringHits > 0).length :
                 id === 'veg' ? ranked.filter((r) => r.r.tags.includes('vegetarian') || r.r.tags.includes('vegan')).length : ''}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="recipe-grid">
        {filtered.slice(0, 48).map((entry) => (
          <RecipeCard key={entry.idx} entry={entry} onClick={() => setViewing(entry.idx)} />
        ))}
      </div>

      {suggestFor !== null && (
        <SuggestModal
          recipe={window.SEED.recipes[suggestFor]}
          onClose={() => setSuggestFor(null)}
          onSubmit={(date) => {
            dispatch({ type: 'ADD_SUGGESTION', recipe: window.SEED.recipes[suggestFor].title, date });
            setSuggestFor(null);
          }}
        />
      )}
    </div>
  );
}

function RecipeCard({ entry, onClick }) {
  const { r, pct, have, missing, expiringHits } = entry;
  return (
    <button className="recipe-card" onClick={onClick}>
      <Swatch palette={r.palette} label={r.title} size="full" />
      <div className="recipe-card-body">
        <div className="recipe-card-meta">
          <span className="mono small">{r.prep + r.cook} min</span>
          <span className="mono small muted">·</span>
          <span className="mono small">{r.serves} serves</span>
        </div>
        <h3>{r.title}</h3>
        <div className="pantry-bar" title={`${have.length}/${r.ingredients.length} in pantry`}>
          <div className="pantry-bar-fill" style={{ width: (pct * 100) + '%' }} />
        </div>
        <div className="recipe-card-foot">
          <span className="mono small">
            {pct === 1 ? 'ready to cook' : `need ${missing.length}`}
          </span>
          {expiringHits > 0 && <span className="tag tag-amber small"><Icon name="clock" size={10}/> expiring</span>}
        </div>
      </div>
    </button>
  );
}

function RecipeDetail({ entry, onClose, onCook, onAddMissing, onSuggest }) {
  const { r, pct, have, missing } = entry;
  return (
    <div className="screen recipe-detail">
      <button className="back-btn" onClick={onClose}>
        <Icon name="arrow" size={14}/> Back to recipes
      </button>
      <div className="recipe-detail-hero">
        <Swatch palette={r.palette} label={r.title} size="full" />
        <div className="recipe-detail-title">
          <div className="eyebrow">{r.tags.slice(0, 3).join(' · ')}</div>
          <h1>{r.title}</h1>
          <p className="lede">{r.description}</p>
          <div className="recipe-detail-stats">
            <div><div className="mono small muted">prep</div><div className="stat-num-sm">{r.prep}<span className="mono small">min</span></div></div>
            <div><div className="mono small muted">cook</div><div className="stat-num-sm">{r.cook}<span className="mono small">min</span></div></div>
            <div><div className="mono small muted">serves</div><div className="stat-num-sm">{r.serves}</div></div>
            <div><div className="mono small muted">match</div><div className="stat-num-sm">{Math.round(pct * 100)}<span className="mono small">%</span></div></div>
          </div>
          <div className="recipe-detail-actions">
            <button className="btn btn-primary" onClick={onCook}><Icon name="chef" size={14}/> I'm cooking this</button>
            {missing.length > 0 && <button className="btn btn-ghost" onClick={onAddMissing}><Icon name="cart" size={14}/> Add {missing.length} missing to list</button>}
            {onSuggest && <button className="btn btn-sage" onClick={onSuggest}><Icon name="group" size={14}/> Suggest to group</button>}
          </div>
        </div>
      </div>

      <div className="recipe-detail-body">
        <div>
          <h3>Ingredients</h3>
          <ul className="recipe-ings">
            {r.ingredients.map((i, idx) => {
              const have = entry.have.some((h) => h.id === i.id);
              const ing = window.SEED.byId[i.id];
              return (
                <li key={idx} className={have ? 'have' : 'miss'}>
                  <span className="dot">{have ? <Icon name="check" size={11}/> : ''}</span>
                  <span className="ing-name">{ing.display}</span>
                  <span className="ing-amt mono small muted">{i.amt}</span>
                </li>
              );
            })}
          </ul>
        </div>
        <div>
          <h3>Method</h3>
          <ol className="recipe-steps">
            {r.steps.map((s, i) => <li key={i}><span className="step-num mono">{i + 1}</span><span>{s}</span></li>)}
          </ol>
        </div>
      </div>
    </div>
  );
}

function CookFlow({ recipeIdx, onClose, onDone }) {
  const { state, dispatch } = useStore();
  const r = window.SEED.recipes[recipeIdx];
  const [step, setStep] = React.useState(0);
  const [done, setDone] = React.useState(false);

  const pantryByIng = {};
  for (const p of state.pantry) if (p.ingId) pantryByIng[p.ingId] = p;
  const [toRemove, setToRemove] = React.useState(
    () => new Set(r.ingredients.map((i) => i.id).filter((id) => pantryByIng[id]))
  );

  const toggleRemove = (id) => {
    const next = new Set(toRemove);
    if (next.has(id)) next.delete(id); else next.add(id);
    setToRemove(next);
  };

  const finish = () => {
    dispatch({ type: 'COOK_RECIPE', recipeIdx, removeIngIds: [...toRemove] });
    setDone(true);
    setTimeout(onDone, 1400);
  };

  if (done) {
    return (
      <div className="screen cook-done">
        <div className="cook-done-card">
          <div className="cook-done-check"><Icon name="check" size={44}/></div>
          <h1>Nice cooking.</h1>
          <p className="muted">{toRemove.size} ingredient{toRemove.size === 1 ? '' : 's'} removed from pantry.</p>
          <div className="mono small muted">{r.title} · {new Date().toLocaleDateString('en-AU', { weekday: 'long' })}</div>
        </div>
      </div>
    );
  }

  const isLastStep = step >= r.steps.length;

  return (
    <div className="screen cook-flow">
      <button className="back-btn" onClick={onClose}>
        <Icon name="x" size={14}/> Stop cooking
      </button>
      <div className="cook-head">
        <div className="eyebrow">Cooking · step {Math.min(step + 1, r.steps.length)} of {r.steps.length}</div>
        <h1>{r.title}</h1>
        <div className="cook-progress">
          {r.steps.map((_, i) => (
            <div key={i} className={"cook-progress-bar " + (i < step ? 'done' : i === step ? 'active' : '')} />
          ))}
        </div>
      </div>

      {!isLastStep ? (
        <div className="cook-step">
          <div className="cook-step-num mono">{step + 1}</div>
          <p>{r.steps[step]}</p>
          <div className="cook-actions">
            {step > 0 && <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>Back</button>}
            <button className="btn btn-primary" onClick={() => setStep(step + 1)}>
              {step === r.steps.length - 1 ? 'Finish' : 'Next step'} <Icon name="arrow" size={14}/>
            </button>
          </div>
          <div className="cook-all-steps">
            {r.steps.map((s, i) => (
              <div key={i} className={"cook-step-row " + (i === step ? 'active' : i < step ? 'done' : '')}>
                <span className="mono">{i + 1}</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="cook-remove">
          <h2>Remove used ingredients from pantry?</h2>
          <p className="muted">Tick anything you used up. Keep unticked items that you still have plenty of.</p>
          <ul className="remove-list">
            {r.ingredients.map((i) => {
              const inPantry = !!pantryByIng[i.id];
              const ing = window.SEED.byId[i.id];
              return (
                <li key={i.id} className={!inPantry ? 'muted' : toRemove.has(i.id) ? 'active' : ''}>
                  <button className="tick" disabled={!inPantry} onClick={() => toggleRemove(i.id)}>
                    {toRemove.has(i.id) ? <Icon name="check" size={14}/> : null}
                  </button>
                  <span>{ing.display}</span>
                  <span className="mono small muted">{i.amt}</span>
                  {!inPantry && <span className="tag">not in pantry</span>}
                </li>
              );
            })}
          </ul>
          <div className="cook-actions">
            <button className="btn btn-ghost" onClick={() => setStep(r.steps.length - 1)}>Back</button>
            <button className="btn btn-primary" onClick={finish}>
              <Icon name="check" size={14}/> Done cooking
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SuggestModal({ recipe, onClose, onSubmit }) {
  const [date, setDate] = React.useState('Tonight');
  const opts = ['Tonight', 'Tomorrow', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="eyebrow">Suggest to the group</div>
            <h2>{recipe.title}</h2>
          </div>
          <button className="x" onClick={onClose}><Icon name="x" size={18}/></button>
        </div>
        <label className="field-label">When?</label>
        <div className="chip-row">
          {opts.map((o) => (
            <button key={o} className={"chip " + (o === date ? 'active' : '')} onClick={() => setDate(o)}>{o}</button>
          ))}
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSubmit(date)}><Icon name="sparkle" size={14}/> Suggest it</button>
        </div>
      </div>
    </div>
  );
}

window.RecipesScreen = RecipesScreen;
