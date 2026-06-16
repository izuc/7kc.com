import { useQuery } from '@tanstack/react-query';
import { NavLink, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { daysUntil } from '../lib/format';
import { useAuth } from '../store/auth';
import { useUi } from '../store/ui';
import { Icon } from './Icon';
import { useSync } from '../lib/offlineSync';
import type { ReactNode } from 'react';

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { accent, density } = useUi();
  const navigate = useNavigate();

  const { data: listsData } = useQuery({
    queryKey: ['lists'],
    queryFn: () => api.lists(),
  });
  const { data: pantryData } = useQuery({
    queryKey: ['pantry'],
    queryFn: () => api.pantry(),
  });

  const inGroup = Boolean(user?.group_id);
  const { data: unreadData } = useQuery({
    queryKey: ['feed-unread'],
    queryFn: () => api.unreadFeed(),
    enabled: inGroup,
    refetchInterval: 60_000,
  });
  const unread = unreadData?.unread ?? 0;

  const { online, pending, syncing } = useSync();
  const showSync = !online || pending > 0;

  const activeItemsCount =
    listsData?.lists
      .filter((l) => !l.archived_at)
      .reduce((s, l) => s + l.items.filter((i) => !i.is_bought).length, 0) ?? 0;
  const totalPantry = pantryData?.items.length ?? 0;
  const expiringCount =
    pantryData?.items.filter((p) => {
      if (p.expires_at == null) return false;
      const d = daysUntil(p.expires_at * 1000);
      return d >= 0 && d <= 3;
    }).length ?? 0;

  return (
    <div className={`app accent-${accent} density-${density}`}>
      <a className="skip-link" href="#main">Skip to content</a>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <svg viewBox="0 0 28 28" width={28} height={28} aria-hidden>
              <rect x="1" y="1" width="26" height="26" rx="7" fill="var(--accent)" />
              <text
                x="14"
                y="19"
                textAnchor="middle"
                fontFamily="var(--serif)"
                fontWeight={400}
                fontSize={14}
                fill="var(--cream)"
              >
                7
              </text>
            </svg>
          </div>
          <div>
            <div className="brand-name">7 Day Kitchen</div>
            <div className="brand-tag mono small">7kc.com</div>
          </div>
        </div>

        <nav className="nav" aria-label="Primary">
          <NavItem to="/today" icon="home" label="Today" />
          <NavItem to="/lists" icon="list" label="Shopping" badge={activeItemsCount || undefined} />
          <NavItem to="/pantry" icon="pantry" label="Pantry" badge={totalPantry || undefined} ghost />
          <NavItem
            to="/recipes"
            icon="chef"
            label="Recipes"
            badge={expiringCount || undefined}
            amber={expiringCount > 0}
          />
          {inGroup && (
            <NavItem to="/group" icon="group" label="Group" badge={unread || undefined} amber={unread > 0} />
          )}
          <NavItem to="/settings" icon="settings" label="Settings" />
        </nav>

        <div className="sidebar-foot">
          {!inGroup ? (
            <div className="invite-card">
              <div className="eyebrow sage">Solo mode</div>
              <p>Cook with housemates or a partner? Share your pantry.</p>
              <button className="btn btn-sage full" onClick={() => navigate('/settings')}>
                <Icon name="group" size={14} /> Invite to your kitchen
              </button>
            </div>
          ) : (
            <div className="invite-card">
              <div className="eyebrow sage">Group mode</div>
              <button className="btn btn-ghost full" onClick={() => navigate('/group')}>
                Open group
              </button>
            </div>
          )}

          <div className="row-inline" style={{ justifyContent: 'space-between' }}>
            <span className="mono small muted">{user?.display_name || user?.email}</span>
            <button className="btn btn-ghost" onClick={logout}>
              Sign out
            </button>
          </div>

          <div className="principle mono small muted">
            <div>Use what you've got.</div>
            <div>Eat what you love.</div>
            <div>Waste nothing.</div>
          </div>
        </div>
      </aside>

      <main className="main" id="main">
        {showSync && (
          <div className={`sync-banner ${online ? '' : 'offline'}`} role="status" aria-live="polite">
            <span className="sync-dot" aria-hidden />
            {!online
              ? `Offline — ${pending} change${pending === 1 ? '' : 's'} saved here, will sync when you're back`
              : syncing
              ? `Syncing ${pending} change${pending === 1 ? '' : 's'}…`
              : `${pending} change${pending === 1 ? '' : 's'} waiting to sync`}
          </div>
        )}
        {children}
      </main>

      <nav className="mobile-nav" aria-label="Sections">
        <MobileNavItem to="/today" icon="home" label="Today" />
        <MobileNavItem to="/lists" icon="list" label="Shopping" />
        <MobileNavItem to="/pantry" icon="pantry" label="Pantry" />
        <MobileNavItem to="/recipes" icon="chef" label="Recipes" />
        {inGroup && <MobileNavItem to="/group" icon="group" label="Group" dot={unread > 0} />}
        <MobileNavItem to="/settings" icon="settings" label="More" />
      </nav>
    </div>
  );
}

function NavItem({
  to,
  icon,
  label,
  badge,
  ghost,
  amber,
}: {
  to: string;
  icon: string;
  label: string;
  badge?: number;
  ghost?: boolean;
  amber?: boolean;
}) {
  return (
    <NavLink to={to} className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
      <Icon name={icon} /> <span>{label}</span>
      {badge != null && (
        <span className={`badge ${ghost ? 'ghost mono' : ''} ${amber ? 'amber' : ''}`}>{badge}</span>
      )}
    </NavLink>
  );
}

function MobileNavItem({
  to,
  icon,
  label,
  dot,
}: {
  to: string;
  icon: string;
  label: string;
  dot?: boolean;
}) {
  return (
    <NavLink to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
      <span className="mobile-nav-icon">
        <Icon name={icon} />
        {dot && <span className="nav-dot" aria-hidden />}
      </span>
      <span>{label}</span>
    </NavLink>
  );
}
