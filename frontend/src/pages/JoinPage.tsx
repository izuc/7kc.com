import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../store/auth';
import { Loading } from '../components/Loading';
import { Icon } from '../components/Icon';

/** Landing for a shared group invite link (/join/:token). Works logged-in or out. */
export function JoinPage() {
  const { token } = useParams();
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['invite', token],
    queryFn: () => api.resolveInvite(token!),
    enabled: !!token,
    retry: false,
  });

  if (isLoading) return <Loading label="Loading invite…" />;

  if (error || !data) {
    return (
      <div className="auth-shell">
        <main className="auth-main">
          <div className="auth-card">
            <h2>Invite not found</h2>
            <p className="muted">This invite link is invalid or has expired.</p>
            <Link className="btn btn-primary full" to="/">
              Go home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const invite = data.invite;

  const join = async () => {
    setBusy(true);
    setErr(null);
    try {
      await api.joinGroup(token!);
      await refresh();
      qc.invalidateQueries();
      navigate('/group', { replace: true });
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Could not join');
      setBusy(false);
    }
  };

  return (
    <div className="auth-shell">
      <main className="auth-main">
        <div className="auth-card">
          <div className="eyebrow sage">You're invited</div>
          <h2>Join {invite.group_name}</h2>
          <p className="muted">
            {invite.inviter ? `${invite.inviter} invited you` : "You've been invited"} to share a
            pantry, shopping lists, and meal ideas — {invite.member_count} member
            {invite.member_count === 1 ? '' : 's'} so far.
          </p>
          {err && (
            <div className="error" role="alert">
              {err}
            </div>
          )}
          {user ? (
            <button className="btn btn-primary full" onClick={join} disabled={busy}>
              <Icon name="group" size={14} /> {busy ? 'Joining…' : `Join ${invite.group_name}`}
            </button>
          ) : (
            <>
              <Link className="btn btn-primary full" to={`/register?join=${token}`}>
                Create an account to join
              </Link>
              <div className="auth-switch">
                Already have an account? <Link to={`/login?join=${token}`}>Sign in</Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
