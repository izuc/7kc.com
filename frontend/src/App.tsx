import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './store/auth';
import { useUi } from './store/ui';
import { AppShell } from './components/AppShell';
import { Toasts } from './components/Toasts';
import { Loading } from './components/Loading';
import { InstallPrompt } from './components/InstallPrompt';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ListsPage } from './pages/ListsPage';
import { PantryPage } from './pages/PantryPage';
import { RecipesPage } from './pages/RecipesPage';
import { RecipeDetailPage } from './pages/RecipeDetailPage';
import { CookPage } from './pages/CookPage';
import { GroupPage } from './pages/GroupPage';
import { SettingsPage } from './pages/SettingsPage';
import { PublicRecipePage } from './pages/PublicRecipePage';
import { LandingPage } from './pages/LandingPage';

export function App() {
  const { user, loading } = useAuth();
  const { accent, density } = useUi();
  const location = useLocation();

  // public SEO routes render without auth and outside the AppShell
  if (location.pathname.startsWith('/r/')) {
    return (
      <div className={`accent-${accent} density-${density}`}>
        <Routes>
          <Route path="/r/:slug" element={<PublicRecipePage />} />
        </Routes>
      </div>
    );
  }

  if (loading) {
    return <Loading label="Loading your kitchen…" />;
  }

  if (!user) {
    return (
      <div className={`accent-${accent} density-${density}`}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/" replace state={{ from: location }} />} />
        </Routes>
        <Toasts />
      </div>
    );
  }

  return (
    <AppShell>
      <Routes>
        <Route index element={<Navigate to="/lists" replace />} />
        <Route path="/lists" element={<ListsPage />} />
        <Route path="/lists/:id" element={<ListsPage />} />
        <Route path="/pantry" element={<PantryPage />} />
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/recipes/:slug" element={<RecipeDetailPage />} />
        <Route path="/cook/:slug" element={<CookPage />} />
        <Route path="/group" element={<GroupPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/lists" replace />} />
      </Routes>
      <Toasts />
      <InstallPrompt />
    </AppShell>
  );
}
