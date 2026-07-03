import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { useAuth } from './store/auth';
import { getToken } from './lib/api';
import { useUi } from './store/ui';
import { AppShell } from './components/AppShell';
import { Toasts } from './components/Toasts';
import { Loading } from './components/Loading';
import { InstallPrompt } from './components/InstallPrompt';
import { TourOverlay } from './components/TourOverlay';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ListsPage } from './pages/ListsPage';
import { JoinPage } from './pages/JoinPage';

// Code-split the heavier / less-critical routes so logged-out and crawler visitors
// (and first authed paint) don't download the whole app up front.
const TodayPage = lazy(() => import('./pages/TodayPage').then((m) => ({ default: m.TodayPage })));
const PantryPage = lazy(() => import('./pages/PantryPage').then((m) => ({ default: m.PantryPage })));
const RecipesPage = lazy(() => import('./pages/RecipesPage').then((m) => ({ default: m.RecipesPage })));
const RecipeDetailPage = lazy(() => import('./pages/RecipeDetailPage').then((m) => ({ default: m.RecipeDetailPage })));
const CookPage = lazy(() => import('./pages/CookPage').then((m) => ({ default: m.CookPage })));
const GroupPage = lazy(() => import('./pages/GroupPage').then((m) => ({ default: m.GroupPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const SharePage = lazy(() => import('./pages/SharePage').then((m) => ({ default: m.SharePage })));
const PublicRecipePage = lazy(() => import('./pages/PublicRecipePage').then((m) => ({ default: m.PublicRecipePage })));
const CollectionPage = lazy(() => import('./pages/CollectionPage').then((m) => ({ default: m.CollectionPage })));
const BrowsePage = lazy(() => import('./pages/BrowsePage').then((m) => ({ default: m.BrowsePage })));
const LandingPage = lazy(() => import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })));

const TITLES: Record<string, string> = {
  '/today': 'Home · 7 Day Kitchen',
  '/lists': 'Shopping · 7 Day Kitchen',
  '/pantry': 'Pantry · 7 Day Kitchen',
  '/recipes': 'Recipes · 7 Day Kitchen',
  '/cook': 'Cooking · 7 Day Kitchen',
  '/group': 'Group · 7 Day Kitchen',
  '/settings': 'Settings · 7 Day Kitchen',
  '/login': 'Sign in · 7 Day Kitchen',
  '/register': 'Create account · 7 Day Kitchen',
};

export function App() {
  const { user, loading } = useAuth();
  const { accent, density } = useUi();
  const location = useLocation();

  useEffect(() => {
    // /r/ recipe pages set their own specific title — don't clobber it.
    if (location.pathname.startsWith('/r/') || location.pathname.startsWith('/collection/') || location.pathname.startsWith('/browse')) return;
    let title = "7 Day Kitchen — Use what you've got.";
    for (const [path, t] of Object.entries(TITLES)) {
      if (location.pathname === path || location.pathname.startsWith(path + '/')) {
        title = t;
        break;
      }
    }
    document.title = title;
  }, [location.pathname]);

  // public SEO routes render without auth and outside the AppShell
  if (location.pathname.startsWith('/r/') || location.pathname.startsWith('/collection/') || location.pathname.startsWith('/browse')) {
    // A signed-in visitor shouldn't be treated as a stranger here: wait for
    // the session check when a token exists, then give /r/:slug readers the
    // full in-app recipe page (pantry ticks, cook mode, favourites).
    if (loading && getToken()) return <Loading label="Loading…" />;
    if (user && location.pathname.startsWith('/r/')) {
      return <Navigate to={`/recipes/${location.pathname.slice('/r/'.length)}`} replace />;
    }
    return (
      <div className={`accent-${accent} density-${density}`}>
        <ErrorBoundary resetKey={location.pathname}>
          <Suspense fallback={<Loading label="Loading…" />}>
            <Routes>
              <Route path="/browse" element={<BrowsePage />} />
              <Route path="/r/:slug" element={<PublicRecipePage />} />
              <Route path="/collection/:tag" element={<CollectionPage />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </div>
    );
  }

  if (loading) {
    return <Loading label="Loading your kitchen…" />;
  }

  // Group invite landing — works for both logged-in and logged-out visitors.
  if (location.pathname.startsWith('/join/')) {
    return (
      <div className={`accent-${accent} density-${density}`}>
        <ErrorBoundary resetKey={location.pathname}>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/join/:token" element={<JoinPage />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
        <Toasts />
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`accent-${accent} density-${density}`}>
        <ErrorBoundary resetKey={location.pathname}>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              {/* Shared-in before signing in → preserve the payload through login. */}
              <Route
                path="/share"
                element={<Navigate to={`/login?next=${encodeURIComponent('/share' + location.search)}`} replace />}
              />
              <Route path="*" element={<Navigate to="/" replace state={{ from: location }} />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
        <Toasts />
      </div>
    );
  }

  return (
    <AppShell>
      <ErrorBoundary resetKey={location.pathname}>
        <Suspense fallback={<Loading label="Loading…" />}>
          <Routes>
            <Route index element={<Navigate to="/today" replace />} />
            <Route path="/today" element={<TodayPage />} />
            <Route path="/lists" element={<ListsPage />} />
            <Route path="/lists/:id" element={<ListsPage />} />
            <Route path="/pantry" element={<PantryPage />} />
            <Route path="/recipes" element={<RecipesPage />} />
            <Route path="/recipes/:slug" element={<RecipeDetailPage />} />
            <Route path="/cook/:slug" element={<CookPage />} />
            <Route path="/group" element={<GroupPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/share" element={<SharePage />} />
            <Route path="*" element={<Navigate to="/today" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
      <Toasts />
      <InstallPrompt />
      <TourOverlay />
    </AppShell>
  );
}
