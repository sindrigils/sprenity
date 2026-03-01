import tailwind from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

const apiProxyTarget =
  process.env.SPRENITY_API_PROXY ?? 'http://127.0.0.1:8000';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwind()],
  // Use relative paths for Electron's file:// protocol in production
  base: process.env.ELECTRON === 'true' ? './' : '/',
  resolve: {
    alias: {
      '@api': path.resolve(__dirname, './src/api'),
      '@core': path.resolve(__dirname, './src/core'),
      '@entities': path.resolve(__dirname, './src/entities'),
      '@systems': path.resolve(__dirname, './src/systems'),
      '@ui': path.resolve(__dirname, './src/ui'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: apiProxyTarget,
        ws: true,
      },
    },
  },
});
