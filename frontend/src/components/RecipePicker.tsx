import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Modal } from './Modal';
import { MealPlate } from './MealPlate';
import type { RecipeSummary } from '../types/models';

/**
 * The usual suspects, offered as one-tap chips. A meal doesn't have to be
 * any of these — days aren't fixed to three slots — so the selection is
 * optional and toggles off, and anything custom can arrive via `initialLabel`.
 */
const MEAL_SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'];

/** Search → results → pick. Used by the week planner to add or replace a meal. */
export function RecipePicker({
  dayLabel,
  initialLabel = null,
  onPick,
  onClose,
}: {
  dayLabel?: string;
  initialLabel?: string | null;
  onPick: (recipe: RecipeSummary, label: string | null) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState('');
  const [label, setLabel] = useState<string | null>(initialLabel);
  const { data, isFetching } = useQuery({
    queryKey: ['recipe-search', q],
    queryFn: () => api.recipes(q),
    enabled: q.trim().length >= 1,
    staleTime: 30_000,
  });
  const results = (data?.recipes ?? []).slice(0, 8);
  const customLabel = label !== null && !MEAL_SLOTS.includes(label) ? label : null;

  return (
    <Modal small eyebrow={dayLabel ? `Plan ${dayLabel}` : 'Plan a meal'} title="Pick a recipe" onClose={onClose}>
      <div className="meal-slot-chips" role="group" aria-label="Meal">
        {customLabel && (
          <button className="chip active" onClick={() => setLabel(null)} type="button">
            {customLabel} ×
          </button>
        )}
        {MEAL_SLOTS.map((slot) => (
          <button
            key={slot}
            type="button"
            className={`chip ${label === slot ? 'active' : ''}`}
            aria-pressed={label === slot}
            onClick={() => setLabel(label === slot ? null : slot)}
          >
            {slot}
          </button>
        ))}
      </div>
      <input
        className="text-input"
        placeholder="Search recipes…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus
      />
      {q.trim().length >= 1 && results.length === 0 && !isFetching && (
        <p className="muted small" style={{ marginTop: 10 }}>No recipes match “{q}”.</p>
      )}
      <ul className="recipe-pick-list">
        {results.map((r) => (
          <li key={r.id}>
            <button className="recipe-pick-row" onClick={() => onPick(r, label)}>
              <MealPlate recipe={r} size={40} rounded />
              <span className="recipe-pick-title">{r.title}</span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
