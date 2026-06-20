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
          categories: ['food', 'lifestyle', 'productivity'],
          // Long-press / jump-list shortcuts into the core screens.
          shortcuts: [
            { name: "Today", short_name: 'Today', url: '/today', description: "Today's kitchen" },
            { name: 'Pantry', short_name: 'Pantry', url: '/pantry', description: 'Your pantry' },
            { name: 'Shopping lists', short_name: 'Lists', url: '/lists', description: 'Your shopping lists' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          // push-sw.js is pulled in via importScripts below — don't also precache it.
          globIgnores: ['push-sw.js'],
          // Pull the Web Push handlers into the generated SW without an injectManifest
          // migration (keeps all the runtimeCaching below owned by Workbox).
          importScripts: ['push-sw.js'],
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
              // Recipe reads incl. sub-paths (/recipes/suggestions, /cooked,
              // /favourites, /{slug}, /{slug}/comments), the ingredient dictionary,
              // and group feed/suggestions — so the ranked feed, cook history,
              // favourites and group browse all work offline. GET-only (Workbox
              // default), so POSTs (import, comments) are never served from cache.
              urlPattern: /\/api\/v1\/(ingredients|recipes|groups)(\/|\?|$)/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'api-reads',
                expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 },
              },
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
