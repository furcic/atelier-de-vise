import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/mobile',
  workers: 1,
  timeout: 30000,
  outputDir: '.local/mobile-results',
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4175/',
    channel: process.env.CI ? undefined : 'chrome',
    viewport: { width: 390, height: 844 },
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run preview:mobile',
    url: 'http://127.0.0.1:4175/',
    reuseExistingServer: !process.env.CI,
  },
});
