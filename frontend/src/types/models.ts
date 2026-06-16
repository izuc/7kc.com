export type Section = 'produce' | 'meat' | 'dairy' | 'pantry' | 'frozen' | 'other';

export interface User {
  id: string;
  email: string;
  display_name: string | null;
  group_id: string | null;
  diet?: string[];
}

export interface DietFlags {
  vegetarian: boolean;
  vegan: boolean;
  dairy_free: boolean;
  gluten_free: boolean;
  nut_free: boolean;
}

export interface Ingredient {
  id: string;
  display: string;
  section: Section;
  shelf_life_days: number;
}

export interface ListItem {
  id: string;
  list_id: string;
  ingredient_id: string | null;
  custom_name: string | null;
  section: Section;
  note: string | null;
  is_bought: boolean;
  bought_by_user_id: string | null;
  bought_at: number | null;
  added_by_user_id: string;
  added_at: number;
  moved_to_pantry: boolean;
  sort_order: number;
}

export interface ShoppingList {
  id: string;
  name: string;
  owner_user_id: string;
  group_id: string | null;
  created_at: number;
  archived_at: number | null;
  items: ListItem[];
}

export interface PantryItem {
  id: string;
  owner_user_id: string;
  group_id: string | null;
  ingredient_id: string | null;
  custom_name: string | null;
  added_at: number;
  expires_at: number | null;
  running_low: boolean;
  notes: string | null;
}

export interface RecipeSummary {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  prep_time: number;
  cook_time: number;
  servings: number;
  tags: string[];
  palette: [string, string];
  image_url: string | null;
  sponsored_by?: string | null;
  /** diet flags derived from the recipe's ingredients (authoritative) */
  diet?: DietFlags;
  is_custom: boolean;
  owner_user_id: string | null;
  group_id: string | null;
  /** present on list responses, used by <MealPlate> */
  ingredient_ids?: string[];
}

export interface RecipeIngredient {
  ingredient_id: string | null;
  display: string | null;
  section: Section | null;
  amount: string | null;
  is_optional: boolean;
}

export interface RecipeStep {
  content: string;
  detail?: string | null;
  timer_seconds: number | null;
}

export interface Recipe extends RecipeSummary {
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
}

export interface RankedRecipe {
  recipe: RecipeSummary;
  pantry_match: number;
  have_ingredient_ids: string[];
  missing_ingredient_ids: string[];
  expiring_hits: number;
  score: number;
}

export interface CookedRecipe {
  recipe: RecipeSummary;
  cooked_count: number;
  last_cooked: number;
}

export interface GroupMember {
  user_id: string;
  role: string;
  joined_at: number;
  display_name: string;
  color: string | null;
}

export interface Group {
  id: string;
  name: string;
  owner_user_id: string;
  invite_token: string;
  created_at: number;
  members: GroupMember[];
}

export interface Suggestion {
  id: string;
  group_id: string;
  suggested_by: string;
  recipe_id: string | null;
  recipe_title: string;
  suggested_for_date: string | null;
  created_at: number;
  cooked_meal_id: string | null;
  likes: string[];
  comments: { id: string; user_id: string; content: string; created_at: number }[];
}

export interface FeedEvent {
  id: string;
  group_id: string;
  user_id: string;
  kind: string;
  payload: Record<string, unknown>;
  created_at: number;
}

export interface ParsedItem {
  raw: string;
  clean: string;
  match: { id: string; display: string; section: Section; confidence?: 'confident' | 'maybe' } | null;
}

export interface RecipeDraft {
  title: string;
  description: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  source: string | null;
  image_url: string | null;
  ingredients: ParsedItem[];
  steps: { content: string }[];
}

export interface NewRecipePayload {
  title: string;
  description?: string;
  prep_time?: number;
  cook_time?: number;
  servings?: number;
  tags?: string[];
  source?: string | null;
  image_url?: string | null;
  share_with_group?: boolean;
  ingredients?: { ingredient_id?: string | null; amount?: string | null; is_optional?: boolean }[];
  steps?: { content: string }[];
}
