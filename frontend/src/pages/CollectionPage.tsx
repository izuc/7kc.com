import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../store/auth';
import { Icon } from '../components/Icon';
import { MealPlate } from '../components/MealPlate';

const LABELS: Record<string, string> = {
  'no-cook': 'No-cook',
  'gluten-free': 'Gluten-free',
  'batch-friendly': 'Batch-friendly',
  bbq: 'BBQ',
};
const label = (t: string) => LABELS[t] ?? t.charAt(0).toUpperCase() + t.slice(1);

/** Public tag collection landing page (/collection/:tag) — internal-links the catalogue for SEO. */
export function CollectionPage() {
  const { user } = useAuth();
  const { tag } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ['collection', tag],
    queryFn: () => api.collection(tag!),
    enabled: !!tag,
  });

  useEffect(() => {
    if (tag) document.title = `${label(tag)} recipes — 7 Day Kitchen`;
  }, [tag]);

  const recipes = data?.recipes ?? [];

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
          <Link to="/browse" className="btn btn-ghost">
            All recipes
          </Link>
          {user ? (
            <Link to="/today" className="btn btn-primary">
              <Icon name="home" size={14} /> My kitchen
            </Link>
          ) : (
            <Link to="/register" className="btn btn-primary">
              <Icon name="sparkle" size={14} /> Start your pantry
            </Link>
          )}
        </div>
      </header>

      <main className="screen" style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px 80px' }}>
        <div className="eyebrow">Collection</div>
        <h1>{tag ? label(tag) : ''} recipes</h1>
        {isLoading ? (
          <div className="empty">Loading…</div>
        ) : recipes.length === 0 ? (
          <div className="empty">No recipes in this collection yet.</div>
        ) : (
          <div className="recipe-grid stagger-in" style={{ marginTop: 16 }}>
            {recipes.map((r) => (
              <Link key={r.id} className="recipe-card" to={user ? `/recipes/${r.slug}` : `/r/${r.slug}`}>
                <div style={{ aspectRatio: '5 / 4', overflow: 'hidden' }}>
                  <MealPlate recipe={r} ingredientIds={r.ingredient_ids} size={280} rounded={false} />
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
      </main>
    </div>
  );
}
