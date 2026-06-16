import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Icon } from '../components/Icon';
import { MealPlate } from '../components/MealPlate';
import { SkeletonRecipeGrid } from '../components/Skeleton';
import type { RankedRecipe } from '../types/models';

const PAGE_SIZE = 24;

type Filter = 'all' | 'can-make' | 'quick' | 'expiring' | 'veg' | 'saved';

export function RecipesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState<Filter>((searchParams.get('filter') as Filter) || 'all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const gridAnchor = useRef<HTMLDivElement | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['recipe-suggestions'],
    queryFn: () => api.suggestions(),
  });
  const { data: cookedData } = useQuery({
    queryKey: ['cooked-recipes'],
    queryFn: () => api.cookedRecipes(),
  });
  const cooked = cookedData?.cooked ?? [];
  const { data: favData } = useQuery({ queryKey: ['favourites'], queryFn: () => api.favouriteRecipes() });
  const favSet = useMemo(() => new Set((favData?.recipes ?? []).map((r) => r.id)), [favData]);
  const { data: statsData } = useQuery({ queryKey: ['stats'], queryFn: () => api.stats() });
  const mealsThisWeek = statsData?.stats?.meals_this_week ?? 0;

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
      if (filter === 'saved') return favSet.has(r.id);
      return true;
    });
  }, [ranked, filter, q, favSet]);

  // reset pagination whenever filters change
  useEffect(() => {
    setPage(1);
  }, [filter, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageEnd = Math.min(pageStart + PAGE_SIZE, filtered.length);
  const paginated = filtered.slice(pageStart, pageEnd);

  const goToPage = (p: number) => {
    setPage(Math.min(Math.max(1, p), totalPages));
    gridAnchor.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const topPick = ranked[0];

  if (isLoading) {
    return (
      <div className="screen">
        <div className="screen-head">
          <div className="screen-head-left">
            <div className="eyebrow">Recipes</div>
            <h1 className="screen-title">What can I make?</h1>
          </div>
        </div>
        <SkeletonRecipeGrid count={8} />
      </div>
    );
  }

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

      {(!topPick || topPick.pantry_match < 0.5) && (
        <div className="empty">
          <Icon name="pantry" size={26} />
          <p>
            <b>Your pantry's nearly empty.</b> Add a few staples and recipes rank themselves by what
            you can actually cook right now — browse the library below in the meantime.
          </p>
          <div className="row-inline" style={{ gap: 10 }}>
            <button className="btn btn-primary" onClick={() => navigate('/pantry')}>
              <Icon name="pantry" size={14} /> Stock your pantry
            </button>
            <button className="btn btn-ghost" onClick={() => navigate('/lists')}>
              <Icon name="list" size={14} /> Start a shopping list
            </button>
          </div>
        </div>
      )}

      {topPick && topPick.pantry_match >= 0.7 && (
        <div
          className="hero-pick"
          onClick={() => navigate(`/recipes/${topPick.recipe.slug}`)}
          role="button"
        >
          <MealPlate
            recipe={topPick.recipe}
            ingredientIds={[...topPick.have_ingredient_ids, ...topPick.missing_ingredient_ids]}
            size={280}
          />
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

      {cooked.length > 0 && (
        <div className="cooked-rail">
          <div className="eyebrow">
            Recently cooked
            {mealsThisWeek > 0 && (
              <>
                <span className="dot-sep">·</span>
                <span className="mono">{mealsThisWeek} this week</span>
              </>
            )}
          </div>
          <div className="cooked-rail-track">
            {cooked.map((c) => (
              <Link key={c.recipe.id} className="cooked-card" to={`/recipes/${c.recipe.slug}`}>
                <div className="cooked-card-plate">
                  <MealPlate
                    recipe={c.recipe}
                    ingredientIds={c.recipe.ingredient_ids}
                    size={160}
                    rounded={false}
                  />
                </div>
                <div className="cooked-card-body">
                  <span className="cooked-card-title">{c.recipe.title}</span>
                  <span className="mono small muted">cooked {c.cooked_count}×</span>
                </div>
              </Link>
            ))}
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
            ['saved', 'Saved'],
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
                  : id === 'saved'
                  ? ranked.filter((r) => favSet.has(r.recipe.id)).length
                  : ranked.filter((r) => r.recipe.tags.includes('vegetarian') || r.recipe.tags.includes('vegan')).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div ref={gridAnchor} />

      {filtered.length === 0 ? (
        <div className="empty">
          <Icon name="chef" size={26} />
          <p>No recipes match that filter.</p>
          <button className="btn btn-ghost" onClick={() => { setFilter('all'); setQ(''); }}>
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <div className="recipe-grid stagger-in">
            {paginated.map((entry) => (
              <RecipeCard key={entry.recipe.id} entry={entry} />
            ))}
          </div>

          <Pagination
            page={safePage}
            totalPages={totalPages}
            pageStart={pageStart + 1}
            pageEnd={pageEnd}
            total={filtered.length}
            onPage={goToPage}
          />
        </>
      )}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  pageStart,
  pageEnd,
  total,
  onPage,
}: {
  page: number;
  totalPages: number;
  pageStart: number;
  pageEnd: number;
  total: number;
  onPage: (p: number) => void;
}) {
  if (totalPages <= 1) {
    return (
      <div className="pagination-count mono small muted" aria-live="polite">
        Showing all {total} recipe{total === 1 ? '' : 's'}
      </div>
    );
  }
  const numbers = pageNumbers(page, totalPages);
  return (
    <nav className="pagination" aria-label="Recipe pagination">
      <div className="pagination-count mono small muted" aria-live="polite">
        Showing {pageStart}–{pageEnd} of {total}
      </div>
      <div className="pagination-buttons">
        <button
          className="btn btn-ghost"
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
        >
          <span style={{ transform: 'rotate(180deg)', display: 'inline-block' }}>→</span> Prev
        </button>
        {numbers.map((n, i) =>
          n === '…' ? (
            <span key={`gap-${i}`} className="pagination-gap mono muted">…</span>
          ) : (
            <button
              key={n}
              className={`pagination-num ${n === page ? 'active' : ''}`}
              onClick={() => onPage(n)}
              aria-current={n === page ? 'page' : undefined}
            >
              {n}
            </button>
          )
        )}
        <button
          className="btn btn-ghost"
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          aria-label="Next page"
        >
          Next →
        </button>
      </div>
    </nav>
  );
}

function pageNumbers(current: number, total: number): (number | '…')[] {
  const pages: (number | '…')[] = [];
  const add = (n: number) => pages.push(n);

  // always show first, last, current, current±1; collapse the rest with ellipsis
  const shown = new Set<number>([1, total, current - 1, current, current + 1]);
  const sorted = [...shown].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);

  let prev = 0;
  for (const n of sorted) {
    if (n - prev > 1) pages.push('…');
    add(n);
    prev = n;
  }
  return pages;
}

function RecipeCard({ entry }: { entry: RankedRecipe }) {
  const { recipe, pantry_match, have_ingredient_ids, missing_ingredient_ids, expiring_hits } = entry;
  const allIngredientIds = [...have_ingredient_ids, ...missing_ingredient_ids];
  return (
    <Link className="recipe-card" to={`/recipes/${recipe.slug}`}>
      <div style={{ aspectRatio: '5 / 4', overflow: 'hidden' }}>
        <MealPlate recipe={recipe} ingredientIds={allIngredientIds} size={280} rounded={false} />
      </div>
      <div className="recipe-card-body">
        <div className="recipe-card-meta">
          <span className="mono small">{recipe.prep_time + recipe.cook_time} min</span>
          <span className="mono small muted">·</span>
          <span className="mono small">{recipe.servings} serves</span>
          {recipe.sponsored_by && (
            <span className="tag tag-amber small" style={{ marginLeft: 'auto' }}>
              Sponsored
            </span>
          )}
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
