import { useEffect, useState } from 'react';
import { Icon } from './Icon';

/**
 * PWA install banner. On Chromium it listens for beforeinstallprompt and offers a
 * one-tap install. On iOS Safari (where that event never fires) it shows manual
 * "Add to Home Screen" instructions instead of silently doing nothing. Hidden when
 * already installed; dismissed state persisted for 30 days.
 */

const DISMISS_KEY = '7kc.install-dismissed';
const DISMISS_DAYS = 30;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function InstallPrompt() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || '0');
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_DAYS * 86400 * 1000) return;
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // iOS Safari has no beforeinstallprompt — detect it and show manual instructions.
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const inStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isIOS && !inStandalone) {
      setIosHint(true);
      setVisible(true);
      return;
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  if (iosHint) {
    return (
      <div className="install-banner" role="dialog" aria-label="Install 7KC">
        <div className="install-banner-body">
          <Icon name="share" size={16} />
          <span>
            Install 7KC: tap <b>Share</b>, then <b>Add to Home Screen</b>.
          </span>
        </div>
        <div className="install-banner-actions">
          <button className="chip" onClick={dismiss}>
            Got it
          </button>
        </div>
      </div>
    );
  }

  if (!evt) return null;

  const install = async () => {
    await evt.prompt();
    const r = await evt.userChoice;
    if (r.outcome === 'accepted' || r.outcome === 'dismissed') {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
      setVisible(false);
    }
  };

  return (
    <div className="install-banner" role="dialog" aria-label="Install 7KC">
      <div className="install-banner-body">
        <Icon name="sparkle" size={16} />
        <span>Install 7KC for offline shopping lists &amp; pantry access.</span>
      </div>
      <div className="install-banner-actions">
        <button className="chip" onClick={dismiss}>
          Not now
        </button>
        <button className="chip active" onClick={install}>
          Install
        </button>
      </div>
    </div>
  );
}
