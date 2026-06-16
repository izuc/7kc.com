import { useState } from 'react';
import { Modal } from './Modal';
import { trackEvent } from '../lib/analytics';

const LS_KEY = '7kc.tour-seen';

const STEPS = [
  {
    eyebrow: 'Welcome',
    title: 'Your kitchen runs in a loop',
    body: 'Plan from what you own, shop the gaps, then top up your pantry. Do it once and recipes start ranking themselves by what you can actually cook.',
  },
  {
    eyebrow: 'Step 2',
    title: 'Tick things off as you shop',
    body: 'On the Shopping tab, tap each item into your trolley as you buy it. Hold to undo if you mis-tap.',
  },
  {
    eyebrow: "Don't miss this",
    title: 'Move bought items to your pantry',
    body: 'After shopping, hit “Move to pantry” under In the trolley. That stocks your pantry so Recipes can rank dinner by what you actually have — skip it and the loop never closes.',
  },
];

/** One-time, skippable first-run tour. Centered cards (layout/route-agnostic) rather
 * than fragile element-anchored coachmarks. Gated on localStorage; fails safe. */
export function TourOverlay() {
  const [open, setOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LS_KEY) !== '1';
    } catch {
      return false;
    }
  });
  const [i, setI] = useState(0);

  if (!open) return null;
  const step = STEPS[i];
  const isLast = i === STEPS.length - 1;

  const finish = (skipped: boolean) => {
    try {
      localStorage.setItem(LS_KEY, '1');
    } catch {
      /* private mode — just close */
    }
    trackEvent('tour_finished', { step: i, skipped });
    setOpen(false);
  };

  return (
    <Modal small eyebrow={step.eyebrow} title={step.title} onClose={() => finish(true)}>
      <p className="muted">{step.body}</p>
      <div className="tour-dots" aria-hidden="true">
        {STEPS.map((_, idx) => (
          <span key={idx} className={idx === i ? 'on' : ''} />
        ))}
      </div>
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={() => finish(true)}>
          Skip
        </button>
        {i > 0 && (
          <button className="btn btn-ghost" onClick={() => setI(i - 1)}>
            Back
          </button>
        )}
        <button className="btn btn-primary" onClick={() => (isLast ? finish(false) : setI(i + 1))}>
          {isLast ? 'Got it' : 'Next'}
        </button>
      </div>
    </Modal>
  );
}
