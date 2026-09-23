import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** GitHub Pages serves a project site from https://<user>.github.io/<repo>/, so the
 *  production build needs that sub-path as its base or every asset 404s. The Actions
 *  workflow sets BASE_PATH; local dev and `npm run preview` stay at "/".
 *  Anything referencing a file in public/ from JS must use import.meta.env.BASE_URL —
 *  Vite rewrites absolute paths in index.html, but not inside string literals. */
export default defineConfig(({ command }) => ({
  base: command === 'build' ? process.env.BASE_PATH || '/' : '/',
  plugins: [react()],
  server: { port: 5173, open: true },
  test: { environment: 'node' },
}));
