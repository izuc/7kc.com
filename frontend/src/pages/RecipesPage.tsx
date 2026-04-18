import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Icon } from '../components/Icon';
import { Swatch } from '../components/Swatch';
import type { RankedRecipe } from '../types/models';

type Filter = 'all' | 'can-make' | 'quick' | 'expiring' | 'veg';

export function RecipesPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['recipe-suggestions'],
    queryFn: () => api.suggestions(),
  });

  const ranked = data?.ranked ?? [];
  const filtered = useMemo<RankedRecipe[]>(() => {
    return ranked.filter((entry) => {
      const r = entry.recipe;
      if (q) {
        const n = q.toLowerCase();
        if (!r.title.toLowerCase().includes(n) && !r.tags.some((t) => t.toLowerCase().includes(n))) {
          return false;
        }
      }
      if (filter === 'can-make') return entry.pantry_match === 1;
      if (filter === 'quick') return r.prep_time + r.cook_time <= 25;
      if (filter === 'expiring') return entry.expiring_hits > 0;
      if (filter === 'veg') return r.tags.includes('vegetarian') || r.tags.includes('vegan');
      return true;
    });
  }, [ranked, filter, q]);

  const topPick = ranked[0];

  if (isLoading) return <div className="empty">Finding recipes…</div>;

  return (
    <div className="screen">
      <div className="screen-head">
        <div className="screen-head-left">
          <div className="eyebrow">
            Recipes <span className="dot-sep">·</span> <span className="mono">{ranked.length}</span>
          </div>
          <h1 className="screen-title">What can I make?</h1>
        </div>
        <div className="screen-head-right">
          <div className="search-input">
            <Icon name="search" size={14} />
            <input placeholder="Search recipes or tags…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
      </div>

      {topPick && topPick.pantry_match >= 0.7 && (
        <div
          className="hero-pick"
          onClick={() => navigate(`/recipes/${topPick.recipe.slug}`)}
          role="button"
        >
          <Swatch palette={topPick.recipe.palette} label={topPick.recipe.title} size="lg" rounded />
          <div className="hero-pick-body">
            <div className="eyebrow sage">Top pick for your pantry</div>
            <h2>{topPick.recipe.title}</h2>
            <p className="muted">{topPick.recipe.description}</p>
            <div className="hero-pick-meta">
              <span className="mono">{Math.round(topPick.pantry_match * 100)}% pantry match</span>
              <span className="mono muted">·</span>
              <span className="mono">{topPick.recipe.prep_time + topPick.recipe.cook_time} min</span>
              <span className="mono muted">·</span>
              <span className="mono">{topPick.recipe.servings} serves</span>
              {topPick.expiring_hits > 0 && (
                <span className="tag tag-amber">
                  <Icon name="clock" size={11} /> uses {topPick.expiring_hits} expiring
                </span>
              )}
            </div>
            <button
              className="btn btn-primary"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/cook/${topPick.recipe.slug}`);
              }}
            >
              <Icon name="chef" size={14} /> Cook this
            </button>
          </div>
        </div>
      )}

      <div className="filter-row">
        {(
          [
            ['all', 'All'],
            ['can-make', 'I have everything'],
            ['expiring', "Use what's expiring"],
            ['quick', 'Under 25 min'],
            ['veg', 'Vegetarian'],
          ] as [Filter, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            className={`filter-chip ${filter === id ? 'active' : ''}`}
            onClick={() => setFilter(id)}
          >
            {label}
            {id !== 'all' && (
              <span className="mono small">
                {id === 'can-make'
                  ? ranked.filter((r) => r.pantry_match === 1).length
                  : id === 'quick'
                  ? ranked.filter((r) => r.recipe.prep_time + r.recipe.cook_time <= 25).length
                  : id === 'expiring'
                  ? ranked.filter((r) => r.expiring_hits > 0).length
                  : ranked.filter((r) => r.recipe.tags.includes('vegetarian') || r.recipe.tags.includes('vegan')).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="recipe-grid">
        {filtered.slice(0, 60).map((entry) => (
          <RecipeCard key={entry.recipe.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}

function RecipeCard({ entry }: { entry: RankedRecipe }) {
  const { recipe, pantry_match, have_ingredient_ids, missing_ingredient_ids, expiring_hits } = entry;
  return (
    <Link className="recipe-card" to={`/recipes/${recipe.slug}`}>
      <Swatch palette={recipe.palette} label={recipe.title} size="full" />
      <div className="recipe-card-body">
        <div className="recipe-card-meta">
          <span className="mono small">{recipe.prep_time + recipe.cook_time} min</span>
          <span className="mono small muted">·</span>
          <span className="mono small">{recipe.servings} serves</span>
        </div>
        <h3>{recipe.title}</h3>
        <div
          className="pantry-bar"
          title={`${have_ingredient_ids.length}/${
            have_ingredient_ids.length + missing_ingredient_ids.length
          } in pantry`}
        >
          <div className="pantry-bar-fill" style={{ width: `${pantry_match * 100}%` }} />
        </div>
        <div className="recipe-card-foot">
          <span className="mono small">
            {pantry_match === 1 ? 'ready to cook' : `need ${missing_ingredient_ids.length}`}
          </span>
          {expiring_hits > 0 && (
            <span className="tag tag-amber small">
              <Icon name="clock" size={10} /> expiring
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
