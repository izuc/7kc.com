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
      <form className="auth-card" onSubmit={submit}>
        <div className="brand" style={{ alignSelf: 'center' }}>
          <svg viewBox="0 0 28 28" width={36} height={36} aria-hidden>
            <rect x="1" y="1" width="26" height="26" rx="7" fill="var(--accent)" />
            <text x="14" y="20" textAnchor="middle" fontFamily="var(--serif)" fontSize={15} fill="var(--cream)">
              7
            </text>
          </svg>
          <div>
            <div className="brand-name">7 Day Kitchen</div>
            <div className="brand-tag mono small">Welcome back</div>
          </div>
        </div>
        {err && <div className="error">{err}</div>}
        <div className="auth-field">
          <label>Email</label>
          <input
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
          <label>Password</label>
          <input
            className="text-input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button className="btn btn-primary full" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <div className="auth-switch">
          New here? <Link to="/register">Create an account</Link>
        </div>
        <div className="principle mono small muted">
          Use what you've got. Eat what you love. Waste nothing.
        </div>
      </form>
    </div>
  );
}
