import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Stress Ledger — a fully static, single-page front-end.
// No backend, no env, no server-side anything. `base: './'` keeps the
// production build portable so the dist/ folder works from any path
// (or opened over file://-style static hosting).
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5173, open: false },
});
