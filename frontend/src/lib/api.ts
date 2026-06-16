import type {
  Group,
  Ingredient,
  ParsedItem,
  PantryItem,
  RankedRecipe,
  CookedRecipe,
  Recipe,
  RecipeSummary,
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

  // ingredients
  ingredients: (q?: string) =>
    request<{ items: Ingredient[] }>(`/ingredients${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  parse: (text: string) =>
    request<{ items: ParsedItem[] }>(`/ingredients/parse`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

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
  addListItems: (
    listId: string,
    items: { ingredient_id?: string | null; custom_name?: string | null; section?: string }[]
  ) =>
    request<{ list: ShoppingList }>(`/lists/${listId}/items`, {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),
  deleteListItem: (listId: string, itemId: string) =>
    request<{ ok: boolean }>(`/lists/${listId}/items/${itemId}`, { method: 'DELETE' }),
  toggleBought: (listId: string, itemId: string) =>
    request<{ is_bought: boolean }>(`/lists/${listId}/items/${itemId}/toggle-bought`, { method: 'POST' }),
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
  deletePantryItem: (id: string) =>
    request<{ ok: boolean }>(`/pantry/items/${id}`, { method: 'DELETE' }),
  seedStaples: () =>
    request<{ added: number; items: PantryItem[] }>('/pantry/seed-staples', { method: 'POST' }),

  // recipes
  recipes: (q?: string, tags?: string[]) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (tags && tags.length) params.set('tags', tags.join(','));
    const qs = params.toString();
    return request<{ recipes: RecipeSummary[] }>(`/recipes${qs ? `?${qs}` : ''}`);
  },
  recipe: (slug: string) => request<{ recipe: Recipe }>(`/recipes/${slug}`),
  suggestions: () => request<{ ranked: RankedRecipe[] }>('/recipes/suggestions'),
  cookedRecipes: () => request<{ cooked: CookedRecipe[] }>('/recipes/cooked'),
  createRecipe: (payload: Partial<Recipe> & { title: string }) =>
    request<{ recipe: Recipe }>('/recipes', { method: 'POST', body: JSON.stringify(payload) }),
  cookRecipe: (slug: string, removeIds: string[]) =>
    request<{ cooked_meal_id: string; removed: number }>(`/recipes/${slug}/cook`, {
      method: 'POST',
      body: JSON.stringify({ remove_ingredient_ids: removeIds }),
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
