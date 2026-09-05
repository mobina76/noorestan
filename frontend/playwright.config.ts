import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env['CI'] ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:4200', trace: 'on-first-retry' },
  webServer: {
    command: 'npm run start -- --host 127.0.0.1',
    url: 'http://127.0.0.1:4200',
    reuseExistingServer: false,
  },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    { name: 'tablet', use: { viewport: { width: 1024, height: 768 } } },
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
  ],
});
