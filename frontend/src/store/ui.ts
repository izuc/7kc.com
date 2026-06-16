import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Accent = 'terracotta' | 'sage' | 'ink' | 'plum';
export type Density = 'compact' | 'roomy';

export interface ToastAction {
  label: string;
  run: () => void;
}

interface UiState {
  accent: Accent;
  density: Density;
  toasts: { id: number; text: string; action?: ToastAction }[];
  setAccent: (a: Accent) => void;
  setDensity: (d: Density) => void;
  toast: (text: string, action?: ToastAction, durationMs?: number) => void;
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
      toast: (text, action, durationMs) => {
        const id = Date.now() + Math.random();
        set({ toasts: [...get().toasts, { id, text, action }] });
        setTimeout(() => get().dismissToast(id), durationMs ?? 2500);
      },
      dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
    }),
    {
      name: '7kc-ui',
      partialize: (s) => ({ accent: s.accent, density: s.density }),
    }
  )
);
