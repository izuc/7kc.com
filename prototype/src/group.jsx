// Group / social layer
function GroupScreen() {
  const { state, dispatch } = useStore();
  const [comment, setComment] = React.useState({});

  const group = window.SEED.group;
  const members = group.members;
  const suggestions = state.suggestions;
  const cookedFromSuggestion = state.cookedRecipes.map((c) => window.SEED.recipes[c.recipeIdx]?.title);

  // combined feed: suggestions + activity
  const feed = [
    ...state.feed,
    ...state.cookedRecipes.map((c) => ({ kind: 'cooked', who: c.who, recipe: window.SEED.recipes[c.recipeIdx]?.title, t: c.at })),
  ].sort((a, b) => b.t - a.t);

  return (
    <div className="screen">
      <div className="screen-head">
        <div className="screen-head-left">
          <div className="eyebrow">Group <span className="dot-sep">·</span> <span className="mono">{members.length} members</span></div>
          <h1 className="screen-title">{group.name}</h1>
          <div className="member-row">
            {members.map((m) => (
              <div key={m.id} className="member-chip">
                <Avatar user={m} size={22} /> {m.name}
              </div>
            ))}
            <button className="member-chip add-member">
              <Icon name="plus" size={12}/> Invite
            </button>
          </div>
        </div>
      </div>

      <div className="group-grid">
        <div className="group-col">
          <h3 className="col-head">Meal suggestions</h3>
          {suggestions.length === 0 ? (
            <div className="empty small">No suggestions yet. Head to Recipes to suggest one.</div>
          ) : (
            <div className="suggestion-list">
              {suggestions.map((s) => {
                const recipe = window.SEED.recipes.find((r) => r.title === s.recipe);
                const likes = state.likes[s.id] || [];
                const cmts = state.comments[s.id] || [];
                const by = userById(s.by);
                const youLiked = likes.includes('u-you');
                return (
                  <div key={s.id} className="suggestion-card">
                    {recipe && <Swatch palette={recipe.palette} label={recipe.recipe || recipe.title} size="sm" rounded />}
                    <div className="suggestion-body">
                      <div className="suggestion-head">
                        <Avatar user={by} size={18}/>
                        <span><b>{by.name}</b> suggested</span>
                        <span className="tag tag-sage">{s.date}</span>
                      </div>
                      <div className="suggestion-title">{s.recipe}</div>
                      <div className="suggestion-actions">
                        <button className={"chip " + (youLiked ? 'liked' : '')} onClick={() => dispatch({ type: 'TOGGLE_LIKE', id: s.id })}>
                          <Icon name="heart" size={12}/> {likes.length}
                        </button>
                        <span className="chip-ghost"><Icon name="msg" size={12}/> {cmts.length}</span>
                        {cookedFromSuggestion.includes(s.recipe) && <span className="tag tag-sage"><Icon name="check" size={10}/> cooked</span>}
                      </div>
                      {cmts.length > 0 && (
                        <ul className="comments">
                          {cmts.map((c, i) => (
                            <li key={i}>
                              <Avatar user={userById(c.who)} size={16}/>
                              <span><b>{userById(c.who).name}</b> {c.text}</span>
                              <span className="mono small muted">{window.fmtRelative(c.t)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="comment-entry">
                        <input
                          placeholder="Add a comment…"
                          value={comment[s.id] || ''}
                          onChange={(e) => setComment({ ...comment, [s.id]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (comment[s.id] || '').trim()) {
                              dispatch({ type: 'ADD_COMMENT', id: s.id, text: comment[s.id] });
                              setComment({ ...comment, [s.id]: '' });
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="group-col">
          <h3 className="col-head">Activity</h3>
          <ul className="feed">
            {feed.slice(0, 20).map((f, i) => {
              const who = userById(f.who);
              return (
                <li key={i} className="feed-item">
                  <Avatar user={who} size={22} />
                  <div>
                    <div>
                      <b>{who.name}</b>{' '}
                      {f.kind === 'cooked' && <>cooked <i>{f.recipe}</i></>}
                      {f.kind === 'suggest' && <>suggested <i>{f.recipe}</i> for <b>{f.date}</b></>}
                      {f.kind === 'comment' && <>commented: "{f.text}"</>}
                      {f.kind === 'like' && <>liked a suggestion</>}
                      {f.kind === 'list_add' && <>added {f.count} items to <i>{f.list}</i></>}
                    </div>
                    <div className="mono small muted">{window.fmtRelative(f.t)}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

window.GroupScreen = GroupScreen;
