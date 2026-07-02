import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Icon } from '../components/Icon';
import { MealPlate } from '../components/MealPlate';

/**
 * Public catalogue browser (/browse) — every recipe with its generated dish
 * artwork, searchable and filterable, no account needed. Cards link to the
 * public /r/:slug pages; the only asks are quiet "start your pantry" CTAs.
 */

const TAG_LABELS: Record<string, string> = {
  'no-cook': 'No-cook',
  'gluten-free': 'Gluten-free',
  'batch-friendly': 'Batch-friendly',
  bbq: 'BBQ',
};
const tagLabel = (t: string) => TAG_LABELS[t] ?? t.charAt(0).toUpperCase() + t.slice(1);

export function BrowsePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['public-recipes'],
    queryFn: () => api.publicRecipes(),
    staleTime: 60 * 60 * 1000,
  });
  const [q, setQ] = useState('');
  const [tag, setTag] = useState<string | null>(null);

  const recipes = useMemo(() => data?.recipes ?? [], [data]);

  useEffect(() => {
    document.title = 'Browse all recipes — 7 Day Kitchen';
    const meta = document.querySelector('meta[name="description"]');
    const prev = meta?.getAttribute('content') ?? '';
    meta?.setAttribute(
      'content',
      `Browse all ${recipes.length || 200}+ recipes on 7 Day Kitchen — every dish drawn, no account needed.`
    );
    return () => {
      if (meta && prev) meta.setAttribute('content', prev);
    };
  }, [recipes.length]);

  // the ~12 most-used tags become the filter row
  const topTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of recipes) for (const t of r.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    return [...counts.entries()]
      .filter(([, n]) => n >= 8)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([t]) => t);
  }, [recipes]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return recipes.filter((r) => {
      if (tag && !r.tags.includes(tag)) return false;
      if (needle && !r.title.toLowerCase().includes(needle) && !r.tags.some((t) => t.includes(needle))) return false;
      return true;
    });
  }, [recipes, q, tag]);

  return (
    <div className="public-shell">
      <header className="public-head">
        <Link to="/" className="brand">
          <svg viewBox="0 0 28 28" width={28} height={28} aria-hidden>
            <rect x="1" y="1" width="26" height="26" rx="7" fill="var(--accent)" />
            <text x="14" y="19" textAnchor="middle" fontFamily="var(--serif)" fontSize={14} fill="var(--cream)">
              7
            </text>
          </svg>
          <div>
            <div className="brand-name">7 Day Kitchen</div>
            <div className="brand-tag mono small">7kc.com</div>
          </div>
        </Link>
        <div className="row-inline" style={{ gap: 10 }}>
          <Link to="/login" className="btn btn-ghost">Sign in</Link>
          <Link to="/register" className="btn btn-primary">
            <Icon name="sparkle" size={14} /> Start your pantry
          </Link>
        </div>
      </header>

      <main className="screen browse-main">
        <div className="browse-head">
          <div className="eyebrow">
            The library<span className="dot-sep">·</span>
            <span className="mono">{recipes.length || '…'} recipes</span>
          </div>
          <h1 className="browse-title">Every dish, drawn.</h1>
          <p className="muted browse-sub">
            The whole catalogue, open — no account needed. Each illustration is generated from the
            recipe itself: its ingredients pick the toppings, its colours set the palette. Sign up and
            your pantry ranks these by what you can already cook.
          </p>
        </div>

        <div className="browse-controls">
          <div className="browse-search">
            <Icon name="search" size={15} />
            <input
              type="search"
              placeholder="Search recipes or tags…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search recipes"
            />
          </div>
          <div className="filter-row" role="group" aria-label="Filter by tag">
            <button className={`filter-chip ${tag === null ? 'active' : ''}`} onClick={() => setTag(null)}>
              All
            </button>
            {topTags.map((t) => (
              <button
                key={t}
                className={`filter-chip ${tag === t ? 'active' : ''}`}
                aria-pressed={tag === t}
                onClick={() => setTag(tag === t ? null : t)}
              >
                {tagLabel(t)}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="empty">Setting the table…</div>
        ) : shown.length === 0 ? (
          <div className="empty">
            Nothing matches “{q}”. <button className="btn btn-ghost" onClick={() => { setQ(''); setTag(null); }}>Clear the search</button>
          </div>
        ) : (
          <div className="recipe-grid stagger-in browse-grid">
            {shown.map((r) => (
              <Link key={r.id} className="recipe-card" to={`/r/${r.slug}`}>
                <div style={{ aspectRatio: '5 / 4', overflow: 'hidden' }}>
                  <MealPlate recipe={r} ingredientIds={r.ingredient_ids} size={280} rounded={false} slice />
                </div>
                <div className="recipe-card-body">
                  <div className="recipe-card-meta">
                    <span className="mono small">{r.prep_time + r.cook_time} min</span>
                    <span className="mono small muted">·</span>
                    <span className="mono small">{r.servings} serves</span>
                  </div>
                  <h3>{r.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="browse-cta">
          <div>
            <h2>Cook from what you own</h2>
            <p className="muted">
              Add your pantry once and these {recipes.length || ''} recipes rank themselves by what
              you can make tonight. Free, offline, no subscription.
            </p>
          </div>
          <Link to="/register" className="btn btn-primary btn-lg">
            Start your pantry — free <Icon name="arrow" size={14} />
          </Link>
        </div>
      </main>
    </div>
  );
}
