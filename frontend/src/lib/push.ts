import { api } from './api';

// Web Push enable/disable, capability-guarded like haptics.ts — a clean no-op/false
// where unsupported (iOS Safari outside an installed PWA has no PushManager).

export function pushSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    typeof window !== 'undefined' &&
    'PushManager' in window &&
    'Notification' in window
  );
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  // Back with an explicit ArrayBuffer so the type is a BufferSource (TS 5.7 strictness).
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export type PushEnableResult = 'enabled' | 'denied' | 'unavailable';

/** Subscribe to push. Checks the server VAPID key BEFORE prompting, so an
 *  unconfigured server never shows a permission dialog that then fails. */
export async function enablePush(): Promise<PushEnableResult> {
  if (!pushSupported()) return 'unavailable';
  try {
    const reg = await navigator.serviceWorker.ready;

    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      await api.pushSubscribe(existing.toJSON());
      return 'enabled';
    }

    const { key } = await api.getVapidKey();
    if (!key) return 'unavailable'; // server hasn't configured VAPID — don't prompt

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return 'denied';

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    });
    await api.pushSubscribe(sub.toJSON());
    return 'enabled';
  } catch {
    return 'unavailable';
  }
}

export async function disablePush(): Promise<void> {
  if (!pushSupported()) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      try {
        await api.pushUnsubscribe(sub.endpoint);
      } finally {
        await sub.unsubscribe();
      }
    }
  } catch {
    /* ignore */
  }
}

export async function isPushEnabled(): Promise<boolean> {
  if (!pushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    return Boolean(await reg.pushManager.getSubscription());
  } catch {
    return false;
  }
}
