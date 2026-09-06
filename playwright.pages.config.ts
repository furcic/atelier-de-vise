import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/pages',
  workers: 1,
  timeout: 30000,
  outputDir: '.local/pages-results',
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4174/atelier-de-vise/',
    channel: process.env.CI ? undefined : 'chrome',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run preview:pages',
    url: 'http://127.0.0.1:4174/atelier-de-vise/',
    reuseExistingServer: !process.env.CI,
  },
});
