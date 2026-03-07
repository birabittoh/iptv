import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg'],
        manifest: {
          name: 'IPTV',
          short_name: 'IPTV',
          description: 'Live TV streaming powered by Free-TV/IPTV',
          theme_color: '#10b981',
          background_color: '#18181b',
          display: 'standalone',
          icons: [
            {
              src: 'icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
            },
            {
              src: 'icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          // Don't precache the m3u8 playlist — it's always fetched live
          globPatterns: ['**/*.{js,css,html,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/i\.imgur\.com\//,
              handler: 'CacheFirst',
              options: {
                cacheName: 'channel-logos',
                expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 7 },
              },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
