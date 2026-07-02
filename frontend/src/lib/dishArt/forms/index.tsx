import { DishTemplate } from '../types';
import { BOWLS_FORMS } from './bowls';
import { BOWLS2_FORMS } from './bowls2';
import { PLATES_FORMS } from './plates';
import { HANDHELD_FORMS } from './handheld';
import { HANDHELD2_FORMS } from './handheld2';
import { BAKES_FORMS } from './bakes';
import { SWEETS_FORMS } from './sweets';
import { WORLDLY_FORMS } from './worldly';

/**
 * dish_form token → template, merged from the family registries. Valid tokens
 * are the union of every family map plus (during the migration) the legacy
 * dishArtwork.tsx templates — scripts/validate-recipes.mjs scans both. A form
 * missing here falls back to legacy art in MealPlate, so partial registries
 * are always safe to ship.
 */
export const FORMS: Record<string, DishTemplate> = {
  ...BOWLS_FORMS,
  ...BOWLS2_FORMS,
  ...PLATES_FORMS,
  ...HANDHELD_FORMS,
  ...HANDHELD2_FORMS,
  ...BAKES_FORMS,
  ...SWEETS_FORMS,
  ...WORLDLY_FORMS,
};
