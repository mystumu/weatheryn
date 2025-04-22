import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['axios', 'leaflet']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
}); 