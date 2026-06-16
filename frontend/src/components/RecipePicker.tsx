import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Modal } from './Modal';
import { MealPlate } from './MealPlate';
import type { RecipeSummary } from '../types/models';

/** Search → results → pick. Used by the week planner to choose a recipe for a day. */
export function RecipePicker({
  dayLabel,
  onPick,
  onClose,
}: {
  dayLabel?: string;
  onPick: (recipe: RecipeSummary) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState('');
  const { data, isFetching } = useQuery({
    queryKey: ['recipe-search', q],
    queryFn: () => api.recipes(q),
    enabled: q.trim().length >= 1,
    staleTime: 30_000,
  });
  const results = (data?.recipes ?? []).slice(0, 8);

  return (
    <Modal small eyebrow={dayLabel ? `Plan ${dayLabel}` : 'Plan a meal'} title="Pick a recipe" onClose={onClose}>
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
            <button className="recipe-pick-row" onClick={() => onPick(r)}>
              <MealPlate recipe={r} size={40} rounded />
              <span className="recipe-pick-title">{r.title}</span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
