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
      <form className="auth-card" onSubmit={submit}>
        <div>
          <div className="eyebrow">Start free</div>
          <h2 style={{ fontSize: 28 }}>Your kitchen, remembered.</h2>
          <p className="muted small" style={{ margin: 0 }}>
            Private pantry, smart lists, recipes that use what you've got.
          </p>
        </div>
        {err && <div className="error">{err}</div>}
        <div className="auth-field">
          <label>Your name (optional)</label>
          <input
            className="text-input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Lance"
          />
        </div>
        <div className="auth-field">
          <label>Email</label>
          <input
            className="text-input"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="auth-field">
          <label>Password (min 8 chars)</label>
          <input
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
          {busy ? 'Creating…' : 'Create account'}
        </button>
        <div className="auth-switch">
          Already signed up? <Link to="/login">Sign in</Link>
        </div>
      </form>
    </div>
  );
}
