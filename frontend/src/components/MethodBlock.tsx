import { useEffect, useState } from 'react';
import type { RecipeStep } from '../types/models';

/**
 * Recipe method list with a "show beginner notes" toggle. The quick step
 * line (content) is always visible; the longer beginner walkthrough (detail)
 * is hidden by default and revealed inline beneath each step when the
 * toggle is on. Preference persists across recipes via localStorage.
 */

const LS_KEY = '7kc.beginner-notes';

export function MethodBlock({ steps }: { steps: RecipeStep[] }) {
  const [showDetail, setShowDetail] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LS_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, showDetail ? '1' : '0');
    } catch {}
  }, [showDetail]);

  const anyDetail = steps.some((s) => !!s.detail);

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
      <ol className="recipe-steps">
        {steps.map((s, i) => (
          <li key={i}>
            <span className="step-num mono">{i + 1}</span>
            <div className="step-body">
              <div className="step-content">{s.content}</div>
              {showDetail && s.detail && (
                <p className="step-detail">{s.detail}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
