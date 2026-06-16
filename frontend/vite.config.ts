import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png'],
        manifest: {
          name: '7 Day Kitchen',
          short_name: '7KC',
          description: "Use what you've got. Eat what you love. Waste nothing.",
          theme_color: '#c2410c',
          background_color: '#fbf5ee',
          display: 'standalone',
          orientation: 'any',
          start_url: '/',
          scope: '/',
          icons: [
            { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
            { src: '/maskable-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
            { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
          // Android share sheet → app: text/links shared into 7KC land on /share,
          // which seeds the paste-parse flow with the shared content.
          share_target: {
            action: '/share',
            method: 'GET',
            enctype: 'application/x-www-form-urlencoded',
            params: { title: 'title', text: 'text', url: 'url' },
          },
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          runtimeCaching: [
            {
              urlPattern: ({ url }) =>
                url.origin === 'https://fonts.googleapis.com' ||
                url.origin === 'https://fonts.gstatic.com',
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts',
                expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              },
            },
            {
              urlPattern: /\/api\/v1\/(ingredients|recipes)(\?|$)/,
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'api-reads' },
            },
            {
              // Lists & pantry must render offline (the supermarket case) — serve the
              // last-fetched copy when the network is unavailable. Writes go through
              // the offline outbox, so a brief stale read reconciles on reconnect.
              urlPattern: /\/api\/v1\/(lists|pantry)(\?|$)/,
              handler: 'NetworkFirst',
              method: 'GET',
              options: {
                cacheName: 'api-lists-pantry',
                networkTimeoutSeconds: 4,
                expiration: { maxEntries: 16, maxAgeSeconds: 60 * 60 * 24 * 7 },
              },
            },
          ],
        },
      }),
    ],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY || 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },
    build: {
      target: 'es2020',
      sourcemap: true,
    },
  };
});
