import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useUi } from '../store/ui';
import { haptic } from '../lib/haptics';
import { useWakeLock } from '../lib/useWakeLock';
import { trackEvent } from '../lib/analytics';
import { Icon } from '../components/Icon';
import { StepTimer } from '../components/StepTimer';
import type { Recipe, RecipeStep } from '../types/models';

export function CookPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useUi((s) => s.toast);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [removed, setRemoved] = useState<number | null>(null);

  const { data: recipeData, isLoading } = useQuery({
    queryKey: ['recipe', slug],
    queryFn: () => api.recipe(slug!),
    enabled: !!slug,
  });
  const { data: pantryData } = useQuery({ queryKey: ['pantry'], queryFn: () => api.pantry() });

  const recipe = recipeData?.recipe;

  // Keep the screen awake while actively cooking (released on the done card + unmount).
  useWakeLock(!!recipe && !done);

  const pantryIngIds = useMemo(() => {
    const s = new Set<string>();
    for (const p of pantryData?.items ?? []) if (p.ingredient_id) s.add(p.ingredient_id);
    return s;
  }, [pantryData]);

  const [toRemove, setToRemove] = useState<Set<string> | null>(null);
  const effectiveToRemove = useMemo(() => {
    if (toRemove) return toRemove;
    if (!recipe) return new Set<string>();
    return new Set(
      recipe.ingredients
        .filter((i) => i.ingredient_id && pantryIngIds.has(i.ingredient_id))
        .map((i) => i.ingredient_id as string)
    );
  }, [toRemove, recipe, pantryIngIds]);

  if (isLoading) return <div className="empty">Loading…</div>;
  if (!recipe) return <div className="empty">Recipe not found.</div>;

  const toggleRemove = (id: string) => {
    const next = new Set(effectiveToRemove);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setToRemove(next);
  };

  const finish = async () => {
    try {
      const r = await api.cookRecipe(recipe.slug, [...effectiveToRemove]);
      trackEvent('cook_completed', { recipe: recipe.slug });
      qc.invalidateQueries({ queryKey: ['pantry'] });
      qc.invalidateQueries({ queryKey: ['recipe-suggestions'] });
      qc.invalidateQueries({ queryKey: ['cooked-recipes'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      qc.invalidateQueries({ queryKey: ['feed'] });
      setRemoved(r.removed);
      setDone(true);
    } catch {
      toast('Could not finish cooking — please try again.');
    }
  };

  const cookAgain = () => {
    setStep(0);
    setToRemove(null);
    setRemoved(null);
    setDone(false);
  };

  const saveFavourite = async () => {
    try {
      const r = await api.toggleFavourite(recipe.slug);
      qc.invalidateQueries({ queryKey: ['favourites'] });
      if (r.favourited) trackEvent('recipe_saved', { recipe: recipe.slug });
      toast(r.favourited ? 'Saved to favourites' : 'Removed from favourites');
    } catch {
      toast("Couldn't update favourites — please try again.");
    }
  };

  if (done) {
    return (
      <div className="screen cook-done">
        <div className="cook-done-card">
          <div className="cook-done-check">
            <Icon name="check" size={44} />
          </div>
          <h1>Nice cooking.</h1>
          <p className="muted">
            {removed ?? 0} ingredient{removed === 1 ? '' : 's'} removed from pantry.
          </p>
          <div className="mono small muted">{recipe.title}</div>
          <div className="cook-done-actions">
            <button className="btn btn-primary" onClick={saveFavourite}>
              <Icon name="heart" size={14} /> Save to favourites
            </button>
            <button className="btn btn-ghost" onClick={cookAgain}>
              <Icon name="chef" size={14} /> Cook again
            </button>
            <button className="btn btn-ghost" onClick={() => navigate(`/recipes/${recipe.slug}`)}>
              View recipe
            </button>
            <button className="btn btn-ghost" onClick={() => navigate('/recipes')}>
              Find another
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isLastStep = step >= recipe.steps.length;

  return (
    <div className="screen cook-flow">
      <button className="back-btn" onClick={() => navigate(`/recipes/${recipe.slug}`)}>
        <Icon name="x" size={14} /> Stop cooking
      </button>
      <div className="cook-head">
        <div className="eyebrow">
          Cooking · step {Math.min(step + 1, recipe.steps.length)} of {recipe.steps.length}
        </div>
        <h1>{recipe.title}</h1>
        <div className="cook-progress">
          {recipe.steps.map((_, i) => (
            <div
              key={i}
              className={`cook-progress-bar ${i < step ? 'done' : i === step ? 'active' : ''}`}
            />
          ))}
        </div>
      </div>

      {!isLastStep ? (
        <div className="cook-step">
          <div className="cook-step-top">
            <div className="cook-step-num mono">{step + 1}</div>
            {recipe.steps[step].title && (
              <div className="cook-step-label mono">{recipe.steps[step].title}</div>
            )}
          </div>
          <p>{recipe.steps[step].content}</p>
          <StepIngredients step={recipe.steps[step]} recipe={recipe} pantryIngIds={pantryIngIds} />
          {recipe.steps[step].detail && (
            <p className="cook-step-detail">{recipe.steps[step].detail}</p>
          )}
          {(recipe.steps[step].warnings?.length ?? 0) > 0 &&
            recipe.steps[step].warnings!.map((w, j) => (
              <div key={j} className="cook-callout warn">
                <span className="mono small">careful</span>
                {w}
              </div>
            ))}
          {(recipe.steps[step].tips?.length ?? 0) > 0 &&
            recipe.steps[step].tips!.map((t, j) => (
              <div key={j} className="cook-callout tip">
                <span className="mono small">tip</span>
                {t}
              </div>
            ))}
          {recipe.steps[step].timer_seconds != null && recipe.steps[step].timer_seconds! > 0 && (
            <StepTimer key={step} seconds={recipe.steps[step].timer_seconds!} />
          )}
          <div className="cook-actions">
            {step > 0 && (
              <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>
                Back
              </button>
            )}
            <button
              className="btn btn-primary"
              onClick={() => {
                haptic();
                setStep(step + 1);
              }}
            >
              {step === recipe.steps.length - 1 ? 'Finish' : 'Next step'} <Icon name="arrow" size={14} />
            </button>
          </div>
          <div className="cook-all-steps">
            {recipe.steps.map((s, i) => (
              <div
                key={i}
                className={`cook-step-row ${i === step ? 'active' : i < step ? 'done' : ''}`}
              >
                <span className="mono">{i + 1}</span>
                <span>{s.content}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="cook-remove">
          <h2>Remove used ingredients from pantry?</h2>
          <p className="muted">Tick anything you used up. Keep unticked items that you still have plenty of.</p>
          <ul className="remove-list">
            {recipe.ingredients.map((i) => {
              const inPantry = i.ingredient_id ? pantryIngIds.has(i.ingredient_id) : false;
              const isChecked = i.ingredient_id ? effectiveToRemove.has(i.ingredient_id) : false;
              return (
                <li
                  key={i.ingredient_id ?? i.display}
                  className={!inPantry ? 'muted' : isChecked ? 'active' : ''}
                >
                  <button
                    className="tick"
                    disabled={!inPantry || !i.ingredient_id}
                    aria-pressed={isChecked}
                    aria-label={`Remove ${i.display || i.ingredient_id} from pantry`}
                    onClick={() => i.ingredient_id && toggleRemove(i.ingredient_id)}
                  >
                    {isChecked ? <Icon name="check" size={14} /> : null}
                  </button>
                  <span>{i.display || i.ingredient_id}</span>
                  <span className="mono small muted">{i.amount}</span>
                  {!inPantry && <span className="tag">not in pantry</span>}
                </li>
              );
            })}
          </ul>
          <div className="cook-actions">
            <button className="btn btn-ghost" onClick={() => setStep(recipe.steps.length - 1)}>
              Back
            </button>
            <button className="btn btn-primary" onClick={finish}>
              <Icon name="check" size={14} /> Done cooking
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** "In this step" — the ingredients this step actually uses, with amounts and
 * a tick when they're already in the pantry. Quietly absent on recipes
 * without the guided layer (customs). */
function StepIngredients({
  step,
  recipe,
  pantryIngIds,
}: {
  step: RecipeStep;
  recipe: Recipe;
  pantryIngIds: Set<string>;
}) {
  const ids = step.ingredient_ids ?? [];
  if (ids.length === 0) return null;
  const items = ids
    .map((id) => recipe.ingredients.find((i) => i.ingredient_id === id))
    .filter((i): i is NonNullable<typeof i> => !!i);
  if (items.length === 0) return null;

  return (
    <div className="cook-step-ings">
      <span className="mono small muted">In this step</span>
      <ul>
        {items.map((i) => {
          const have = !!i.ingredient_id && pantryIngIds.has(i.ingredient_id);
          return (
            <li key={i.ingredient_id} className={have ? 'have' : ''}>
              {have && <Icon name="check" size={11} />}
              <span>{i.display || i.ingredient_id}</span>
              {i.amount && <span className="mono small muted">{i.amount}</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
