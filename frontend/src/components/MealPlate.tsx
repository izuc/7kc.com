import { memo, useMemo } from 'react';
import { FORMS } from '../lib/dishArt/forms';
import { tonesFor } from '../lib/dishArt/palette';
import { pickToppings } from '../lib/dishArt/toppings';
import type { RecipeSummary, Recipe, RecipeIngredient } from '../types/models';

/**
 * Renders the "finished dish" illustration for a recipe.
 *
 * dish_form → template from the dishArt v2 registry (ink & cream language,
 * seeded per-recipe variation, ingredient-derived toppings). Unknown forms fall
 * back to the v2 default plate (see docs/DISH-ART-PLAN.md).
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
  /** MealPlateMini crops edge-to-edge instead of fitting */
  slice?: boolean;
}

function useGarnishIds(recipe: Props['recipe'], ingredientIds?: string[]): string[] {
  return useMemo(() => {
    if (ingredientIds && ingredientIds.length) return ingredientIds;
    if (recipe.ingredient_ids?.length) return recipe.ingredient_ids;
    return (recipe.ingredients ?? [])
      .map((i) => ('ingredient_id' in i ? i.ingredient_id : (i as { id: string }).id))
      .filter((id): id is string => Boolean(id));
  }, [recipe, ingredientIds]);
}

function PlateSvg({ recipe, size = 240, className, rounded = true, ingredientIds, slice = false }: Props) {
  const garnishIds = useGarnishIds(recipe, ingredientIds);
  const slug = recipe.slug || recipe.title || 'unknown';
  const palette: [string, string] = (recipe.palette as [string, string]) ?? ['#c89e6b', '#fef3c7'];

  // Unknown/missing dish_form (e.g. user-created recipes) → the v2 default plate.
  const template = FORMS[recipe.dish_form ?? ''] ?? FORMS['default-plate'];
  const art = template({ tones: tonesFor(palette), slug, toppingIds: pickToppings(garnishIds), size });

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 400 400"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`${recipe.title}`}
      style={{ display: 'block', borderRadius: rounded && !slice ? 14 : 0 }}
      preserveAspectRatio={slice ? 'xMidYMid slice' : undefined}
    >
      {art}
    </svg>
  );
}

export const MealPlate = memo(function MealPlate(props: Props) {
  return <PlateSvg {...props} />;
});

/** Horizontal band version for suggestion cards (group page). */
export const MealPlateMini = memo(function MealPlateMini({ size = 140, ...rest }: Props) {
  return <PlateSvg {...rest} size={size} rounded={false} slice />;
});
