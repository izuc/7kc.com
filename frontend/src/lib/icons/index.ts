import { ReactNode } from 'react';
import { PRODUCE_ICONS } from './produce';
import { PROTEIN_ICONS } from './protein';
import { PANTRY_ICONS } from './pantry';
import { DAIRY_ICONS } from './dairy';

/**
 * Ingredient icon v2 overrides (Ink & Cream language). Checked BEFORE the
 * legacy ICONS map in ingredientIcons.tsx, so icons migrate incrementally —
 * see docs/DISH-ART-PLAN.md phase 4.
 */
export const ICON_OVERRIDES: Record<string, () => ReactNode> = {
  ...PRODUCE_ICONS,
  ...PROTEIN_ICONS,
  ...PANTRY_ICONS,
  ...DAIRY_ICONS,
};
