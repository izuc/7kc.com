import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '../components/Icon';
import { Swatch } from '../components/Swatch';
import type { Recipe } from '../types/models';

/**
 * SEO-friendly public recipe landing page. Accessible without login at /r/:slug.
 * Renders the same content the authenticated detail page shows, plus a
 * JSON-LD Schema.org Recipe block for rich results.
 */
export function PublicRecipePage() {
  const { slug } = useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-recipe', slug],
    queryFn: async () => {
      const base = import.meta.env.VITE_API_URL || '/api/v1';
      const r = await fetch(`${base}/public/recipes/${slug}`);
      if (!r.ok) throw new Error('not_found');
      return r.json() as Promise<{ recipe: Recipe; schema: Record<string, unknown> }>;
    },
    enabled: !!slug,
  });

  useEffect(() => {
    if (!data) return;
    document.title = `${data.recipe.title} — 7 Day Kitchen`;
    const meta = document.querySelector('meta[name=description]') || (() => {
      const m = document.createElement('meta');
      m.setAttribute('name', 'description');
      document.head.appendChild(m);
      return m;
    })();
    meta.setAttribute('content', (data.recipe.description || '').slice(0, 160));

    // inject JSON-LD
    const id = '__seven-kc-recipe-schema';
    document.getElementById(id)?.remove();
    const s = document.createElement('script');
    s.type = 'application/ld+json';
    s.id = id;
    s.textContent = JSON.stringify(data.schema);
    document.head.appendChild(s);

    return () => {
      document.getElementById(id)?.remove();
    };
  }, [data]);

  if (isLoading) return <div className="empty">Loading recipe…</div>;
  if (error || !data?.recipe) return <div className="empty">Recipe not found.</div>;

  const { recipe } = data;

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
          <Link to="/recipes" className="btn btn-ghost">Browse recipes</Link>
          <Link to="/register" className="btn btn-primary">
            <Icon name="sparkle" size={14} /> Save to my pantry
          </Link>
        </div>
      </header>

      <main className="screen recipe-detail" style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px 80px' }}>
        <div className="recipe-detail-hero">
          <Swatch palette={recipe.palette} label={recipe.title} size="full" />
          <div className="recipe-detail-title">
            <div className="eyebrow">{recipe.tags.slice(0, 3).join(' · ')}</div>
            <h1>{recipe.title}</h1>
            <p className="lede">{recipe.description}</p>
            <div className="recipe-detail-stats">
              <div>
                <div className="mono small muted">prep</div>
                <div className="stat-num-sm">{recipe.prep_time}<span className="mono small">min</span></div>
              </div>
              <div>
                <div className="mono small muted">cook</div>
                <div className="stat-num-sm">{recipe.cook_time}<span className="mono small">min</span></div>
              </div>
              <div>
                <div className="mono small muted">serves</div>
                <div className="stat-num-sm">{recipe.servings}</div>
              </div>
            </div>
            <div className="recipe-detail-actions">
              <Link to="/register" className="btn btn-primary">
                <Icon name="chef" size={14} /> Cook it &amp; track your pantry
              </Link>
            </div>
          </div>
        </div>

        <div className="recipe-detail-body">
          <div>
            <h3>Ingredients</h3>
            <ul className="recipe-ings">
              {recipe.ingredients.map((i, idx) => (
                <li key={idx} className="miss">
                  <span className="dot" />
                  <span className="ing-name">{i.display || i.ingredient_id}</span>
                  <span className="ing-amt mono small muted">{i.amount}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Method</h3>
            <ol className="recipe-steps">
              {recipe.steps.map((s, i) => (
                <li key={i}>
                  <span className="step-num mono">{i + 1}</span>
                  <span>{s.content}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <footer className="public-foot">
          <div className="principle mono small muted">
            <div>Use what you've got.</div>
            <div>Eat what you love.</div>
            <div>Waste nothing.</div>
          </div>
          <Link to="/register" className="btn btn-primary">
            Start your pantry — free
          </Link>
        </footer>
      </main>
    </div>
  );
}
