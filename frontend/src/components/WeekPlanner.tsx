import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { weekStart, weekDays, isoDate } from '../lib/format';
import { useUi } from '../store/ui';
import { Icon } from './Icon';
import { MealPlate } from './MealPlate';
import { RecipePicker } from './RecipePicker';
import type { MealPlanEntry, RecipeSummary } from '../types/models';

/**
 * Solo "This week" 7-day meal-planner strip + "build a shopping list from it".
 * Days hold as many meals as the cook wants — breakfast, lunch, dinner, a
 * snack, or just one dinner — each with an optional label. Long days scroll
 * inside their cell.
 */
export function WeekPlanner() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const toast = useUi((s) => s.toast);

  // Track the local day so a tab parked on /today rolls the strip over at midnight
  // (esp. Sun→Mon) instead of staying pinned to the week that was current at mount.
  const [today, setToday] = useState(() => isoDate(new Date()));
  useEffect(() => {
    const check = () => setToday((prev) => (prev === isoDate(new Date()) ? prev : isoDate(new Date())));
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', check);
    return () => {
      window.removeEventListener('focus', check);
      document.removeEventListener('visibilitychange', check);
    };
  }, []);

  const start = useMemo(() => weekStart(new Date()), [today]);
  const startIso = useMemo(() => isoDate(start), [start]);
  const days = useMemo(() => weekDays(start), [start]);
  const key = ['meal-plan', startIso];

  const { data } = useQuery({ queryKey: key, queryFn: () => api.getMealPlan(startIso) });
  const byDate = useMemo(() => {
    const m = new Map<string, MealPlanEntry[]>();
    for (const e of data?.entries ?? []) {
      const list = m.get(e.date);
      if (list) list.push(e);
      else m.set(e.date, [e]);
    }
    return m;
  }, [data]);
  const plannedCount = data?.entries?.length ?? 0;

  const [picker, setPicker] = useState<{ date: string; dayLabel: string; entry?: MealPlanEntry } | null>(null);

  // On narrow screens the strip scrolls — start the week view at today, not Monday.
  const stripRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = stripRef.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    const cell = el.querySelector<HTMLElement>('.week-cell.today');
    if (cell) el.scrollLeft = Math.max(0, cell.offsetLeft - el.offsetLeft - 8);
  }, [today]);

  const addMeal = useMutation({
    mutationFn: ({ date, slug, label }: { date: string; slug: string; label: string | null }) =>
      api.addMealPlan(date, slug, label),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: () => toast("Couldn't save that meal — please try again."),
  });
  const updateMeal = useMutation({
    mutationFn: ({ id, slug, label }: { id: string; slug: string; label: string | null }) =>
      api.updateMealPlanEntry(id, slug, label),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: () => toast("Couldn't save that meal — please try again."),
  });
  const removeMeal = useMutation({
    mutationFn: (id: string) => api.removeMealPlanEntry(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: () => toast("Couldn't remove that meal — please try again."),
  });
  const buildList = useMutation({
    mutationFn: () => api.buildListFromWeek(startIso),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['lists'] });
      toast(`Added ${r.added} item${r.added === 1 ? '' : 's'} to a new list`);
      navigate(`/lists/${r.list.id}`);
    },
    onError: () => toast("Couldn't build the list — plan a meal first."),
  });

  const pick = (recipe: RecipeSummary, label: string | null) => {
    if (picker?.entry) updateMeal.mutate({ id: picker.entry.id, slug: recipe.slug, label });
    else if (picker) addMeal.mutate({ date: picker.date, slug: recipe.slug, label });
    setPicker(null);
  };

  // A gentle default for the next meal's label: dinner first (that's what most
  // people plan), then whichever of the classics the day doesn't have yet.
  const suggestLabel = (meals: MealPlanEntry[]): string | null => {
    const used = new Set(meals.map((m) => m.label?.toLowerCase()).filter(Boolean));
    for (const slot of ['Dinner', 'Lunch', 'Breakfast']) {
      if (!used.has(slot.toLowerCase())) return slot;
    }
    return null;
  };

  return (
    <section className="today-week">
      <div className="today-week-head">
        <div className="eyebrow">This week</div>
        <button
          className="btn btn-sage btn-sm"
          disabled={plannedCount === 0 || buildList.isPending}
          onClick={() => buildList.mutate()}
        >
          <Icon name="cart" size={14} /> Build shopping list
        </button>
      </div>

      <div className="week-strip" ref={stripRef}>
        {days.map((d) => {
          const meals = byDate.get(d.date) ?? [];
          const dayLabel = `${d.dow} ${d.dayOfMonth}`;
          return (
            <div
              key={d.date}
              className={`week-cell ${meals.length ? 'planned' : 'empty'} ${d.date === today ? 'today' : ''}`}
            >
              <div className="week-cell-head">
                <span className="mono small muted">{d.dow}</span>
                <span className="week-cell-dom">{d.dayOfMonth}</span>
              </div>
              {meals.length > 0 && (
                <div className="week-meals">
                  {meals.map((e) => {
                    const title = e.recipe?.title ?? e.recipe_title ?? '';
                    return (
                      <div key={e.id} className="week-meal">
                        <button
                          className="week-meal-main"
                          onClick={() => setPicker({ date: d.date, dayLabel, entry: e })}
                          aria-label={`Change ${e.label ?? 'meal'} for ${dayLabel} (${title})`}
                        >
                          {e.recipe && <MealPlate recipe={e.recipe} size={38} rounded />}
                          <span className="week-meal-text">
                            {e.label && <span className="week-meal-tag mono">{e.label}</span>}
                            <span className="week-meal-title">{title}</span>
                          </span>
                        </button>
                        <button
                          className="week-cell-x"
                          aria-label={`Remove ${e.label ?? 'meal'} (${title}) from ${dayLabel}`}
                          onClick={() => removeMeal.mutate(e.id)}
                        >
                          <Icon name="x" size={11} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <button
                className="week-add"
                onClick={() => setPicker({ date: d.date, dayLabel })}
                aria-label={`Add a meal to ${dayLabel}`}
              >
                <Icon name="plus" size={13} /> {meals.length ? 'Add meal' : 'Plan'}
              </button>
            </div>
          );
        })}
      </div>

      {picker && (
        <RecipePicker
          dayLabel={picker.dayLabel}
          initialLabel={picker.entry ? picker.entry.label : suggestLabel(byDate.get(picker.date) ?? [])}
          onPick={pick}
          onClose={() => setPicker(null)}
        />
      )}
    </section>
  );
}
