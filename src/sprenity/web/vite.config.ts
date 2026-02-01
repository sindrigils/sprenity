import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwind()],
  // Use relative paths for Electron's file:// protocol in production
  base: process.env.ELECTRON === 'true' ? './' : '/',
});
