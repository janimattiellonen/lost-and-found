import { defineConfig, devices } from '@playwright/test';

// E2E config. Boots the React Router dev server on a dedicated port (avoids the
// default 3400 colliding with a running dev server) and runs Chromium.
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  // Serialize: tests share one dev server; running them in parallel races on
  // Vite's cold-start route compilation. One retry absorbs first-request lag.
  workers: 1,
  retries: 1,
  use: {
    baseURL: 'http://localhost:4321',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npx react-router dev --port 4321',
    url: 'http://localhost:4321',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
