import type {
  Group,
  Ingredient,
  ParsedItem,
  PantryItem,
  RankedRecipe,
  CookedRecipe,
  Recipe,
  RecipeSummary,
  RecipeComment,
  RecipeDraft,
  NewRecipePayload,
  MealPlanWeek,
  MealPlanEntry,
  ShoppingList,
  Suggestion,
  User,
  FeedEvent,
} from '../types/models';

const BASE = import.meta.env.VITE_API_URL || '/api/v1';
const TOKEN_KEY = '7kc.token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t: string | null) {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, msg: string) {
    super(msg);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers = new Headers(opts.headers);
  if (opts.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const resp = await fetch(BASE + path, { ...opts, headers });
  const isJson = (resp.headers.get('Content-Type') || '').includes('application/json');
  const body = isJson ? await resp.json().catch(() => ({})) : null;
  if (!resp.ok) {
    if (resp.status === 401 && typeof window !== 'undefined') {
      setToken(null);
      window.dispatchEvent(new Event('7kc:unauthorized'));
    }
    throw new ApiError(resp.status, body?.error || 'error', body?.message || resp.statusText);
  }
  return (body as T) ?? ({} as T);
}

export const api = {
  // auth
  register: (email: string, password: string, displayName?: string) =>
    request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, display_name: displayName }),
    }),
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<User>('/auth/me'),
  setDiet: (diet: string[]) =>
    request<{ diet: string[] }>('/auth/diet', { method: 'POST', body: JSON.stringify({ diet }) }),
  deleteAccount: () => request<{ ok: boolean }>('/auth/me', { method: 'DELETE' }),
  exportData: () => request<Record<string, unknown>>('/auth/me/export'),
  signOutEverywhere: () => request<{ ok: boolean }>('/auth/sign-out-everywhere', { method: 'POST' }),
  setDigestOptin: (enabled: boolean) =>
    request<{ digest_optin: boolean }>('/auth/digest-optin', { method: 'POST', body: JSON.stringify({ enabled }) }),

  // web push
  getVapidKey: () => request<{ key: string | null }>('/push/key'),
  pushSubscribe: (subscription: unknown) =>
    request<{ ok: boolean }>('/push/subscribe', { method: 'POST', body: JSON.stringify({ subscription }) }),
  pushUnsubscribe: (endpoint: string) =>
    request<{ ok: boolean }>('/push/unsubscribe', { method: 'POST', body: JSON.stringify({ endpoint }) }),

  // server feature flags (e.g. whether AI photo scanning is configured in .env)
  config: () => request<{ features: { ai_scan: boolean; ai_scan_tiles: number } }>('/config'),

  // ingredients
  ingredients: (q?: string) =>
    request<{ items: Ingredient[] }>(`/ingredients${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  parse: (text: string) =>
    request<{ items: ParsedItem[] }>(`/ingredients/parse`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
  // Send a base64 image data URL to the server's configured vision LLM; returns its transcription.
  scanImage: (image: string) =>
    request<{ text: string }>(`/ingredients/scan-image`, {
      method: 'POST',
      body: JSON.stringify({ image }),
    }),
  // Send fridge/pantry photo tiles; the server detects items per tile and returns a merged, deduped list.
  scanPantry: (images: string[]) =>
    request<{ items: string[]; text: string }>(`/ingredients/scan-pantry`, {
      method: 'POST',
      body: JSON.stringify({ images }),
    }),
  dictionary: () =>
    request<{ ingredients: { id: string; display: string; section: string }[]; aliases: Record<string, string> }>(
      '/ingredients/dictionary'
    ),

  // lists
  lists: () => request<{ lists: ShoppingList[] }>('/lists'),
  createList: (name: string, shareWithGroup = false) =>
    request<{ list: ShoppingList }>('/lists', {
      method: 'POST',
      body: JSON.stringify({ name, share_with_group: shareWithGroup }),
    }),
  getList: (id: string) => request<{ list: ShoppingList }>(`/lists/${id}`),
  renameList: (id: string, name: string) =>
    request<{ list: ShoppingList }>(`/lists/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    }),
  archiveList: (id: string, archived: boolean) =>
    request<{ list: ShoppingList }>(`/lists/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ archived }),
    }),
  // Permanent, non-reversible delete (distinct from archive) — for lists added by mistake.
  deleteListPermanently: (id: string) =>
    request<{ ok: boolean }>(`/lists/${id}/permanent`, { method: 'DELETE' }),
  addListItems: (
    listId: string,
    items: { ingredient_id?: string | null; custom_name?: string | null; section?: string }[]
  ) =>
    request<{ list: ShoppingList; added: string[] }>(`/lists/${listId}/items`, {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),
  deleteListItem: (listId: string, itemId: string) =>
    request<{ ok: boolean }>(`/lists/${listId}/items/${itemId}`, { method: 'DELETE' }),
  toggleBought: (listId: string, itemId: string, target?: boolean) =>
    request<{ is_bought: boolean }>(`/lists/${listId}/items/${itemId}/toggle-bought`, {
      method: 'POST',
      ...(target === undefined ? {} : { body: JSON.stringify({ is_bought: target }) }),
    }),
  markAllBought: (listId: string) =>
    request<{ marked: number }>(`/lists/${listId}/mark-all-bought`, { method: 'POST' }),
  moveBoughtToPantry: (listId: string, exclude: string[] = []) =>
    request<{ moved: number }>(`/lists/${listId}/move-bought-to-pantry`, {
      method: 'POST',
      body: JSON.stringify({ exclude_item_ids: exclude }),
    }),
  restockList: (listId: string) =>
    request<{ list: ShoppingList; added: number }>(`/lists/${listId}/restock`, { method: 'POST' }),

  // pantry
  pantry: () => request<{ items: PantryItem[] }>('/pantry'),
  addPantryItem: (payload: {
    ingredient_id?: string | null;
    custom_name?: string | null;
    expires_at?: number | null;
    running_low?: boolean;
  }) =>
    request<{ item: PantryItem }>('/pantry/items', { method: 'POST', body: JSON.stringify(payload) }),
  updatePantryItem: (
    id: string,
    payload: { expires_at?: number | null; running_low?: boolean; notes?: string | null }
  ) =>
    request<{ item: PantryItem }>(`/pantry/items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deletePantryItem: (id: string, reason?: string) =>
    request<{ ok: boolean }>(`/pantry/items/${id}${reason ? `?reason=${reason}` : ''}`, {
      method: 'DELETE',
    }),
  seedStaples: () =>
    request<{ added: number; items: PantryItem[] }>('/pantry/seed-staples', { method: 'POST' }),
  stats: () =>
    request<{
      stats: {
        rescued: number;
        tossed: number;
        rescue_rate: number | null;
        meals_this_week: number;
        since: number;
      };
    }>('/stats'),

  // recipes
  recipes: (q?: string, tags?: string[]) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (tags && tags.length) params.set('tags', tags.join(','));
    const qs = params.toString();
    return request<{ recipes: RecipeSummary[] }>(`/recipes${qs ? `?${qs}` : ''}`);
  },
  recipe: (slug: string) => request<{ recipe: Recipe }>(`/recipes/${slug}`),
  collection: (tag: string) =>
    request<{ tag: string; recipes: RecipeSummary[] }>(`/public/collections/${encodeURIComponent(tag)}`),
  // The whole public catalogue (no auth) — /browse and the landing showcase.
  publicRecipes: () => request<{ recipes: RecipeSummary[] }>(`/public/recipes`),
  suggestions: () => request<{ ranked: RankedRecipe[] }>('/recipes/suggestions'),
  cookedRecipes: () => request<{ cooked: CookedRecipe[] }>('/recipes/cooked'),
  favouriteRecipes: () => request<{ recipes: RecipeSummary[] }>('/recipes/favourites'),
  toggleFavourite: (slug: string) =>
    request<{ favourited: boolean }>(`/recipes/${slug}/favourite`, { method: 'POST' }),
  createRecipe: (payload: NewRecipePayload) =>
    request<{ recipe: Recipe }>('/recipes', { method: 'POST', body: JSON.stringify(payload) }),
  importRecipe: (url: string) =>
    request<{ draft: RecipeDraft }>('/recipes/import', { method: 'POST', body: JSON.stringify({ url }) }),
  cookRecipe: (slug: string, removeIds: string[]) =>
    request<{ cooked_meal_id: string; removed: number }>(`/recipes/${slug}/cook`, {
      method: 'POST',
      body: JSON.stringify({ remove_ingredient_ids: removeIds }),
    }),
  recipeComments: (slug: string) =>
    request<{ comments: RecipeComment[] }>(`/recipes/${slug}/comments`),
  addRecipeComment: (slug: string, content: string) =>
    request<{ comments: RecipeComment[] }>(`/recipes/${slug}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  deleteRecipeComment: (slug: string, id: string) =>
    request<{ ok: boolean }>(`/recipes/${slug}/comments/${id}`, { method: 'DELETE' }),

  // meal plan — a day holds any number of meals; entries are addressed by id
  getMealPlan: (weekStart: string) =>
    request<MealPlanWeek>(`/meal-plan?week_start=${encodeURIComponent(weekStart)}`),
  addMealPlan: (date: string, recipeSlug: string, label?: string | null) =>
    request<{ entry: MealPlanEntry }>('/meal-plan', {
      method: 'POST',
      body: JSON.stringify({ date, recipe_slug: recipeSlug, label: label ?? undefined }),
    }),
  updateMealPlanEntry: (id: string, recipeSlug: string, label?: string | null) =>
    request<{ entry: { id: string } }>(`/meal-plan/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ recipe_slug: recipeSlug, label: label ?? undefined }),
    }),
  removeMealPlanEntry: (id: string) =>
    request<{ ok: boolean }>(`/meal-plan/${id}`, { method: 'DELETE' }),
  buildListFromWeek: (weekStart: string) =>
    request<{ list: ShoppingList; added: number }>('/meal-plan/build-list', {
      method: 'POST',
      body: JSON.stringify({ week_start: weekStart }),
    }),

  // groups
  createGroup: (name: string) =>
    request<{ group: Group }>('/groups', { method: 'POST', body: JSON.stringify({ name }) }),
  myGroup: () => request<{ group: Group | null }>('/groups/mine'),
  resolveInvite: (token: string) =>
    request<{ invite: { group_name: string; member_count: number; inviter: string | null } }>(
      `/public/groups/${encodeURIComponent(token)}`
    ),
  joinGroup: (token: string) =>
    request<{ group: Group }>('/groups/join', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),
  leaveGroup: () => request<{ ok: boolean }>('/groups/leave', { method: 'POST' }),
  feed: () => request<{ feed: FeedEvent[] }>('/groups/feed'),
  unreadFeed: () => request<{ unread: number }>('/groups/unread'),
  markFeedSeen: () => request<{ ok: boolean }>('/groups/feed/seen', { method: 'POST' }),
  listSuggestions: () => request<{ suggestions: Suggestion[] }>('/groups/suggestions'),
  createSuggestion: (payload: { recipe_slug?: string; recipe_title?: string; suggested_for_date?: string }) =>
    request<{ suggestions: Suggestion[] }>('/groups/suggestions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  likeSuggestion: (id: string) =>
    request<{ liked: boolean }>(`/groups/suggestions/${id}/like`, { method: 'POST' }),
  commentSuggestion: (id: string, content: string) =>
    request<{ comment_id: string }>(`/groups/suggestions/${id}/comment`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
};
