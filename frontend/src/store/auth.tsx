import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { User } from '../types/models';
import { api, getToken, setToken } from '../lib/api';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, displayName?: string) => Promise<User>;
  logout: () => void;
  signOutEverywhere: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api.me();
      setUser(me);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // If any API call gets a 401 (expired/revoked token), drop to the login screen
  // instead of leaving the UI wedged in a permanent loading/error state.
  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null);
      qc.clear(); // revoked token → purge the cache so no stale private data lingers
    };
    window.addEventListener('7kc:unauthorized', onUnauthorized);
    return () => window.removeEventListener('7kc:unauthorized', onUnauthorized);
  }, [qc]);

  // Clearing the React Query cache on every identity change stops the previous
  // account's private data (lists/pantry/feed/badges) from being read out of the
  // still-warm cache by the next account in the same tab.
  const login = useCallback(async (email: string, password: string) => {
    const r = await api.login(email, password);
    qc.clear();
    setToken(r.token);
    setUser(r.user);
    return r.user;
  }, [qc]);

  const register = useCallback(async (email: string, password: string, displayName?: string) => {
    const r = await api.register(email, password, displayName);
    qc.clear();
    setToken(r.token);
    setUser(r.user);
    return r.user;
  }, [qc]);

  // Note: the offline outbox is NOT cleared here. Each op is tagged with its account
  // id and flushOutbox replays only the current user's ops (purging foreign ones), so
  // there's no cross-account replay — and a user's own un-synced ops survive for their
  // next sign-in. A blind clear here would race a fast logout→login and wipe the new
  // user's freshly-queued ops.
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    qc.clear();
  }, [qc]);

  // Revoke every token for this account server-side, then drop this device locally.
  const signOutEverywhere = useCallback(async () => {
    try {
      await api.signOutEverywhere();
    } finally {
      setToken(null);
      setUser(null);
      qc.clear();
    }
  }, [qc]);

  const value = useMemo<AuthState>(
    () => ({ user, loading, login, register, logout, signOutEverywhere, refresh }),
    [user, loading, login, register, logout, signOutEverywhere, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const v = useContext(AuthContext);
  if (!v) throw new Error('useAuth must be used within AuthProvider');
  return v;
}
