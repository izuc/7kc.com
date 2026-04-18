/**
 * Plausible analytics loader. No-op unless VITE_PLAUSIBLE_DOMAIN is set.
 * Injects the script once; exposes trackEvent() for custom events.
 */

const domain = import.meta.env.VITE_PLAUSIBLE_DOMAIN as string | undefined;
const src = (import.meta.env.VITE_PLAUSIBLE_SRC as string | undefined) || 'https://plausible.io/js/script.js';

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string | number | boolean> }) => void;
  }
}

let loaded = false;

export function initAnalytics() {
  if (loaded || !domain) return;
  loaded = true;
  const s = document.createElement('script');
  s.defer = true;
  s.dataset.domain = domain;
  s.src = src;
  document.head.appendChild(s);

  // queue stub so trackEvent works before script loads
  if (!window.plausible) {
    window.plausible = function (...args) {
      (window.plausible as any).q = (window.plausible as any).q || [];
      (window.plausible as any).q.push(args);
    };
  }
}

export function trackEvent(name: string, props?: Record<string, string | number | boolean>) {
  if (!window.plausible) return;
  window.plausible(name, props ? { props } : undefined);
}
