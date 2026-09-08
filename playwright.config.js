import { defineConfig, devices } from '@playwright/test';

const PREVIEW_PORT = 4173;
const baseURL = `http://localhost:${PREVIEW_PORT}`;
const isCi = Boolean(process.env.CI);

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 1 : 0,
  reporter: isCi ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'desktop-chromium',
      grepInvert: /@mobile/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'mobile-chromium',
      grepInvert: /@desktop/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 375, height: 812 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview',
    url: baseURL,
    reuseExistingServer: !isCi,
    timeout: 60_000,
  },
});
