import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  // Store apps must reach the production API; fail early instead of shipping a broken app.
  if (mode === 'mobile' && command === 'build') {
    const api = env.VITE_API_URL || '';
    const local = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/.test(api);
    if (!/^https:\/\/[^/]+\/?$/.test(api) && !local)
      throw new Error(
        'VITE_API_URL lipsește sau nu este HTTPS. Setează-l în .env.mobile.local, ' +
          'de ex. VITE_API_URL=https://atelierdevise.ro (sau folosește build:mobile:demo).',
      );
  }
  return {
    base: env.VITE_BASE_PATH || '/',
    plugins: [react()],
    server: { port: 5174, strictPort: true, proxy: { '/api': 'http://127.0.0.1:3101' } },
  };
});
