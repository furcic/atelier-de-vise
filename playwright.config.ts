import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  workers: 1,
  timeout: 30000,
  outputDir: '.local/browser-results',
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5174',
    channel: 'chrome',
    headless: true,
    screenshot: 'only-on-failure',
  },
});
