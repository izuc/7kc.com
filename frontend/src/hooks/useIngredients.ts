import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Ingredient } from '../types/models';

export function useIngredients() {
  const { data } = useQuery({
    queryKey: ['ingredients-all'],
    queryFn: () => api.ingredients(),
    staleTime: 60 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
  const items = data?.items ?? [];
  const byId: Record<string, Ingredient> = {};
  for (const i of items) byId[i.id] = i;
  return { items, byId };
}

export function displayFor(byId: Record<string, Ingredient>, ingredientId: string | null | undefined, fallback?: string | null): string {
  if (!ingredientId) return fallback || 'Unknown';
  return byId[ingredientId]?.display || fallback || ingredientId;
}

export function sectionFor(byId: Record<string, Ingredient>, ingredientId: string | null | undefined, fallback: string = 'other'): string {
  if (!ingredientId) return fallback;
  return byId[ingredientId]?.section || fallback;
}
