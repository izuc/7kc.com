import type { Recipe } from '../types/models';

/**
 * Kitchen-context blocks for the recipe detail pages (authed + public).
 * All fields are optional (custom recipes have none) — each block renders
 * nothing when its data is absent, so pages can include them unconditionally.
 */

/** "You'll need" (equipment) + "Easy swaps" (substitutions) — lives under the ingredients column. */
export function KitchenPanel({ recipe }: { recipe: Recipe }) {
  const equipment = recipe.equipment ?? [];
  const subs = recipe.substitutions ?? [];
  if (equipment.length === 0 && subs.length === 0) return null;

  const nameFor = (id: string) =>
    recipe.ingredients.find((i) => i.ingredient_id === id)?.display ?? id.replace(/_/g, ' ');

  return (
    <div className="kitchen-panel">
      {equipment.length > 0 && (
        <div>
          <h3>You&rsquo;ll need</h3>
          <ul className="equipment-list">
            {equipment.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}
      {subs.length > 0 && (
        <div>
          <h3>Easy swaps</h3>
          <ul className="swap-list">
            {subs.map((s) => (
              <li key={s.ingredient_id}>
                <span className="swap-from">{nameFor(s.ingredient_id)}</span>
                <span className="swap-arrow" aria-hidden>
                  →
                </span>
                <span className="swap-to">{s.swap}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Make ahead / storage / leftovers — quiet card after the method. */
export function GoodToKnow({ recipe }: { recipe: Recipe }) {
  const rows = [
    { label: 'Make ahead', text: recipe.make_ahead },
    { label: 'Keeping it', text: recipe.storage },
    { label: 'Leftovers', text: recipe.leftovers },
  ].filter((r): r is { label: string; text: string } => !!r.text);
  if (rows.length === 0) return null;

  return (
    <div className="good-to-know">
      <h3>Good to know</h3>
      <dl>
        {rows.map((r) => (
          <div key={r.label} className="gtk-row">
            <dt className="mono small">{r.label}</dt>
            <dd>{r.text}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
