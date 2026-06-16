import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { ApiError } from '../lib/api';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await register(email.trim(), password, displayName.trim() || undefined);
      navigate('/lists', { replace: true });
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Could not create your account');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-shell">
      <aside className="auth-aside">
        <Link to="/" className="auth-aside-brand">
          <svg viewBox="0 0 28 28" width={32} height={32} aria-hidden>
            <rect x="1" y="1" width="26" height="26" rx="7" fill="var(--accent)" />
            <text x="14" y="19" textAnchor="middle" fontFamily="var(--serif)" fontSize={14} fill="var(--cream)">
              7
            </text>
          </svg>
          <div>
            <div className="name">7 Day Kitchen</div>
            <div className="tag">7kc.com</div>
          </div>
        </Link>

        <div className="auth-aside-body">
          <div className="eyebrow">Start free</div>
          <h1>
            Your <em>kitchen,</em> remembered.
          </h1>
          <p>
            Private pantry, smart lists, recipes that use what you've already
            bought. Thirty seconds to set up, no credit card, nothing to cancel
            later.
          </p>
        </div>

        <div className="auth-aside-foot">
          <span><span className="tick">✓</span>Works offline</span>
          <span><span className="tick">✓</span>Installable as a PWA</span>
          <span><span className="tick">✓</span>150+ recipes seeded</span>
        </div>
      </aside>

      <main className="auth-main">
        <form className="auth-card" onSubmit={submit}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            New account
          </div>
          <h2>Start your pantry.</h2>
          {err && <div className="error">{err}</div>}
          <div className="auth-field">
            <label htmlFor="reg-name">Your name (optional)</label>
            <input
              id="reg-name"
              className="text-input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Lance"
            />
          </div>
          <div className="auth-field">
            <label htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              className="text-input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="reg-password">Password (min 8 chars)</label>
            <input
              id="reg-password"
              className="text-input"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button className="btn btn-primary full" type="submit" disabled={busy}>
            {busy ? 'Creating your kitchen…' : 'Create account →'}
          </button>
          <div className="auth-switch">
            Already signed up? <Link to="/login">Sign in</Link>
          </div>
        </form>
      </main>
    </div>
  );
}
