import { useEffect, useState } from 'react';
import { Icon } from './Icon';

/**
 * PWA install banner. Listens for beforeinstallprompt (Chromium) and shows a
 * discrete install button. Hidden on iOS / already-installed. Dismissed state
 * persisted so users only see it once per 30 days.
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

  useEffect(() => {
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || '0');
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_DAYS * 86400 * 1000) return;
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  if (!visible || !evt) return null;

  const install = async () => {
    await evt.prompt();
    const r = await evt.userChoice;
    if (r.outcome === 'accepted' || r.outcome === 'dismissed') {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
      setVisible(false);
    }
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  return (
    <div className="install-banner" role="dialog" aria-label="Install 7KC">
      <div className="install-banner-body">
        <Icon name="sparkle" size={16} />
        <span>Install 7KC for offline shopping lists & pantry access.</span>
      </div>
      <div className="install-banner-actions">
        <button className="chip" onClick={dismiss}>Not now</button>
        <button className="chip active" onClick={install}>Install</button>
      </div>
    </div>
  );
}
