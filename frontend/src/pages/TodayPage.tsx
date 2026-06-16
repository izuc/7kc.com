import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { daysUntil } from '../lib/format';
import { Icon } from '../components/Icon';
import { MealPlate } from '../components/MealPlate';
import { useAuth } from '../store/auth';

/**
 * "Your kitchen today" — the home hub. Composes existing cached queries (no new
 * backend) into a single glanceable dashboard and deep-links into each area.
 */
export function TodayPage() {
  const { user } = useAuth();
  const inGroup = Boolean(user?.group_id);

  const { data: pantryData } = useQuery({ queryKey: ['pantry'], queryFn: () => api.pantry() });
  const { data: suggData } = useQuery({ queryKey: ['recipe-suggestions'], queryFn: () => api.suggestions() });
  const { data: listsData } = useQuery({ queryKey: ['lists'], queryFn: () => api.lists() });
  const { data: statsData } = useQuery({ queryKey: ['stats'], queryFn: () => api.stats() });
  const { data: feedData } = useQuery({ queryKey: ['feed'], queryFn: () => api.feed(), enabled: inGroup });

  const pantry = pantryData?.items ?? [];
  const expiringSoon = pantry.filter((p) => {
    if (p.expires_at == null) return false;
    const d = daysUntil(p.expires_at * 1000);
    return d >= 0 && d <= 3;
  });
  const lowCount = pantry.filter((p) => p.running_low).length;

  const topPicks = (suggData?.ranked ?? []).slice(0, 3);
  const activeList = (listsData?.lists ?? []).find((l) => !l.archived_at);
  const unbought = activeList ? activeList.items.filter((i) => !i.is_bought).length : 0;
  const stats = statsData?.stats;
  const feedCount = (feedData?.feed ?? []).length;

  const firstName = user?.display_name?.split(' ')[0] || null;

  return (
    <div className="screen">
      <div className="screen-head">
        <div className="screen-head-left">
          <div className="eyebrow">Today</div>
          <h1 className="screen-title">{firstName ? `Hi ${firstName}` : 'Your kitchen today'}</h1>
        </div>
      </div>

      <div className="today-grid">
        <div className="today-card today-cook">
          <div className="eyebrow sage">
            Cook tonight
            {stats && stats.meals_this_week > 0 && (
              <>
                <span className="dot-sep">·</span>
                <span className="mono">{stats.meals_this_week} cooked this week</span>
              </>
            )}
          </div>
          {topPicks.length > 0 && topPicks[0].pantry_match >= 0.3 ? (
            <div className="today-picks">
              {topPicks.map((p) => (
                <Link key={p.recipe.id} className="today-pick" to={`/recipes/${p.recipe.slug}`}>
                  <div className="today-pick-plate">
                    <MealPlate
                      recipe={p.recipe}
                      ingredientIds={[...p.have_ingredient_ids, ...p.missing_ingredient_ids]}
                      size={140}
                      rounded={false}
                    />
                  </div>
                  <div className="today-pick-body">
                    <span className="today-pick-title">{p.recipe.title}</span>
                    <span className="mono small muted">{Math.round(p.pantry_match * 100)}% match</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <>
              <p className="muted">
                Your pantry's light — stock a few staples and we'll rank dinner from what you've got.
              </p>
              <Link className="btn btn-primary" to="/pantry" style={{ alignSelf: 'flex-start' }}>
                <Icon name="pantry" size={14} /> Stock the pantry
              </Link>
            </>
          )}
        </div>

        {expiringSoon.length > 0 && (
          <Link className="today-card today-link" to="/recipes?filter=expiring">
            <div className="today-card-num amber">{expiringSoon.length}</div>
            <div>
              <div className="today-card-label">expiring soon</div>
              <div className="muted small">Use them before they go to waste →</div>
            </div>
          </Link>
        )}

        <Link className="today-card today-link" to={activeList ? `/lists/${activeList.id}` : '/lists'}>
          <div className="today-card-num">{unbought}</div>
          <div>
            <div className="today-card-label">{activeList ? `to buy · ${activeList.name}` : 'shopping list'}</div>
            <div className="muted small">
              {lowCount > 0 ? `${lowCount} running low — restock →` : 'Open your list →'}
            </div>
          </div>
        </Link>

        {stats && (stats.rescued > 0 || stats.tossed > 0) && (
          <Link className="today-card today-link" to="/pantry">
            <div className="today-card-num sage">{stats.rescued}</div>
            <div>
              <div className="today-card-label">rescued this month</div>
              <div className="muted small">
                {stats.rescue_rate != null ? `${stats.rescue_rate}% rescue rate →` : 'Waste nothing →'}
              </div>
            </div>
          </Link>
        )}

        {inGroup && (
          <Link className="today-card today-link" to="/group">
            <div className="today-card-num">{feedCount}</div>
            <div>
              <div className="today-card-label">group updates</div>
              <div className="muted small">See what the household's cooking →</div>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
