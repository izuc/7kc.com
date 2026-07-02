/**
 * Dish artwork v2 — shared visual constants ("Ink & Cream" language).
 * See docs/DISH-ART-PLAN.md. Every dish is drawn with the app's warm ink line
 * over cream vessels, coloured by a 4-tone ramp derived from recipe.palette[0].
 */

/** The app ink — outlines everywhere, same as the UI chrome. */
export const INK = '#3f2410';

/** Vessel faces. */
export const PLATE_FACE = '#fffdf8';
export const PLATE_RIM = '#efdcc4';
export const CREAM_FOOD = '#fdf6e2';
export const PASTA_GOLD = '#f4cf72';
export const PASTA_DARK = '#dfa93c';
export const PASTA_LIGHT = '#fbe8b0';
export const BREAD_CRUST = '#d9a05b';
export const BREAD_CRUMB = '#f3ddb5';
export const HERB_GREEN = '#557c1e';
export const LEAF_DARK = '#3f6016';
export const CHAR = '#7c4a12';

/**
 * Stroke-width hierarchy (in the 400-box): macro silhouettes 6, toppings 4.5,
 * micro marks 3.5. At a 96px card that's ~1.4px for macro — still crisp; below
 * ~96px forms should drop micro detail (see DishProps.size).
 */
export const SW = { macro: 6, topping: 4.5, micro: 3.5 } as const;

/** Sizes below this get the simplified variant (fewer micro-elements). */
export const SIMPLIFY_BELOW = 96;
