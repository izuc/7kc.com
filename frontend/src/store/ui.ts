import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Accent = 'terracotta' | 'sage' | 'ink' | 'plum';
export type Density = 'compact' | 'roomy';

interface UiState {
  accent: Accent;
  density: Density;
  toasts: { id: number; text: string }[];
  setAccent: (a: Accent) => void;
  setDensity: (d: Density) => void;
  toast: (text: string) => void;
  dismissToast: (id: number) => void;
}

export const useUi = create<UiState>()(
  persist(
    (set, get) => ({
      accent: 'terracotta',
      density: 'roomy',
      toasts: [],
      setAccent: (accent) => set({ accent }),
      setDensity: (density) => set({ density }),
      toast: (text) => {
        const id = Date.now() + Math.random();
        set({ toasts: [...get().toasts, { id, text }] });
        setTimeout(() => get().dismissToast(id), 2500);
      },
      dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
    }),
    {
      name: '7kc-ui',
      partialize: (s) => ({ accent: s.accent, density: s.density }),
    }
  )
);
