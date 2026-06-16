import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';
import { MealPlate } from '../components/MealPlate';
import { MethodBlock } from '../components/MethodBlock';
import { AffiliateButtons } from '../components/AffiliateButtons';
import { trackEvent } from '../lib/analytics';
import { useAuth } from '../store/auth';
import { useUi } from '../store/ui';

export function RecipeDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useUi((s) => s.toast);
  const { user } = useAuth();
  const [showSuggest, setShowSuggest] = useState(false);

  const { data: recipeData, isLoading } = useQuery({
    queryKey: ['recipe', slug],
    queryFn: () => api.recipe(slug!),
    enabled: !!slug,
  });

  const { data: pantryData } = useQuery({ queryKey: ['pantry'], queryFn: () => api.pantry() });
  const { data: listsData } = useQuery({ queryKey: ['lists'], queryFn: () => api.lists() });
  const { data: favData } = useQuery({ queryKey: ['favourites'], queryFn: () => api.favouriteRecipes() });

  const activeList = listsData?.lists.find((l) => !l.archived_at);

  const { have, missing } = useMemo(() => {
    const recipe = recipeData?.recipe;
    if (!recipe) return { have: [] as string[], missing: [] as string[] };
    const pantryIds = new Set((pantryData?.items ?? []).map((p) => p.ingredient_id).filter(Boolean) as string[]);
    const have: string[] = [];
    const missing: string[] = [];
    for (const i of recipe.ingredients) {
      if (i.ingredient_id && pantryIds.has(i.ingredient_id)) have.push(i.ingredient_id);
      else if (i.ingredient_id) missing.push(i.ingredient_id);
    }
    return { have, missing };
  }, [recipeData, pantryData]);

  if (isLoading) return <div className="empty">Loading recipe…</div>;
  if (!recipeData?.recipe) return <div className="empty">Recipe not found.</div>;

  const recipe = recipeData.recipe;
  const isFav = (favData?.recipes ?? []).some((r) => r.id === recipe.id);
  const pct = recipe.ingredients.length
    ? have.length / recipe.ingredients.filter((i) => i.ingredient_id).length || 0
    : 0;

  const shareRecipe = async () => {
    const url = `${window.location.origin}/r/${recipe.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: recipe.title, text: recipe.description || '', url });
      } else {
        await navigator.clipboard.writeText(url);
        toast('Link copied to clipboard');
      }
      trackEvent('recipe_share', { recipe: recipe.slug });
    } catch {
      /* user dismissed the share sheet */
    }
  };

  const addMissingToList = async () => {
    if (!activeList) {
      toast('No active list — create one first');
      return;
    }
    const items = missing.map((id) => ({ ingredient_id: id, section: 'other' }));
    await api.addListItems(activeList.id, items);
    qc.invalidateQueries({ queryKey: ['lists'] });
    toast(`Added ${missing.length} to "${activeList.name}"`);
  };

  return (
    <div className="screen recipe-detail">
      <Link to="/recipes" className="back-btn">
        <Icon name="arrow" size={14} /> Back to recipes
      </Link>
      <div className="recipe-detail-hero">
        <MealPlate recipe={recipe} size={340} />
        <div className="recipe-detail-title">
          <div className="eyebrow">
            {recipe.tags.slice(0, 3).map((t, i) => (
              <span key={t}>
                {i > 0 && <span className="dot-sep"> · </span>}
                <Link to={`/collection/${t}`} style={{ color: 'inherit' }}>
                  {t}
                </Link>
              </span>
            ))}
          </div>
          <h1>{recipe.title}</h1>
          <p className="lede">{recipe.description}</p>
          <div className="recipe-detail-stats">
            <div>
              <div className="mono small muted">prep</div>
              <div className="stat-num-sm">
                {recipe.prep_time}
                <span className="mono small">min</span>
              </div>
            </div>
            <div>
              <div className="mono small muted">cook</div>
              <div className="stat-num-sm">
                {recipe.cook_time}
                <span className="mono small">min</span>
              </div>
            </div>
            <div>
              <div className="mono small muted">serves</div>
              <div className="stat-num-sm">{recipe.servings}</div>
            </div>
            <div>
              <div className="mono small muted">match</div>
              <div className="stat-num-sm">
                {Math.round(pct * 100)}
                <span className="mono small">%</span>
              </div>
            </div>
          </div>
          <div className="recipe-detail-actions">
            <button className="btn btn-primary" onClick={() => navigate(`/cook/${recipe.slug}`)}>
              <Icon name="chef" size={14} /> I'm cooking this
            </button>
            <button
              className={`btn btn-ghost ${isFav ? 'fav-on' : ''}`}
              aria-pressed={isFav}
              onClick={async () => {
                try {
                  const r = await api.toggleFavourite(recipe.slug);
                  qc.invalidateQueries({ queryKey: ['favourites'] });
                  toast(r.favourited ? 'Saved to favourites' : 'Removed from favourites');
                } catch {
                  /* ignore */
                }
              }}
            >
              <Icon name="heart" size={14} /> {isFav ? 'Saved' : 'Save'}
            </button>
            {missing.length > 0 && (
              <button className="btn btn-ghost" onClick={addMissingToList}>
                <Icon name="cart" size={14} /> Add {missing.length} missing to list
              </button>
            )}
            {user?.group_id && (
              <button className="btn btn-sage" onClick={() => setShowSuggest(true)}>
                <Icon name="group" size={14} /> Suggest to group
              </button>
            )}
            <button className="btn btn-ghost" onClick={shareRecipe}>
              <Icon name="share" size={14} /> Share
            </button>
            <button className="btn btn-ghost print-btn" onClick={() => window.print()}>
              <Icon name="print" size={14} /> Print / Save PDF
            </button>
          </div>
        </div>
      </div>

      <div className="recipe-detail-body">
        <div>
          <h3>Ingredients</h3>
          <ul className="recipe-ings">
            {recipe.ingredients.map((i, idx) => {
              const has = i.ingredient_id && have.includes(i.ingredient_id);
              return (
                <li key={idx} className={has ? 'have' : 'miss'}>
                  <span className="dot">{has ? <Icon name="check" size={11} /> : ''}</span>
                  <span className="ing-name">{i.display || i.ingredient_id}</span>
                  <span className="ing-amt mono small muted">{i.amount}</span>
                </li>
              );
            })}
          </ul>
          <AffiliateButtons
            query={recipe.ingredients.map((i) => i.display || i.ingredient_id).filter(Boolean).join(', ')}
            unboughtCount={recipe.ingredients.length}
            slug={recipe.slug}
          />
        </div>
        <div>
          <MethodBlock steps={recipe.steps} />
        </div>
      </div>

      {showSuggest && (
        <SuggestModal
          title={recipe.title}
          slug={recipe.slug}
          onClose={() => setShowSuggest(false)}
          onDone={() => {
            setShowSuggest(false);
            toast('Suggested to your group');
          }}
        />
      )}
    </div>
  );
}

function SuggestModal({
  title,
  slug,
  onClose,
  onDone,
}: {
  title: string;
  slug: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [date, setDate] = useState('Tonight');
  const opts = ['Tonight', 'Tomorrow', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const qc = useQueryClient();
  const submit = async () => {
    await api.createSuggestion({ recipe_slug: slug, suggested_for_date: date });
    trackEvent('suggestion_created', { recipe: slug });
    qc.invalidateQueries({ queryKey: ['group-suggestions'] });
    qc.invalidateQueries({ queryKey: ['feed'] });
    onDone();
  };
  return (
    <Modal small eyebrow="Suggest to the group" title={title} onClose={onClose}>
      <label className="field-label">When?</label>
      <div className="chip-row">
        {opts.map((o) => (
          <button key={o} className={`chip ${o === date ? 'active' : ''}`} onClick={() => setDate(o)}>
            {o}
          </button>
        ))}
      </div>
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={submit}>
          <Icon name="sparkle" size={14} /> Suggest it
        </button>
      </div>
    </Modal>
  );
}
