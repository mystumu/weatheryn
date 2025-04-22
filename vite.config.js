import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/weatheryn/',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'WeatheRyn',
        short_name: 'WeatheRyn',
        description: 'Aplicación del tiempo con información detallada y mapas interactivos',
        theme_color: '#1e293b',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'android-launchericon-192-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'android-launchericon-512-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        navigateFallback: '/weatheryn/index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,vue,txt,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.openweathermap\.org\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'weather-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 // 1 hora
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['axios', 'leaflet']
        },
        input: {
          main: 'index.html',
          config: 'config.html',
          terms: 'terms.html',
          privacy: 'privacy.html',
          offline: 'offline.html'
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
}); 