import { useEffect, useState } from 'react';
import { Icon } from './Icon';
import type { RecipeStep } from '../types/models';

/**
 * Recipe method list with a "show beginner notes" toggle. The quick step
 * line (content) is always visible; the guided layer — step title, the longer
 * walkthrough (detail), timing, tips and warnings — is hidden by default and
 * revealed inline beneath each step when the toggle is on. Preference
 * persists via localStorage. Guided content always lands in the DOM (hidden
 * via CSS) so print/PDF can force it visible.
 */

const LS_KEY = '7kc.beginner-notes';

const fmtMins = (secs: number) => {
  const m = Math.round(secs / 60);
  return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60 ? `${m % 60} min` : ''}`.trim() : `${m} min`;
};

export function MethodBlock({ steps }: { steps: RecipeStep[] }) {
  // Guided notes default ON until the reader explicitly hides them — the
  // walkthrough is the point for beginners; old hands can collapse it once
  // and the choice sticks.
  const [showDetail, setShowDetail] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LS_KEY) !== '0';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, showDetail ? '1' : '0');
    } catch {}
  }, [showDetail]);

  const anyDetail = steps.some(
    (s) => s.detail || s.title || (s.tips?.length ?? 0) > 0 || (s.warnings?.length ?? 0) > 0
  );

  return (
    <>
      <div className="method-head">
        <h3>Method</h3>
        {anyDetail && (
          <button
            className={`chip ${showDetail ? 'active' : ''}`}
            onClick={() => setShowDetail((v) => !v)}
            aria-pressed={showDetail}
            type="button"
          >
            {showDetail ? '− Hide beginner notes' : '+ Beginner notes'}
          </button>
        )}
      </div>
      <ol className={`recipe-steps ${showDetail ? 'with-detail' : ''}`}>
        {steps.map((s, i) => (
          <li key={i}>
            <span className="step-num mono">{i + 1}</span>
            <div className="step-body">
              {s.title && (
                <div className="step-title mono">
                  {s.title}
                  {s.timer_seconds != null && s.timer_seconds > 0 && (
                    <span className="step-mins">
                      <Icon name="clock" size={11} /> {fmtMins(s.timer_seconds)}
                    </span>
                  )}
                </div>
              )}
              <div className="step-content">{s.content}</div>
              {s.detail && <p className="step-detail">{s.detail}</p>}
              {(s.warnings?.length ?? 0) > 0 && (
                <ul className="step-notes warn">
                  {s.warnings!.map((w, j) => (
                    <li key={j}>
                      <span className="step-note-tag mono">careful</span>
                      {w}
                    </li>
                  ))}
                </ul>
              )}
              {(s.tips?.length ?? 0) > 0 && (
                <ul className="step-notes tip">
                  {s.tips!.map((t, j) => (
                    <li key={j}>
                      <span className="step-note-tag mono">tip</span>
                      {t}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
