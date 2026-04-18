import { useMemo } from 'react';
import { ingredientIcon } from '../lib/ingredientIcons';
import { useIngredients } from '../hooks/useIngredients';
import type { RecipeSummary, Recipe, RecipeIngredient } from '../types/models';

/**
 * Composes a flat-illustrated "meal on a plate" from a recipe's ingredients.
 *
 * The plate is a single SVG at 0..400 viewBox. Up to 6 primary ingredients
 * are stamped into deterministic slot positions, ordered by their appearance
 * in the recipe. Placement uses a tiny hash of recipe.slug + index so the
 * composition is stable between renders but varies recipe-to-recipe.
 */

interface Props {
  recipe: (RecipeSummary | Recipe) & { ingredients?: (RecipeIngredient | { id: string })[] };
  size?: number;
  max?: number;
  className?: string;
  rounded?: boolean;
  /** ingredient ids in priority order; overrides recipe.ingredients */
  ingredientIds?: string[];
}

// six composition slots around/across the plate, in priority order.
const SLOTS = [
  { cx: 210, cy: 205, scale: 1.3 }, // hero center
  { cx: 128, cy: 162, scale: 1.05 }, // upper-left
  { cx: 284, cy: 168, scale: 1.1 },  // upper-right
  { cx: 310, cy: 244, scale: 0.95 }, // lower-right
  { cx: 112, cy: 250, scale: 1.0 },  // lower-left
  { cx: 212, cy: 292, scale: 0.9 },  // bottom-center
];

function hashSlug(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function MealPlate({ recipe, size = 240, max = 6, className, rounded = true, ingredientIds }: Props) {
  const { byId } = useIngredients();

  const chosen = useMemo(() => {
    const source = ingredientIds ?? ((recipe.ingredients ?? []).map((i) => ('ingredient_id' in i ? i.ingredient_id : (i as { id: string }).id)));
    return source.filter((id): id is string => Boolean(id)).slice(0, max);
  }, [recipe, ingredientIds, max]);

  const slug = recipe.slug || recipe.title || 'unknown';
  const seed = hashSlug(slug);

  const plateFill = recipe.palette?.[1] ?? '#fef3c7';
  const plateRim = recipe.palette?.[0] ?? '#c89e6b';

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 400 400"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`${recipe.title} on a plate`}
      style={{ display: 'block', borderRadius: rounded ? 14 : 0 }}
    >
      <defs>
        <radialGradient id={`bg-${slug}`} cx="50%" cy="40%" r="80%">
          <stop offset="0%" stopColor={plateFill} stopOpacity={0.95} />
          <stop offset="100%" stopColor={plateFill} stopOpacity={0.55} />
        </radialGradient>
        <radialGradient id={`plate-${slug}`} cx="50%" cy="42%" r="55%">
          <stop offset="0%" stopColor="#fefbf2" />
          <stop offset="80%" stopColor="#f5ead1" />
          <stop offset="100%" stopColor="#e8d9b3" />
        </radialGradient>
      </defs>

      {/* background wash */}
      <rect width="400" height="400" fill={`url(#bg-${slug})`} />

      {/* plate shadow */}
      <ellipse cx="212" cy="228" rx="160" ry="154" fill="rgba(60,30,10,0.12)" />

      {/* plate */}
      <circle cx="210" cy="220" r="158" fill={`url(#plate-${slug})`} stroke={plateRim} strokeWidth={2} strokeOpacity={0.35} />
      <circle cx="210" cy="220" r="144" fill="none" stroke={plateRim} strokeWidth={1} strokeOpacity={0.22} />
      <circle cx="210" cy="220" r="120" fill="none" stroke={plateRim} strokeWidth={0.6} strokeOpacity={0.18} />

      {/* ingredients */}
      {chosen.map((id, i) => {
        const slot = SLOTS[i] ?? SLOTS[SLOTS.length - 1];
        // small stable jitter per ingredient so multi-recipes don't look identical
        const jx = (((seed >> (i * 3)) & 0xff) / 255 - 0.5) * 22;
        const jy = (((seed >> (i * 5 + 2)) & 0xff) / 255 - 0.5) * 22;
        const rot = (((seed >> (i * 7 + 3)) & 0xff) / 255 - 0.5) * 24;
        const cx = slot.cx + jx;
        const cy = slot.cy + jy;
        const iconSize = 88 * slot.scale;
        const section = byId[id]?.section ?? 'other';
        return (
          <g
            key={`${id}-${i}`}
            transform={`translate(${cx - iconSize / 2} ${cy - iconSize / 2}) rotate(${rot} ${iconSize / 2} ${iconSize / 2}) scale(${iconSize / 100})`}
          >
            {ingredientIcon(id, section)}
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Smaller version for list-style cards. Shows 3 primary ingredients in a
 * horizontal band. Fast to render in long grids.
 */
export function MealPlateMini({ recipe, size = 140, className }: Props) {
  const { byId } = useIngredients();
  const chosen = useMemo(() => {
    const source = (recipe.ingredients ?? []).map((i) => ('ingredient_id' in i ? i.ingredient_id : (i as { id: string }).id));
    return source.filter((id): id is string => Boolean(id)).slice(0, 3);
  }, [recipe]);

  const slug = recipe.slug || recipe.title || 'unknown';
  const plateFill = recipe.palette?.[1] ?? '#fef3c7';
  const plateRim = recipe.palette?.[0] ?? '#c89e6b';

  return (
    <svg
      className={className}
      width="100%"
      height={size}
      viewBox="0 0 300 180"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`${recipe.title}`}
      style={{ display: 'block' }}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id={`mini-bg-${slug}`} cx="50%" cy="40%" r="80%">
          <stop offset="0%" stopColor={plateFill} stopOpacity={0.95} />
          <stop offset="100%" stopColor={plateFill} stopOpacity={0.5} />
        </radialGradient>
        <radialGradient id={`mini-plate-${slug}`} cx="50%" cy="42%" r="55%">
          <stop offset="0%" stopColor="#fefbf2" />
          <stop offset="85%" stopColor="#f5ead1" />
          <stop offset="100%" stopColor="#e8d9b3" />
        </radialGradient>
      </defs>
      <rect width="300" height="180" fill={`url(#mini-bg-${slug})`} />
      <ellipse cx="151" cy="104" rx="110" ry="74" fill="rgba(60,30,10,0.1)" />
      <ellipse cx="150" cy="100" rx="110" ry="74" fill={`url(#mini-plate-${slug})`} stroke={plateRim} strokeWidth={1.5} strokeOpacity={0.35} />
      <ellipse cx="150" cy="100" rx="92" ry="60" fill="none" stroke={plateRim} strokeWidth={0.8} strokeOpacity={0.2} />
      {chosen.map((id, i) => {
        const x = 90 + i * 60;
        const y = 90;
        const section = byId[id]?.section ?? 'other';
        const iconSize = 80;
        return (
          <g key={`${id}-${i}`} transform={`translate(${x - iconSize / 2} ${y - iconSize / 2}) scale(${iconSize / 100})`}>
            {ingredientIcon(id, section)}
          </g>
        );
      })}
    </svg>
  );
}
