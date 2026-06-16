import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './styles.css';
import './styles.extra.css';
import './styles.landing.css';
import './styles.refine.css';
import { App } from './App';
import { AuthProvider } from './store/auth';
import { initAnalytics, trackEvent } from './lib/analytics';
import { initOfflineSync } from './lib/offlineSync';

initAnalytics();

// Surface otherwise-unhandled promise rejections to analytics (no-op without Plausible).
window.addEventListener('unhandledrejection', (e) => {
  const msg = e?.reason instanceof Error ? e.reason.message : String(e?.reason ?? 'unknown');
  trackEvent('client_error', { message: msg.slice(0, 200) });
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 15_000, retry: 1, refetchOnWindowFocus: false },
  },
});

// Replay any writes that were queued while offline, and watch connectivity.
initOfflineSync(queryClient);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
