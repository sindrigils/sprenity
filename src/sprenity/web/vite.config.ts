import tailwind from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwind()],
  // Use relative paths for Electron's file:// protocol in production
  base: process.env.ELECTRON === 'true' ? './' : '/',
  resolve: {
    alias: {
      '@store': path.resolve(__dirname, './src/store'),
      '@modals': path.resolve(__dirname, './src/modals'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@components': path.resolve(__dirname, './src/components'),
    },
  },
});
