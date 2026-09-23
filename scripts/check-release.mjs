// Store builds must point at the production API over HTTPS (no localhost, no demo).
import { loadEnv } from 'vite';

const api = loadEnv('mobile', process.cwd(), 'VITE_').VITE_API_URL || '';
if (!/^https:\/\/[^/]+\/?$/.test(api) || /localhost|127\.0\.0\.1/.test(api)) {
  console.error(
    `VITE_API_URL trebuie să fie adresa HTTPS publică a serverului (acum: "${api || 'lipsă'}").\n` +
      'Setează-l în .env.mobile.local, de ex. VITE_API_URL=https://atelierdevise.ro',
  );
  process.exit(1);
}
console.log(`Build pentru magazine cu API-ul ${api}`);
