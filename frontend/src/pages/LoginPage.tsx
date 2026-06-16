import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { ApiError } from '../lib/api';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate('/lists', { replace: true });
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Could not sign in');
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
          <div className="eyebrow">Welcome back</div>
          <h1>
            Your pantry, <em>still standing.</em>
          </h1>
          <p>
            Pick up where you left off. Your lists, your pantry, what's expiring
            in the next three days — all of it waiting.
          </p>
        </div>

        <div className="auth-aside-foot">
          <span><span className="tick">✓</span>Free forever</span>
          <span><span className="tick">✓</span>No subscription</span>
          <span><span className="tick">✓</span>No AI</span>
        </div>
      </aside>

      <main className="auth-main">
        <form className="auth-card" onSubmit={submit}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Sign in
          </div>
          <h2>Open the kitchen.</h2>
          {err && <div className="error" role="alert">{err}</div>}
          <div className="auth-field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              className="text-input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="auth-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              className="text-input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="btn btn-primary full" type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in →'}
          </button>
          <div className="auth-switch">
            New here? <Link to="/register">Create an account</Link>
          </div>
        </form>
      </main>
    </div>
  );
}
