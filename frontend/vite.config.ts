import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Vite config tuned for Emergent platform.
// - Keeps `yarn start` mapped to vite dev server on port 3000 (supervisor expectation).
// - Exposes both `VITE_*` and `REACT_APP_*` env vars (the platform requires REACT_APP_BACKEND_URL).
// - HMR over wss on port 443 because the preview URL is HTTPS-only via Kubernetes ingress.
export default defineConfig({
  plugins: [react()],
  envPrefix: ['VITE_', 'REACT_APP_'],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    allowedHosts: true,
    hmr: {
      protocol: 'wss',
      clientPort: 443,
    },
    watch: {
      ignored: ['**/node_modules/**', '**/.git/**', '**/build/**', '**/dist/**'],
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
  },
  build: {
    outDir: 'build',
    sourcemap: false,
  },
})
