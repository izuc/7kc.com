import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../store/auth';
import { useUi } from '../store/ui';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';
import { pushSupported, enablePush, disablePush, isPushEnabled } from '../lib/push';

export function SettingsPage() {
  const { user, refresh, logout, signOutEverywhere } = useAuth();
  const qc = useQueryClient();
  const { accent, setAccent, density, setDensity, toast } = useUi();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const canPush = pushSupported();
  const [pushOn, setPushOn] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  useEffect(() => {
    if (canPush) void isPushEnabled().then(setPushOn);
  }, [canPush]);

  const togglePush = async () => {
    setPushBusy(true);
    try {
      if (pushOn) {
        await disablePush();
        setPushOn(false);
        toast('Notifications off');
      } else {
        const result = await enablePush();
        setPushOn(result === 'enabled');
        toast(
          result === 'enabled'
            ? 'Notifications on'
            : result === 'denied'
            ? 'Notifications are blocked — enable them in your browser settings.'
            : "Notifications aren't available right now."
        );
      }
    } catch {
      toast('Could not update notifications — please try again.');
    } finally {
      setPushBusy(false);
    }
  };

  const toggleDigest = async () => {
    const next = !(user?.digest_optin ?? false);
    try {
      await api.setDigestOptin(next);
      await refresh();
    } catch {
      toast('Could not update — please try again.');
    }
  };

  const exportData = async () => {
    try {
      const data = await api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '7kc-export.json';
      a.click();
      URL.revokeObjectURL(url);
      toast('Data exported');
    } catch {
      toast('Could not export — please try again.');
    }
  };

  const { data: groupData } = useQuery({
    queryKey: ['my-group'],
    queryFn: () => api.myGroup(),
    enabled: Boolean(user?.group_id),
  });

  const group = groupData?.group ?? null;

  const leave = async () => {
    if (!confirm('Leave this group? Shared lists and pantry items stay with the group.')) return;
    await api.leaveGroup();
    await refresh();
    qc.invalidateQueries();
    toast('Left the group');
  };

  return (
    <div className="screen">
      <div className="screen-head">
        <div className="screen-head-left">
          <div className="eyebrow">Settings</div>
          <h1 className="screen-title">Your kitchen</h1>
        </div>
      </div>

      <div className="settings-grid">
        <div className="setting-card">
          <h3>Account</h3>
          <div className="mono small muted">Email</div>
          <div>{user?.email}</div>
          {user?.display_name && (
            <>
              <div className="mono small muted">Name</div>
              <div>{user.display_name}</div>
            </>
          )}
          <div className="row-inline" style={{ gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost" onClick={logout}>
              Sign out
            </button>
            <button className="btn btn-ghost" onClick={exportData}>
              Export my data
            </button>
            <button
              className="btn btn-ghost"
              onClick={async () => {
                if (!confirm('Sign out of every device, including this one? You’ll need to sign in again.')) return;
                try {
                  await signOutEverywhere();
                } catch {
                  toast('Could not sign out everywhere — please try again.');
                }
              }}
            >
              Sign out everywhere
            </button>
          </div>
          <button
            className="btn btn-ghost"
            style={{ alignSelf: 'flex-start', color: 'var(--danger)' }}
            onClick={() => setShowDelete(true)}
          >
            <Icon name="trash" size={14} /> Delete account
          </button>
        </div>

        <div className="setting-card">
          <h3>Appearance</h3>
          <div className="tweak-row">
            <label>Accent</label>
            <div className="swatches">
              {(['terracotta', 'sage', 'ink', 'plum'] as const).map((a) => (
                <button
                  key={a}
                  className={`swatch-btn swatch-${a} ${accent === a ? 'active' : ''}`}
                  onClick={() => setAccent(a)}
                  aria-label={`${a} accent`}
                  aria-pressed={accent === a}
                />
              ))}
            </div>
          </div>
          <div className="tweak-row">
            <label>Density</label>
            <div className="segmented">
              <button
                className={density === 'compact' ? 'active' : ''}
                aria-pressed={density === 'compact'}
                onClick={() => setDensity('compact')}
              >
                Compact
              </button>
              <button
                className={density === 'roomy' ? 'active' : ''}
                aria-pressed={density === 'roomy'}
                onClick={() => setDensity('roomy')}
              >
                Roomy
              </button>
            </div>
          </div>
        </div>

        <div className="setting-card">
          <h3>Dietary</h3>
          <p className="muted small">Suggestions only show recipes that fit.</p>
          <div className="chip-row">
            {(
              [
                ['vegetarian', 'Vegetarian'],
                ['vegan', 'Vegan'],
                ['dairy_free', 'Dairy-free'],
                ['gluten_free', 'Gluten-free'],
                ['nut_free', 'Nut-free'],
              ] as [string, string][]
            ).map(([key, label]) => {
              const on = (user?.diet ?? []).includes(key);
              return (
                <button
                  key={key}
                  className={`chip ${on ? 'active' : ''}`}
                  aria-pressed={on}
                  onClick={async () => {
                    const current = user?.diet ?? [];
                    const next = on ? current.filter((d) => d !== key) : [...current, key];
                    try {
                      await api.setDiet(next);
                      await refresh();
                      qc.invalidateQueries({ queryKey: ['recipe-suggestions'] });
                    } catch {
                      toast('Could not save — please try again.');
                    }
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="setting-card">
          <h3>Notifications</h3>
          <div className="tweak-row">
            <label>
              Expiring-food push
              <span className="muted small" style={{ display: 'block' }}>
                A heads-up when pantry items are about to expire.
              </span>
            </label>
            {canPush ? (
              <div className="segmented" role="group" aria-label="Expiring-food push notifications">
                <button className={pushOn ? 'active' : ''} aria-pressed={pushOn} disabled={pushBusy} onClick={() => !pushOn && togglePush()}>
                  On
                </button>
                <button className={!pushOn ? 'active' : ''} aria-pressed={!pushOn} disabled={pushBusy} onClick={() => pushOn && togglePush()}>
                  Off
                </button>
              </div>
            ) : (
              <span className="muted small">Add to your Home Screen to enable.</span>
            )}
          </div>
          <div className="tweak-row">
            <label>
              Weekly use-it-up email
              <span className="muted small" style={{ display: 'block' }}>
                We only email when you have expiring or low items. Unsubscribe any time.
              </span>
            </label>
            <div className="segmented" role="group" aria-label="Weekly use-it-up email">
              <button
                className={user?.digest_optin ? 'active' : ''}
                aria-pressed={!!user?.digest_optin}
                onClick={() => !user?.digest_optin && toggleDigest()}
              >
                On
              </button>
              <button
                className={!user?.digest_optin ? 'active' : ''}
                aria-pressed={!user?.digest_optin}
                onClick={() => user?.digest_optin && toggleDigest()}
              >
                Off
              </button>
            </div>
          </div>
        </div>

        {!user?.group_id ? (
          <div className="setting-card solo-banner">
            <div className="eyebrow sage">Solo mode</div>
            <h3>Invite someone to your kitchen</h3>
            <p className="muted">
              Create a group to share a pantry, lists, and meal suggestions in real time with up to eight
              people. Groups are optional — everything works solo.
            </p>
            <div className="row-inline" style={{ gap: 10 }}>
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                <Icon name="plus" size={14} /> Create a group
              </button>
              <button className="btn btn-ghost" onClick={() => setShowJoin(true)}>
                I have an invite token
              </button>
            </div>
          </div>
        ) : group ? (
          <div className="setting-card">
            <h3>Group · {group.name}</h3>
            <div className="mono small muted">{group.members.length} member{group.members.length === 1 ? '' : 's'}</div>
            <div className="mono small muted">Invite link (share with trusted people)</div>
            <div className="invite-token">{`${window.location.origin}/join/${group.invite_token}`}</div>
            <div className="row-inline" style={{ gap: 10 }}>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  const url = `${window.location.origin}/join/${group.invite_token}`;
                  try {
                    if (navigator.share) {
                      await navigator.share({ title: `Join ${group.name} on 7 Day Kitchen`, url });
                    } else {
                      await navigator.clipboard.writeText(url);
                      toast('Invite link copied');
                    }
                  } catch {
                    /* share cancelled */
                  }
                }}
              >
                <Icon name="share" size={14} /> Share invite
              </button>
              <button className="btn btn-ghost" onClick={leave}>
                Leave group
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {showCreate && (
        <CreateGroupModal
          onClose={() => setShowCreate(false)}
          onDone={async () => {
            setShowCreate(false);
            await refresh();
            qc.invalidateQueries();
          }}
        />
      )}
      {showJoin && (
        <JoinGroupModal
          onClose={() => setShowJoin(false)}
          onDone={async () => {
            setShowJoin(false);
            await refresh();
            qc.invalidateQueries();
          }}
        />
      )}
      {showDelete && <DeleteAccountModal onClose={() => setShowDelete(false)} />}
    </div>
  );
}

function DeleteAccountModal({ onClose }: { onClose: () => void }) {
  const { logout } = useAuth();
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <Modal small eyebrow="This cannot be undone" title="Delete your account" onClose={onClose}>
      {err && <div className="error" role="alert">{err}</div>}
      <p className="muted small">
        This permanently deletes your lists, pantry, cooked history and account. Type <b>DELETE</b> to
        confirm.
      </p>
      <input
        className="text-input"
        aria-label="Type DELETE to confirm account deletion"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="DELETE"
        autoFocus
      />
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button
          className="btn btn-primary"
          style={{ background: 'var(--danger)' }}
          disabled={confirm !== 'DELETE' || busy}
          onClick={async () => {
            setBusy(true);
            setErr(null);
            try {
              await api.deleteAccount();
              logout();
            } catch (e) {
              setErr(e instanceof ApiError ? e.message : 'Could not delete your account');
              setBusy(false);
            }
          }}
        >
          {busy ? 'Deleting…' : 'Delete forever'}
        </button>
      </div>
    </Modal>
  );
}

function CreateGroupModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <Modal small title="Create a group" eyebrow="Invite later" onClose={onClose}>
      {err && <div className="error" role="alert">{err}</div>}
      <label className="field-label" htmlFor="group-name-input">Group name</label>
      <input
        id="group-name-input"
        className="text-input"
        placeholder="e.g. The Wilsons"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button
          className="btn btn-primary"
          disabled={busy || !name.trim()}
          onClick={async () => {
            setBusy(true);
            setErr(null);
            try {
              await api.createGroup(name.trim());
              onDone();
            } catch (e) {
              setErr(e instanceof ApiError ? e.message : 'Could not create group');
            } finally {
              setBusy(false);
            }
          }}
        >
          Create
        </button>
      </div>
    </Modal>
  );
}

function JoinGroupModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <Modal small title="Join a group" eyebrow="Paste invite" onClose={onClose}>
      {err && <div className="error">{err}</div>}
      <label className="field-label">Invite token</label>
      <input
        className="text-input"
        placeholder="abc123…"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        autoFocus
      />
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button
          className="btn btn-primary"
          disabled={busy || !token.trim()}
          onClick={async () => {
            setBusy(true);
            setErr(null);
            try {
              await api.joinGroup(token.trim());
              onDone();
            } catch (e) {
              setErr(e instanceof ApiError ? e.message : 'Could not join');
            } finally {
              setBusy(false);
            }
          }}
        >
          Join
        </button>
      </div>
    </Modal>
  );
}
