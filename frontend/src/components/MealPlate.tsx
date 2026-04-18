import { useMemo } from 'react';
import { dishArtworkFor } from '../lib/dishArtwork';
import type { RecipeSummary, Recipe, RecipeIngredient } from '../types/models';

/**
 * Renders a "finished dish" illustration for a recipe. Each recipe slug maps
 * to a dish archetype (pasta bowl, curry, soup, sandwich, tacos, roast, …)
 * which is coloured by the recipe's palette and lightly garnished with 2–3
 * of its primary ingredient icons.
 */

interface Props {
  recipe: (RecipeSummary | Recipe) & {
    ingredient_ids?: string[];
    ingredients?: (RecipeIngredient | { id: string })[];
  };
  size?: number;
  className?: string;
  rounded?: boolean;
  ingredientIds?: string[];
}

export function MealPlate({ recipe, size = 240, className, rounded = true, ingredientIds }: Props) {
  const garnishIds = useMemo(() => {
    if (ingredientIds && ingredientIds.length) return ingredientIds;
    if (recipe.ingredient_ids?.length) return recipe.ingredient_ids;
    return (recipe.ingredients ?? [])
      .map((i) => ('ingredient_id' in i ? i.ingredient_id : (i as { id: string }).id))
      .filter((id): id is string => Boolean(id));
  }, [recipe, ingredientIds]);

  const slug = recipe.slug || recipe.title || 'unknown';
  const palette: [string, string] = (recipe.palette as [string, string]) ?? ['#c89e6b', '#fef3c7'];

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 400 400"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`${recipe.title}`}
      style={{ display: 'block', borderRadius: rounded ? 14 : 0 }}
    >
      <defs>
        <radialGradient id={`bg-${slug}`} cx="50%" cy="40%" r="85%">
          <stop offset="0%" stopColor={palette[1]} stopOpacity={0.9} />
          <stop offset="100%" stopColor={palette[1]} stopOpacity={0.4} />
        </radialGradient>
      </defs>
      <rect width="400" height="400" fill={`url(#bg-${slug})`} />
      {dishArtworkFor(slug, palette, garnishIds)}
    </svg>
  );
}

/** Horizontal band version for suggestion cards (group page). */
export function MealPlateMini({ recipe, size = 140, className, ingredientIds }: Props) {
  const garnishIds = useMemo(() => {
    if (ingredientIds && ingredientIds.length) return ingredientIds;
    if (recipe.ingredient_ids?.length) return recipe.ingredient_ids;
    return (recipe.ingredients ?? [])
      .map((i) => ('ingredient_id' in i ? i.ingredient_id : (i as { id: string }).id))
      .filter((id): id is string => Boolean(id));
  }, [recipe, ingredientIds]);

  const slug = recipe.slug || recipe.title || 'unknown';
  const palette: [string, string] = (recipe.palette as [string, string]) ?? ['#c89e6b', '#fef3c7'];

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 400 400"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={recipe.title}
      style={{ display: 'block' }}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id={`mini-bg-${slug}`} cx="50%" cy="40%" r="85%">
          <stop offset="0%" stopColor={palette[1]} stopOpacity={0.9} />
          <stop offset="100%" stopColor={palette[1]} stopOpacity={0.4} />
        </radialGradient>
      </defs>
      <rect width="400" height="400" fill={`url(#mini-bg-${slug})`} />
      {dishArtworkFor(slug, palette, garnishIds)}
    </svg>
  );
}
