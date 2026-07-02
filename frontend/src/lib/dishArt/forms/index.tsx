import { DishTemplate } from '../types';
import { PastaBowl } from './bowls';

/**
 * dish_form token → template. The single source of truth for valid dish_form
 * values (scripts/validate-recipes.mjs parses this map). Forms not yet listed
 * here fall back to the legacy dishArtwork.tsx templates in MealPlate.
 *
 * Keep entries in the literal `'token': (p) => <Component {...p} />` shape —
 * the validator regexes it.
 */
export const FORMS: Record<string, DishTemplate> = {
  'pasta-bowl': (p) => <PastaBowl {...p} />,
};
