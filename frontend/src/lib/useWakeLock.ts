import { useEffect, useRef } from 'react';

// Keep the screen awake while `active` (e.g. mid-cook). Progressive enhancement:
// feature-detected, every call wrapped in try/catch, and a clean no-op where the
// Screen Wake Lock API is missing (iOS < 16.4, non-secure contexts, etc.).
//
// The browser auto-releases the sentinel whenever the tab is hidden (and fires a
// `release` event), so we drop our reference then and re-acquire on the next
// `visibilitychange` → visible. Always released on deactivate/unmount.

interface WakeLockSentinelLike {
  release: () => Promise<void>;
  addEventListener?: (type: 'release', listener: () => void, opts?: { once?: boolean }) => void;
}
interface WakeLockNavigator {
  wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> };
}

export function useWakeLock(active: boolean): void {
  const sentinel = useRef<WakeLockSentinelLike | null>(null);

  useEffect(() => {
    if (!active || typeof navigator === 'undefined') return;
    const wl = (navigator as Navigator & WakeLockNavigator).wakeLock;
    if (!wl) return; // unsupported → no-op

    let cancelled = false;
    let acquiring = false; // in-flight guard: only one request pending at a time

    const request = async () => {
      if (cancelled || acquiring || sentinel.current || document.visibilityState !== 'visible') return;
      acquiring = true;
      try {
        const s = await wl.request('screen');
        if (cancelled) {
          void s.release().catch(() => {});
          return;
        }
        sentinel.current = s;
        // Browser auto-releases on tab hide — clear our stale ref so we re-acquire on return.
        s.addEventListener?.(
          'release',
          () => {
            if (sentinel.current === s) sentinel.current = null;
          },
          { once: true }
        );
      } catch {
        /* rejected (tab hidden, low battery, blocked) — ignore */
      } finally {
        acquiring = false;
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void request();
    };

    void request();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      const s = sentinel.current;
      sentinel.current = null;
      if (s) void s.release().catch(() => {});
    };
  }, [active]);
}
