import { ReactNode } from 'react';
import { Tones } from './palette';

/** Everything a dish template needs. Rendered inside a 400×400 viewBox. */
export interface DishProps {
  /** 4-tone food ramp + card wash colours derived from recipe.palette */
  tones: Tones;
  /** recipe slug — the seed for ALL per-recipe variation */
  slug: string;
  /** visually expressive ingredient ids picked from the recipe (max 4) */
  toppingIds: string[];
  /** rendered pixel size — below SIMPLIFY_BELOW, drop micro-detail */
  size: number;
}

export type DishTemplate = (p: DishProps) => ReactNode;
