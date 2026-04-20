import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
  webServer: [
    {
      command: 'make -C .. dev-backend',
      port: 3000,
      reuseExistingServer: !process.env.CI,
      timeout: 10_000,
    },
    {
      command: 'make -C .. dev-frontend',
      port: 5173,
      reuseExistingServer: !process.env.CI,
      timeout: 10_000,
    },
  ],
});
