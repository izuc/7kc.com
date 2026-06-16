/**
 * Tiny haptic confirmation for the "wet hands in a supermarket aisle" context.
 * Progressive enhancement: no-ops where the Vibration API is unsupported (iOS,
 * desktop) and respects prefers-reduced-motion.
 */
export function haptic(ms = 10): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    navigator.vibrate(ms);
  } catch {
    /* ignore unsupported / blocked vibration */
  }
}
