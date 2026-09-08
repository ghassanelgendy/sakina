import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Precache the app shell (JS/CSS/HTML/fonts) so the app itself opens with
      // zero network — separate from the Quran text/tafsir, which is cached in
      // IndexedDB by the in-app "download for offline" feature.
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'سكينة — القرآن والأذكار',
        short_name: 'سكينة',
        description: 'تطبيق لحفظ ومراجعة القرآن الكريم وقراءة الأذكار اليومية، يعمل بالكامل بدون إنترنت.',
        lang: 'ar',
        dir: 'rtl',
        start_url: '/',
        display: 'standalone',
        background_color: '#0c1613',
        theme_color: '#1c6b52',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App shell + fonts precached at build time; Quran API/audio handled by
        // separate runtime caches below since they're large and page-addressed.
        globPatterns: ['**/*.{js,css,html,woff2}'],
        runtimeCaching: [
          {
            // Quran text/tafsir pages — cache-first so once a page has been
            // viewed (or bulk-downloaded), it never needs the network again.
            urlPattern: /^https:\/\/api\.alquran\.cloud\/v1\/(page|surah|quran)\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'quran-api-cache',
              expiration: { maxEntries: 700, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Recitation audio — cache-first, capped since full-Quran audio per
            // reciter is large; least-recently-used entries are evicted first.
            urlPattern: /^https:\/\/everyayah\.com\/data\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'quran-audio-cache',
              expiration: { maxEntries: 1500, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5174,
  },
});
