import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { weekStart, weekDays, isoDate } from '../lib/format';
import { useUi } from '../store/ui';
import { Icon } from './Icon';
import { MealPlate } from './MealPlate';
import { RecipePicker } from './RecipePicker';
import type { RecipeSummary } from '../types/models';

/** Solo "This week" 7-day meal-planner strip + "build a shopping list from it". */
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
  const byDate = useMemo(
    () => new Map((data?.entries ?? []).map((e) => [e.date, e])),
    [data]
  );
  const plannedCount = data?.entries?.length ?? 0;

  const [pickerFor, setPickerFor] = useState<{ date: string; label: string } | null>(null);

  const setMeal = useMutation({
    mutationFn: ({ date, slug }: { date: string; slug: string }) => api.setMealPlan(date, slug),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: () => toast("Couldn't save that meal — please try again."),
  });
  const clearMeal = useMutation({
    mutationFn: (date: string) => api.clearMealPlan(date),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: () => toast("Couldn't clear that day — please try again."),
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

  const pick = (recipe: RecipeSummary) => {
    if (pickerFor) setMeal.mutate({ date: pickerFor.date, slug: recipe.slug });
    setPickerFor(null);
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

      <div className="week-strip">
        {days.map((d) => {
          const entry = byDate.get(d.date);
          const label = `${d.dow} ${d.dayOfMonth}`;
          return (
            <div key={d.date} className={`week-cell ${entry ? 'planned' : 'empty'}`}>
              <div className="week-cell-head">
                <span className="mono small muted">{d.dow}</span>
                <span className="week-cell-dom">{d.dayOfMonth}</span>
                {entry && (
                  <button
                    className="week-cell-x"
                    aria-label={`Clear ${label}`}
                    onClick={() => clearMeal.mutate(d.date)}
                  >
                    <Icon name="x" size={11} />
                  </button>
                )}
              </div>
              <button
                className="week-cell-body"
                onClick={() => setPickerFor({ date: d.date, label })}
                aria-label={entry ? `Change meal for ${label}` : `Plan a meal for ${label}`}
              >
                {entry?.recipe ? (
                  <>
                    <MealPlate recipe={entry.recipe} size={72} rounded />
                    <span className="week-cell-title">{entry.recipe.title}</span>
                  </>
                ) : entry?.recipe_title ? (
                  <span className="week-cell-title">{entry.recipe_title}</span>
                ) : (
                  <span className="week-cell-add">
                    <Icon name="plus" size={16} /> Plan
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {pickerFor && (
        <RecipePicker dayLabel={pickerFor.label} onPick={pick} onClose={() => setPickerFor(null)} />
      )}
    </section>
  );
}
